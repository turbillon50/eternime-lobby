CREATE TABLE "clone_exchanges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_text" text NOT NULL,
	"clone_text" text NOT NULL,
	"profile_versions" text NOT NULL,
	"recognized" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clone_fact_versions" (
	"topic" text NOT NULL,
	"revision" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clone_fact_versions_topic_revision_pk" PRIMARY KEY("topic","revision")
);
--> statement-breakpoint
CREATE TABLE "clone_facts" (
	"topic" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL
);
