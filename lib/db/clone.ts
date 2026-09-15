import "server-only";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { eq } from "drizzle-orm";
import { getControlDb } from "@/lib/db/control";
import { users } from "@/lib/db/schema/control-plane";
import { decryptTenantUrl } from "@/lib/crypto/tenant-url";
import { CloneError } from "@/lib/clone/errors";

// Resolve solely from the authenticated Clerk ID; never accept a connection
// string, owner ID or database name from the request. Never fall back to Eon.
async function connection(clerkId: string) {
  const [owner] = await getControlDb().select({
    status: users.status, branchId: users.tenantBranchId, encrypted: users.tenantDbUrlEncrypted,
  }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!owner || owner.status !== "ready" || !owner.branchId || !owner.encrypted) {
    throw new CloneError("TENANT_UNAVAILABLE", "Tu espacio personal necesita reparación antes de iniciar el clon. Tus conversaciones con Eon siguen en su espacio actual.");
  }
  const url = new URL(decryptTenantUrl(owner.encrypted, clerkId));
  const name = `clone_${createHash("sha256").update(clerkId).digest("hex").slice(0, 24)}`;
  url.pathname = `/${name}`;
  return { url, name, branchId: owner.branchId };
}

export async function getCloneSql(clerkId: string) {
  const { url } = await connection(clerkId);
  const sql = neon(url.toString());
  try {
    await sql`SELECT topic FROM clone_facts LIMIT 0`;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "3D000" || code === "42P01") {
      throw new CloneError("CLONE_NOT_INITIALIZED", "Inicia la memoria de tu clon para continuar.", 409);
    }
    throw error;
  }
  return sql;
}

/** Explicit setup POST only. GET/chat never provisions branches or databases. */
export async function initializeClone(clerkId: string) {
  const { url, name, branchId } = await connection(clerkId);
  const key = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  if (!key || !projectId) throw new CloneError("NEON_UNAVAILABLE", "No se puede preparar la memoria del clon en este momento.");
  const base = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}/branches/${encodeURIComponent(branchId)}`;
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  // Verify the branch is not the shared control database's default branch.
  const branchResponse = await fetch(base, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!branchResponse.ok) throw new CloneError("NEON_UNAVAILABLE", "No se pudo verificar el espacio personal.");
  const branch = await branchResponse.json();
  if (branch.branch?.default !== false) throw new CloneError("ISOLATION_REQUIRED", "El clon requiere un espacio personal separado.");
  const existing = await fetch(`${base}/databases/${name}`, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (existing.status === 404) {
    const created = await fetch(`${base}/databases`, {
      method: "POST", headers, signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ database: { name, owner_name: decodeURIComponent(url.username) } }),
    });
    if (!created.ok) {
      // An overlapping setup or a lost response can have created it already.
      const check = await fetch(`${base}/databases/${name}`, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!check.ok) throw new CloneError("SETUP_FAILED", "No se pudo crear la memoria del clon. Puedes reintentar.");
    }
  } else if (!existing.ok) {
    throw new CloneError("NEON_UNAVAILABLE", "No se pudo consultar la memoria del clon.");
  }
  // A second PostgreSQL database on the person's existing branch/compute.
  // No branch copied from Eon and no destructive cleanup on partial failure.
  url.hostname = url.hostname.replace("-pooler.", ".");
  url.searchParams.delete("pgbouncer");
  const sql = neon(url.toString());
  // The management API can return before Postgres observes the new database.
  for (let attempt = 0; ; attempt++) {
    try { await sql`SELECT 1`; break; }
    catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= 4 || (code !== "3D000" && code !== "57P03")) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  await migrate(drizzle(sql), { migrationsFolder: "drizzle/clone" });
  return getCloneSql(clerkId);
}
