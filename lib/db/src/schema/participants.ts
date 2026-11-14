import { pgTable, serial, integer, text, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { registrations } from "./registrations";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").notNull().references(() => registrations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  fullNameAr: text("full_name_ar").notNull(),
  fullNameEn: text("full_name_en").notNull(),
  college: text("college").notNull(),
  collegeOther: text("college_other"),
  academicYear: text("academic_year").notNull(),
  phone: text("phone").notNull(),
  telegramUsername: text("telegram_username").notNull(),
}, (t) => [
  check("valid_role", sql`${t.role} IN ('LEADER','MEMBER','INDIVIDUAL')`),
  check("valid_phone", sql`${t.phone} ~ '^09[0-9]{8}$'`),
  uniqueIndex("one_applicant_per_registration").on(t.registrationId).where(sql`${t.role} IN ('LEADER','INDIVIDUAL')`),
]);
export const participantCourses = pgTable("participant_courses", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  course: text("course").notNull(),
  otherName: text("other_name"),
}, t => [uniqueIndex("unique_participant_course").on(t.participantId, t.course)]);

export const individualPreferences = pgTable("individual_preferences", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").notNull().unique().references(() => registrations.id, { onDelete: "cascade" }),
  friendName: text("friend_name"),
});
export const individualRoles = pgTable("individual_roles", {
  id: serial("id").primaryKey(),
  preferenceId: integer("preference_id").notNull().references(() => individualPreferences.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
}, t => [uniqueIndex("unique_individual_role").on(t.preferenceId, t.role)]);
