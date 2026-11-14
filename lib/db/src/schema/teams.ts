import { pgTable, serial, integer, text, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { registrations } from "./registrations";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").notNull().unique().references(() => registrations.id, { onDelete: "cascade" }),
  name: text("team_name").notNull(),
  totalMembers: integer("total_members").notNull(),
  completionStatus: text("completion_status").notNull(),
}, t => [check("team_size", sql`${t.totalMembers} BETWEEN 2 AND 6`)]);
export const teamNeeds = pgTable("team_needs", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  need: text("need").notNull(),
}, t => [uniqueIndex("unique_team_need").on(t.teamId, t.need)]);
export const projectIdeas = pgTable("project_ideas", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").notNull().unique().references(() => registrations.id, { onDelete: "cascade" }),
  status: text("idea_status").notNull(),
  title: text("title"),
  projectType: text("project_type"),
  description: text("description"),
  expectedTechnologies: text("expected_technologies"),
}, t => [
  check("idea_status", sql`${t.status} IN ('HAS_IDEA','NEEDS_IDEA')`),
  check("idea_fields", sql`${t.status} = 'NEEDS_IDEA' OR (
    ${t.title} IS NOT NULL AND length(trim(${t.title})) > 0 AND
    ${t.projectType} IS NOT NULL AND ${t.projectType} IN ('HARDWARE','AI','HYBRID') AND
    ${t.description} IS NOT NULL AND cardinality(regexp_split_to_array(trim(${t.description}), '\\s+')) BETWEEN 50 AND 300 AND
    ${t.expectedTechnologies} IS NOT NULL AND length(trim(${t.expectedTechnologies})) > 0
  )`),
]);
