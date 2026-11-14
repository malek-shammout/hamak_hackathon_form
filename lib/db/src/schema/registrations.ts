import { pgTable, serial, text, timestamp, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  referenceCode: text("reference_code").notNull().unique(),
  affiliationType: text("affiliation_type").notNull(),
  participationType: text("participation_type").notNull(),
  externalOrganizationName: text("external_organization_name"),
  termsWorkshopAccepted: boolean("terms_workshop_accepted").notNull(),
  termsEquipmentAccepted: boolean("terms_equipment_accepted").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("valid_affiliation", sql`${t.affiliationType} IN ('INTERNAL','EXTERNAL')`),
  check("valid_participation", sql`${t.participationType} IN ('TEAM','INDIVIDUAL')`),
  check("external_is_team", sql`${t.affiliationType} <> 'EXTERNAL' OR (${t.participationType} = 'TEAM' AND length(trim(${t.externalOrganizationName})) > 0 AND ${t.externalOrganizationName} IS NOT NULL)`),
  check("terms_accepted", sql`${t.termsWorkshopAccepted} AND ${t.termsEquipmentAccepted}`),
]);
