CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_code" text NOT NULL,
	"affiliation_type" text NOT NULL,
	"participation_type" text NOT NULL,
	"external_organization_name" text,
	"terms_workshop_accepted" boolean NOT NULL,
	"terms_equipment_accepted" boolean NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_reference_code_unique" UNIQUE("reference_code"),
	CONSTRAINT "valid_affiliation" CHECK ("registrations"."affiliation_type" IN ('INTERNAL','EXTERNAL')),
	CONSTRAINT "valid_participation" CHECK ("registrations"."participation_type" IN ('TEAM','INDIVIDUAL')),
	CONSTRAINT "external_is_team" CHECK ("registrations"."affiliation_type" <> 'EXTERNAL' OR ("registrations"."participation_type" = 'TEAM' AND length(trim("registrations"."external_organization_name")) > 0 AND "registrations"."external_organization_name" IS NOT NULL)),
	CONSTRAINT "terms_accepted" CHECK ("registrations"."terms_workshop_accepted" AND "registrations"."terms_equipment_accepted")
);
--> statement-breakpoint
CREATE TABLE "individual_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"friend_name" text,
	CONSTRAINT "individual_preferences_registration_id_unique" UNIQUE("registration_id")
);
--> statement-breakpoint
CREATE TABLE "individual_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"preference_id" integer NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"course" text NOT NULL,
	"other_name" text
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"role" text NOT NULL,
	"full_name_ar" text NOT NULL,
	"full_name_en" text NOT NULL,
	"college" text NOT NULL,
	"college_other" text,
	"academic_year" text NOT NULL,
	"phone" text NOT NULL,
	"telegram_username" text NOT NULL,
	CONSTRAINT "valid_role" CHECK ("participants"."role" IN ('LEADER','MEMBER','INDIVIDUAL')),
	CONSTRAINT "valid_phone" CHECK ("participants"."phone" ~ '^09[0-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "project_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"idea_status" text NOT NULL,
	"title" text,
	"project_type" text,
	"description" text,
	"expected_technologies" text,
	CONSTRAINT "project_ideas_registration_id_unique" UNIQUE("registration_id"),
	CONSTRAINT "idea_status" CHECK ("project_ideas"."idea_status" IN ('HAS_IDEA','NEEDS_IDEA')),
	CONSTRAINT "idea_fields" CHECK ("project_ideas"."idea_status" = 'NEEDS_IDEA' OR (
    "project_ideas"."title" IS NOT NULL AND length(trim("project_ideas"."title")) > 0 AND
    "project_ideas"."project_type" IS NOT NULL AND "project_ideas"."project_type" IN ('HARDWARE','AI','HYBRID') AND
    "project_ideas"."description" IS NOT NULL AND cardinality(regexp_split_to_array(trim("project_ideas"."description"), '\s+')) BETWEEN 50 AND 300 AND
    "project_ideas"."expected_technologies" IS NOT NULL AND length(trim("project_ideas"."expected_technologies")) > 0
  ))
);
--> statement-breakpoint
CREATE TABLE "team_needs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"need" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"team_name" text NOT NULL,
	"total_members" integer NOT NULL,
	"completion_status" text NOT NULL,
	CONSTRAINT "teams_registration_id_unique" UNIQUE("registration_id"),
	CONSTRAINT "team_size" CHECK ("teams"."total_members" BETWEEN 2 AND 6)
);
--> statement-breakpoint
CREATE TABLE "hmk_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"hits" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hmk_sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "individual_preferences" ADD CONSTRAINT "individual_preferences_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_roles" ADD CONSTRAINT "individual_roles_preference_id_individual_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."individual_preferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_courses" ADD CONSTRAINT "participant_courses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ideas" ADD CONSTRAINT "project_ideas_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_needs" ADD CONSTRAINT "team_needs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_individual_role" ON "individual_roles" USING btree ("preference_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_participant_course" ON "participant_courses" USING btree ("participant_id","course");--> statement-breakpoint
CREATE UNIQUE INDEX "one_applicant_per_registration" ON "participants" USING btree ("registration_id") WHERE "participants"."role" IN ('LEADER','INDIVIDUAL');--> statement-breakpoint
CREATE UNIQUE INDEX "unique_team_need" ON "team_needs" USING btree ("team_id","need");--> statement-breakpoint
CREATE INDEX "session_expiry" ON "hmk_sessions" USING btree ("expire");