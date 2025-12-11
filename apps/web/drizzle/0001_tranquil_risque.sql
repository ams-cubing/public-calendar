CREATE TABLE "region" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"map_color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "state" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region_id" text NOT NULL,
	CONSTRAINT "state_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "competition" ADD COLUMN "state_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "state" ADD CONSTRAINT "state_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition" ADD CONSTRAINT "competition_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;