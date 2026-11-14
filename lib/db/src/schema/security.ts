import { pgTable, text, json, timestamp, integer, index } from "drizzle-orm/pg-core";
// JSON is limited to ephemeral session metadata, never registration records.
export const sessions = pgTable("hmk_sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, t => [index("session_expiry").on(t.expire)]);
export const rateLimits = pgTable("hmk_rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
