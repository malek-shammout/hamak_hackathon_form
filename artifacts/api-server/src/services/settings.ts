import { eq, sql } from "drizzle-orm";
import { db, registrationSettings } from "@workspace/db";
import { DEFAULT_DEADLINE } from "../lib/registration-validation";

export type RegistrationMode = "AUTO" | "OPEN" | "CLOSED";
export type RegistrationState = {
  mode: RegistrationMode;
  deadline: string;
  closedMessage: string;
  open: boolean;
  updatedAt: string | null;
};
type Executor = Pick<typeof db, "select">;

export function isOpen(mode: RegistrationMode, deadline: string, now = Date.now()) {
  if (mode === "OPEN") return true;
  if (mode === "CLOSED") return false;
  return now <= Date.parse(deadline);
}

/** Reads the organizer settings row. Falls back to the built-in deadline when no row exists yet. */
export async function getRegistrationState(executor: Executor = db): Promise<RegistrationState> {
  const [row] = await executor.select().from(registrationSettings).where(eq(registrationSettings.id, 1)).limit(1);
  const mode = (row?.mode ?? "AUTO") as RegistrationMode;
  const deadline = row ? row.deadline.toISOString() : new Date(DEFAULT_DEADLINE).toISOString();
  return {
    mode, deadline,
    closedMessage: row?.closedMessage ?? "",
    open: isOpen(mode, deadline),
    updatedAt: row ? row.updatedAt.toISOString() : null,
  };
}

export async function updateRegistrationSettings(input: { mode: RegistrationMode; deadline: string; closedMessage: string }) {
  const values = { mode: input.mode, deadline: new Date(input.deadline), closedMessage: input.closedMessage.trim() };
  await db.insert(registrationSettings).values({ id: 1, ...values })
    .onConflictDoUpdate({ target: registrationSettings.id, set: { ...values, updatedAt: sql`now()` } });
  return getRegistrationState();
}
