/**
 * Control plane Drizzle client (shared DB — `main` branch of the Neon project).
 *
 * Use this ONLY for routing/billing/compliance tables (users, tenants_registry,
 * subscriptions, audit log, waitlist). Personal user data must never be queried
 * here — it lives in per-user tenant branches resolved via `getTenantDb()`.
 */
import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema/control-plane";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getControlDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL (control plane connection string).");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export { schema as controlSchema };
