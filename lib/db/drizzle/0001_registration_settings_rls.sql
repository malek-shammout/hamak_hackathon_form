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
--> statement-breakpoint
ALTER TABLE "hmk_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "individual_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "individual_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "participant_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_ideas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_needs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hmk_rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hmk_sessions" ENABLE ROW LEVEL SECURITY;