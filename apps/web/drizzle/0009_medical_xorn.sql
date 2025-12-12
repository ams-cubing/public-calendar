CREATE TABLE "competition_delegate" (
	"competition_id" serial NOT NULL,
	"delegate_wca_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competition" DROP CONSTRAINT "competition_primary_delegate_id_user_wca_id_fk";
--> statement-breakpoint
ALTER TABLE "competition_delegate" ADD CONSTRAINT "competition_delegate_competition_id_competition_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_delegate" ADD CONSTRAINT "competition_delegate_delegate_wca_id_user_wca_id_fk" FOREIGN KEY ("delegate_wca_id") REFERENCES "public"."user"("wca_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" DROP COLUMN "primary_delegate_id";