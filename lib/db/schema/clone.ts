import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// This schema is migrated ONLY to the separate per-person clone database.
export const cloneFacts = pgTable("clone_facts", {
  topic: text("topic").primaryKey(),
  content: text("content").notNull(),
  revision: integer("revision").notNull().default(1),
});
export const cloneFactVersions = pgTable("clone_fact_versions", {
  topic: text("topic").notNull(),
  revision: integer("revision").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.topic, table.revision] })]);
export const cloneExchanges = pgTable("clone_exchanges", {
  id: uuid("id").primaryKey(),
  userText: text("user_text").notNull(),
  cloneText: text("clone_text").notNull(),
  profileVersions: text("profile_versions").notNull(),
  recognized: boolean("recognized"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
