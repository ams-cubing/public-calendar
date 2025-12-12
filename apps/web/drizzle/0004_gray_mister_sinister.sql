ALTER TABLE "availability" ALTER COLUMN "is_available" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "availability" ALTER COLUMN "is_available" SET NOT NULL;