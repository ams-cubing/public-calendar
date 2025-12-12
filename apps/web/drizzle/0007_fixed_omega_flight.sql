ALTER TABLE "availability" RENAME TO "unavailability";--> statement-breakpoint
ALTER TABLE "unavailability" DROP CONSTRAINT "availability_user_wca_id_user_wca_id_fk";
--> statement-breakpoint
ALTER TABLE "unavailability" ADD CONSTRAINT "unavailability_user_wca_id_user_wca_id_fk" FOREIGN KEY ("user_wca_id") REFERENCES "public"."user"("wca_id") ON DELETE cascade ON UPDATE no action;