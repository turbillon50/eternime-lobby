/**
 * Control Plane schema (shared database — branch `main` of the Neon project).
 *
 * This is the single, shared registry that maps every Eternime account to its
 * own private tenant database branch. It NEVER stores personal memories — only
 * the routing, billing, and compliance metadata required to resolve a request
 * to the correct isolated tenant.
 *
 * Personal data (memories, conversations, voice clones, ...) lives exclusively
 * in the per-user tenant branch described in `./tenant.ts`.
 */
import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Lifecycle of an account while its private tenant branch is being provisioned. */
export const userStatusEnum = pgEnum("user_status", [
  "pending", // account created, tenant branch not ready yet
  "provisioning", // branch creation / migration in flight
  "ready", // tenant ready, user can use the app
  "error", // provisioning failed — safe to retry
  "suspended",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "pending",
  "active",
  "suspended",
  "archived",
]);

/**
 * Every authenticated person. `clerk_id` is the external identity from Clerk.
 * `tenant_db_url_encrypted` is the AES-256-GCM ciphertext of the tenant branch
 * connection string (see `lib/crypto/tenant-url.ts`) — it is NEVER exposed to
 * the client and NEVER decrypted outside server code.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    locale: text("locale").notNull().default("es-MX"),
    plan: text("plan").notNull().default("free"),
    status: userStatusEnum("status").notNull().default("pending"),

    // Tenant routing — populated once the Neon branch is provisioned.
    tenantBranchId: text("tenant_branch_id"),
    tenantDbUrlEncrypted: text("tenant_db_url_encrypted"),

    // Default ElevenLabs voice until the user clones their own.
    voiceIdElevenlabs: text("voice_id_elevenlabs"),

    // Lightweight personality seed captured during onboarding. The rich,
    // evolving profile lives in the tenant DB (`personality_profile`).
    personalitySeed: jsonb("personality_seed"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

/** One row per provisioned tenant branch — operational metadata for billing/ops. */
export const tenantsRegistry = pgTable(
  "tenants_registry",
  {
    branchId: text("branch_id").primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: tenantStatusEnum("status").notNull().default("pending"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tenants_registry_owner_idx").on(table.ownerUserId)],
);

/** Future Stripe billing. Kept minimal until Fase 4+. */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("inactive"),
  renewalAt: timestamp("renewal_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only audit trail for compliance — every sensitive access is logged. */
export const globalAuditLog = pgTable(
  "global_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource"),
    metadata: jsonb("metadata"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("global_audit_log_user_idx").on(table.userId)],
);

/** Pre-registration capture for the cinematic lobby. */
export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    locale: text("locale").default("es-MX"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("waitlist_email_idx").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TenantRegistryRow = typeof tenantsRegistry.$inferSelect;
