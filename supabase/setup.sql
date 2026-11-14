-- =====================================================================
-- HMK Hackathon — Supabase database setup (run ONCE on a new project)
-- Supabase Dashboard → SQL Editor → New query → paste this file → Run
--
-- Generated from lib/db/src/schema (Drizzle migrations 0000 + 0001). Creates
-- all tables, the organizer settings row, and locks the tables away from
-- Supabase's public REST API: only the Vercel server (connecting as the
-- postgres role through DATABASE_URL) can read or write registration data.
-- =====================================================================

BEGIN;

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

CREATE TABLE "individual_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"friend_name" text,
	CONSTRAINT "individual_preferences_registration_id_unique" UNIQUE("registration_id")
);

CREATE TABLE "individual_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"preference_id" integer NOT NULL,
	"role" text NOT NULL
);

CREATE TABLE "participant_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"course" text NOT NULL,
	"other_name" text
);

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

CREATE TABLE "team_needs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"need" text NOT NULL
);

CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_id" integer NOT NULL,
	"team_name" text NOT NULL,
	"total_members" integer NOT NULL,
	"completion_status" text NOT NULL,
	CONSTRAINT "teams_registration_id_unique" UNIQUE("registration_id"),
	CONSTRAINT "team_size" CHECK ("teams"."total_members" BETWEEN 2 AND 6)
);

CREATE TABLE "hmk_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"hits" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);

CREATE TABLE "hmk_sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);

ALTER TABLE "individual_preferences" ADD CONSTRAINT "individual_preferences_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "individual_roles" ADD CONSTRAINT "individual_roles_preference_id_individual_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."individual_preferences"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "participant_courses" ADD CONSTRAINT "participant_courses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "participants" ADD CONSTRAINT "participants_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "project_ideas" ADD CONSTRAINT "project_ideas_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "team_needs" ADD CONSTRAINT "team_needs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "teams" ADD CONSTRAINT "teams_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "unique_individual_role" ON "individual_roles" USING btree ("preference_id","role");

CREATE UNIQUE INDEX "unique_participant_course" ON "participant_courses" USING btree ("participant_id","course");

CREATE UNIQUE INDEX "one_applicant_per_registration" ON "participants" USING btree ("registration_id") WHERE "participants"."role" IN ('LEADER','INDIVIDUAL');

CREATE UNIQUE INDEX "unique_team_need" ON "team_needs" USING btree ("team_id","need");

CREATE INDEX "session_expiry" ON "hmk_sessions" USING btree ("expire");
CREATE TABLE "hmk_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"mode" text DEFAULT 'AUTO' NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"closed_message" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "single_settings_row" CHECK ("hmk_settings"."id" = 1),
	CONSTRAINT "valid_mode" CHECK ("hmk_settings"."mode" IN ('AUTO','OPEN','CLOSED')),
	CONSTRAINT "closed_message_length" CHECK (length("hmk_settings"."closed_message") <= 600)
);



-- Default registration window: follows the deadline automatically.
INSERT INTO public."hmk_settings" ("id", "mode", "deadline", "closed_message")
VALUES (1, 'AUTO', '2026-12-01T23:59:59+03:00', '')
ON CONFLICT ("id") DO NOTHING;

-- Security: Supabase exposes the public schema through its REST API with the
-- anon key. Enable RLS with NO policies and revoke grants so participant data
-- is never reachable from the browser. The server role (owner) bypasses RLS.
ALTER TABLE public."registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."individual_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."individual_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."participant_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_ideas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_needs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."hmk_rate_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."hmk_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."hmk_settings" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."registrations" FROM anon, authenticated;
REVOKE ALL ON TABLE public."individual_preferences" FROM anon, authenticated;
REVOKE ALL ON TABLE public."individual_roles" FROM anon, authenticated;
REVOKE ALL ON TABLE public."participant_courses" FROM anon, authenticated;
REVOKE ALL ON TABLE public."participants" FROM anon, authenticated;
REVOKE ALL ON TABLE public."project_ideas" FROM anon, authenticated;
REVOKE ALL ON TABLE public."team_needs" FROM anon, authenticated;
REVOKE ALL ON TABLE public."teams" FROM anon, authenticated;
REVOKE ALL ON TABLE public."hmk_rate_limits" FROM anon, authenticated;
REVOKE ALL ON TABLE public."hmk_sessions" FROM anon, authenticated;
REVOKE ALL ON TABLE public."hmk_settings" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

COMMIT;

-- Check: should list 11 tables, all with rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
