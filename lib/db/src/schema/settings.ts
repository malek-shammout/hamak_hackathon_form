import { pgTable, integer, text, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Single-row table (id = 1) holding organizer-controlled registration settings.
// mode: AUTO = open until the deadline, OPEN = forced open, CLOSED = forced closed.
export const registrationSettings = pgTable("hmk_settings", {
  id: integer("id").primaryKey().default(1),
  mode: text("mode").notNull().default("AUTO"),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  closedMessage: text("closed_message").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("single_settings_row", sql`${t.id} = 1`),
  check("valid_mode", sql`${t.mode} IN ('AUTO','OPEN','CLOSED')`),
  check("closed_message_length", sql`length(${t.closedMessage}) <= 600`),
]).enableRLS();
