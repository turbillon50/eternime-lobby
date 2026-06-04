/**
 * Tenant schema — the PRIVATE database branch created for each user.
 *
 * Every row here belongs to exactly one person. There is one physical Neon
 * branch per user, so isolation is at the database level: a query against a
 * tenant client can only ever see that user's data. Cross-tenant queries are
 * structurally impossible (see `lib/db/tenant.ts#getTenantDb`).
 *
 * Embeddings use pgvector with 3072 dimensions (`gemini-embedding-001`).
 * The `vector` extension must be enabled on the branch before these tables are
 * created — handled by the provisioning DDL in `lib/tenant/tenant-init.sql`.
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const memoryTypeEnum = pgEnum("memory_type", [
  "text",
  "audio",
  "video",
  "photo",
  "document",
]);

export const memorySourceEnum = pgEnum("memory_source", [
  "manual",
  "conversation",
  "imported",
  "scheduled",
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "ai"]);

export const voiceCloneTypeEnum = pgEnum("voice_clone_type", [
  "instant",
  "professional",
]);

/** A single preserved memory — the atomic unit of the vault. */
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: memoryTypeEnum("type").notNull().default("text"),
    title: text("title"),
    contentText: text("content_text"),
    blobUrl: text("blob_url"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    category: text("category"),
    tags: text("tags").array(),
    embedding: vector("embedding", { dimensions: 3072 }),
    importanceScore: real("importance_score").default(0.5),
    source: memorySourceEnum("source").notNull().default("manual"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete by default
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("memories_created_idx").on(table.createdAt)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  summary: text("summary"),
  messageCount: integer("message_count").notNull().default(0),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    audioUrl: text("audio_url"),
    embedding: vector("embedding", { dimensions: 3072 }),
    tokens: integer("tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId)],
);

/**
 * Single-row evolving identity (id = 1). `system_prompt` is the personalized
 * layer that is composed on top of the immutable Eternime AI base prompt.
 */
export const personalityProfile = pgTable("personality_profile", {
  id: integer("id").primaryKey().default(1),
  systemPrompt: text("system_prompt").notNull(),
  values: jsonb("values"),
  communicationStyle: jsonb("communication_style"),
  memoriesSummary: text("memories_summary"),
  version: integer("version").notNull().default(1),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voiceClones = pgTable("voice_clones", {
  id: uuid("id").defaultRandom().primaryKey(),
  elevenlabsVoiceId: text("elevenlabs_voice_id"),
  type: voiceCloneTypeEnum("type").notNull().default("instant"),
  audioSamplesUrls: text("audio_samples_urls").array(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  blobUrl: text("blob_url"),
  extractedText: text("extracted_text"),
  embedding: vector("embedding", { dimensions: 3072 }),
  docType: text("doc_type"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventDate: date("event_date"),
  title: text("title"),
  description: text("description"),
  peopleInvolved: text("people_involved").array(),
  location: text("location"),
  photosUrls: text("photos_urls").array(),
  importance: real("importance").default(0.5),
  embedding: vector("embedding", { dimensions: 3072 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const relationships = pgTable("relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  relation: text("relation"),
  photosUrls: text("photos_urls").array(),
  notes: text("notes"),
  importantDates: jsonb("important_dates"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Global per-user settings blob (theme, language, voice preference, ...). */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyPromptsLog = pgTable("daily_prompts_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  prompt: text("prompt"),
  promptedAt: timestamp("prompted_at", { withTimezone: true }).notNull().defaultNow(),
  userResponse: text("user_response"),
  processed: boolean("processed").notNull().default(false),
});

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type PersonalityProfile = typeof personalityProfile.$inferSelect;
