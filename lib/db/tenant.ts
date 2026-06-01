/**
 * Per-request tenant database resolution.
 *
 * This is the ONLY supported way to reach user data. Every user-side query must
 * go through `getTenantDb(clerkId)`, never through the control-plane client.
 *
 * Guard rails (per spec — "NUNCA ejecutar queries cruzadas entre tenants"):
 *   1. The function takes a `clerkId` and resolves the connection string
 *      internally from the control plane. Callers can never pass an arbitrary
 *      DB URL, so a request for user A can never be pointed at user B's branch.
 *   2. The connection string is stored encrypted and decrypted with a key
 *      derived from that same `clerkId` — a mismatch fails to decrypt.
 *   3. Clients are cached per `clerkId` with a short TTL to avoid rebuilding a
 *      Drizzle client on every request, while still picking up rotations.
 */
import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

import { decryptTenantUrl } from "@/lib/crypto/tenant-url";
import { getControlDb } from "@/lib/db/control";
import { users } from "@/lib/db/schema/control-plane";
import * as tenantSchema from "@/lib/db/schema/tenant";

export type TenantDb = ReturnType<typeof drizzle<typeof tenantSchema>>;

interface CacheEntry {
  db: TenantDb;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes per spec
const cache = new Map<string, CacheEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export class TenantNotReadyError extends Error {
  constructor(clerkId: string) {
    super(`Tenant for user ${clerkId} is not provisioned yet.`);
    this.name = "TenantNotReadyError";
  }
}

/**
 * Resolve (and cache) the isolated Drizzle client for one user.
 * Throws `TenantNotReadyError` if the user has no provisioned branch yet — the
 * caller (e.g. onboarding) should treat that as "still building your vault".
 */
export async function getTenantDb(clerkId: string): Promise<TenantDb> {
  const now = Date.now();
  const cached = cache.get(clerkId);
  if (cached && cached.expiresAt > now) return cached.db;
  pruneExpired(now);

  const control = getControlDb();
  const [user] = await control
    .select({
      status: users.status,
      encrypted: users.tenantDbUrlEncrypted,
    })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user || !user.encrypted || user.status !== "ready") {
    throw new TenantNotReadyError(clerkId);
  }

  const url = decryptTenantUrl(user.encrypted, clerkId);
  const db = drizzle(neon(url), { schema: tenantSchema });
  cache.set(clerkId, { db, expiresAt: now + CACHE_TTL_MS });
  return db;
}

/** Invalidate a cached tenant client (call after rotating its connection URL). */
export function invalidateTenantCache(clerkId: string): void {
  cache.delete(clerkId);
}

export { tenantSchema };
