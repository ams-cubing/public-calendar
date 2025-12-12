ALTER TABLE "competition" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "competition" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;