import { defineConfig } from "drizzle-kit";

/**
 * Tenant schema. These migrations are NOT applied to a single shared DB — the
 * generated SQL is the source of truth that gets applied to every new per-user
 * Neon branch during provisioning (see `lib/tenant/provision.ts`).
 *
 * Run `npm run db:generate:tenant` after editing the tenant schema, then
 * regenerate `lib/tenant/tenant-init.sql` with `npm run db:build-tenant-init`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/tenant.ts",
  out: "./drizzle/tenant",
  strict: true,
});
