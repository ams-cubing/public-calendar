ALTER TABLE "availability" DROP CONSTRAINT "availability_user_wca_id_weekend_start_pk";--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "end_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "availability" DROP COLUMN "weekend_start";