CREATE INDEX IF NOT EXISTS "memories_embedding_hnsw"
ON "memories" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eon_memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" text DEFAULT 'inference' NOT NULL,
  "content" text NOT NULL,
  "source_ref" text,
  "confidence" real DEFAULT 0.7 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identity_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pose" text NOT NULL,
  "blob_url" text NOT NULL,
  "mime" text,
  "consented_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
