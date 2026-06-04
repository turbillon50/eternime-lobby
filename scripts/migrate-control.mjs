/**
 * Applies the control-plane migrations to the shared Neon `main` branch.
 *
 * Runs as part of the Vercel build (`build` script) so the shared tables
 * (`users`, `tenants_registry`, …) exist before any webhook or on-demand
 * provisioning writes to them. Idempotent: Drizzle's migrator tracks applied
 * migrations, so re-running on every deploy is a no-op.
 *
 * Fail-safe: if no database URL is available (e.g. local/CI without secrets),
 * it SKIPS and exits 0 so the build never breaks. Clear markers are printed so
 * the outcome is visible in build logs.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const MARK = "[migrate-control]";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.warn(`${MARK} SKIP — no DATABASE_URL(_UNPOOLED) present at build.`);
    return;
  }

  try {
    const db = drizzle(neon(url));
    await migrate(db, { migrationsFolder: "drizzle/control" });
    console.log(`${MARK} OK — control-plane schema is up to date.`);

    // Print a quick confirmation of the key tables for build-log visibility.
    const sql = neon(url);
    const rows = await sql.query(
      `select table_name from information_schema.tables
       where table_schema = 'public'
         and table_name in ('users','tenants_registry','subscriptions','global_audit_log','waitlist')
       order by table_name`,
    );
    console.log(`${MARK} tables present: ${rows.map((r) => r.table_name).join(", ") || "(none)"}`);
  } catch (error) {
    // Never break the deploy — surface the error loudly instead.
    console.error(`${MARK} ERROR — migration failed:`, error?.message || error);
  }
}

main();
