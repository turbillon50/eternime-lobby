import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/clone.ts",
  out: "./drizzle/clone",
  strict: true,
});
