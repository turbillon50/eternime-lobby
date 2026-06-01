import { defineConfig } from "drizzle-kit";

/**
 * Control plane (shared DB — `main` branch). Apply these migrations once to the
 * shared database: `npm run db:migrate:control`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/control-plane.ts",
  out: "./drizzle/control",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
});
