CREATE TYPE "public"."internal_status" AS ENUM('draft', 'looking_for_venue', 'ultimatum_sent', 'ready');--> statement-breakpoint
CREATE TYPE "public"."public_status" AS ENUM('open', 'reserved', 'confirmed', 'announced', 'suspended', 'unavailable');--> statement-breakpoint
CREATE TABLE "availability" (
	"user_wca_id" text NOT NULL,
	"weekend_start" date NOT NULL,
	"is_available" boolean DEFAULT true,
	"note" text,
	CONSTRAINT "availability_user_wca_id_weekend_start_pk" PRIMARY KEY("user_wca_id","weekend_start")
);
--> statement-breakpoint
CREATE TABLE "competition" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"city" text NOT NULL,
	"primary_delegate_id" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status_public" "public_status" DEFAULT 'reserved' NOT NULL,
	"status_internal" "internal_status" DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"wca_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"region_id" text,
	"last_login" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_wca_id_user_wca_id_fk" FOREIGN KEY ("user_wca_id") REFERENCES "public"."user"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_primary_delegate_id_user_wca_id_fk" FOREIGN KEY ("primary_delegate_id") REFERENCES "public"."user"("wca_id") ON DELETE no action ON UPDATE no action;