CREATE TABLE "competition_organizer" (
	"competition_id" serial NOT NULL,
	"organizer_wca_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competition" ALTER COLUMN "requested_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competition_organizer" ADD CONSTRAINT "competition_organizer_competition_id_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_organizer" ADD CONSTRAINT "competition_organizer_organizer_wca_id_user_wca_id_fk" FOREIGN KEY ("organizer_wca_id") REFERENCES "public"."user"("wca_id") ON DELETE cascade ON UPDATE no action;