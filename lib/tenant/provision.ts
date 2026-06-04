/**
 * Tenant provisioning orchestrator.
 *
 * Given a freshly-created Clerk account, this:
 *   a) creates a private Neon branch for the user,
 *   b) applies the tenant schema (DDL from `tenant-init.sql`) to that branch,
 *   c) seeds the single-row `personality_profile` with the immutable Eternime
 *      AI base prompt,
 *   d) encrypts the branch connection URL and stores it on the control-plane
 *      `users` row,
 *   e) marks the user `ready` and records the tenant in `tenants_registry`.
 *
 * Idempotent: if the user already has a `tenantBranchId`, it is a no-op. This is
 * important because Clerk may deliver `user.created` more than once.
 */
import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

import { buildBaseSystemPrompt } from "@/lib/ai/prompts";
import { encryptTenantUrl } from "@/lib/crypto/tenant-url";
import { getControlDb } from "@/lib/db/control";
import { tenantsRegistry, users } from "@/lib/db/schema/control-plane";
import { createTenantBranch, deleteTenantBranch } from "@/lib/neon/branches";

// Read once at module load — the DDL is a build artifact committed to the repo.
let tenantInitSql: string | null = null;
function loadTenantInitSql(): string {
  if (tenantInitSql) return tenantInitSql;
  tenantInitSql = readFileSync(
    join(process.cwd(), "lib", "tenant", "tenant-init.sql"),
    "utf8",
  );
  return tenantInitSql;
}

/** Apply the tenant DDL to a freshly created branch, statement by statement. */
async function applyTenantSchema(unpooledUrl: string): Promise<void> {
  const sql = neon(unpooledUrl);
  const statements = loadTenantInitSql()
    .split("--> statement-breakpoint")
    // Strip comment-only lines WITHIN each segment (e.g. the generated header
    // that is bundled with `CREATE EXTENSION vector`) so we keep the real SQL.
    .map((segment) =>
      segment
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    // neon-http executes one statement per call; run sequentially to preserve
    // dependency order (extensions/enums before tables that use them).
    await sql.query(statement);
  }
}

/** Seed the evolving personality profile with the immutable base prompt. */
async function seedPersonality(unpooledUrl: string, name: string): Promise<void> {
  const sql = neon(unpooledUrl);
  await sql.query(
    `INSERT INTO personality_profile (id, system_prompt, version)
     VALUES (1, $1, 1)
     ON CONFLICT (id) DO NOTHING`,
    [buildBaseSystemPrompt(name)],
  );
}

export interface ProvisionInput {
  clerkId: string;
  email: string;
  name?: string;
  locale?: string;
}

export type ProvisionResult =
  | { status: "ready"; alreadyProvisioned: boolean; branchId: string }
  | { status: "error"; error: string };

export async function provisionTenant(input: ProvisionInput): Promise<ProvisionResult> {
  const control = getControlDb();

  // Ensure a control-plane user row exists (idempotent upsert on clerk_id).
  const [existing] = await control
    .insert(users)
    .values({
      clerkId: input.clerkId,
      email: input.email,
      name: input.name,
      locale: input.locale ?? "es-MX",
      status: "provisioning",
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email: input.email, name: input.name },
    })
    .returning();

  // Already has a branch → nothing to do (idempotency guard).
  if (existing?.tenantBranchId && existing.status === "ready") {
    return { status: "ready", alreadyProvisioned: true, branchId: existing.tenantBranchId };
  }

  let branchId: string | undefined;
  try {
    const branch = await createTenantBranch(input.clerkId);
    branchId = branch.branchId;

    await applyTenantSchema(branch.unpooledUrl);
    await seedPersonality(branch.unpooledUrl, input.name ?? "");

    // Store the POOLED url (app traffic) encrypted under the per-user key.
    const encrypted = encryptTenantUrl(branch.pooledUrl, input.clerkId);

    await control
      .update(users)
      .set({
        status: "ready",
        tenantBranchId: branch.branchId,
        tenantDbUrlEncrypted: encrypted,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, input.clerkId));

    await control
      .insert(tenantsRegistry)
      .values({ branchId: branch.branchId, ownerUserId: existing.id, status: "active" })
      .onConflictDoNothing();

    return { status: "ready", alreadyProvisioned: false, branchId: branch.branchId };
  } catch (error) {
    // Best-effort rollback of the branch so a retry starts clean.
    if (branchId) {
      await deleteTenantBranch(branchId).catch(() => {});
    }
    await control
      .update(users)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(users.clerkId, input.clerkId))
      .catch(() => {});
    const message = error instanceof Error ? error.message : "Unknown provisioning error";
    return { status: "error", error: message };
  }
}
