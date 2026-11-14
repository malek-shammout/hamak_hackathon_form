/**
 * Development-only verification. No production access, real passwords, or PII.
 * Run with: pnpm --filter @workspace/scripts exec tsx ../artifacts/api-server/src/verification.test.ts
 */
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { db, registrations, participants, participantCourses, teams, teamNeeds, projectIdeas, individualPreferences, individualRoles, pool } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { registrationSchema, registrationOpen, DEADLINE, countWords, type RegistrationData } from "./lib/registration-validation";
import { COLLEGES, YEARS, COURSES, NEEDS, ROLES } from "./lib/options";
import { readRegistrations, removeRegistration, saveRegistration, summarize } from "./services/registrations";
import { csvExport, excelExport } from "./services/exports";

if (process.env.NODE_ENV === "production") throw new Error("Development verification only");
const baseUrl = "http://localhost:80/api";
let checks = 0;
const check = (condition: unknown, label: string) => { assert.ok(condition, label); checks++; };
const person = () => ({
  fullNameAr: "تجربة اختبار منصة",
  fullNameEn: "Platform Verification Person",
  college: COLLEGES[0]!, academicYear: YEARS[0]!,
  phone: "0990000000", telegramUsername: "@hmk_test",
  courses: [COURSES[1]!],
});
const input = (kind: "TEAM" | "INDIVIDUAL" = "INDIVIDUAL", external = false, hasIdea = false, size = 2): RegistrationData => ({
  affiliationType: external ? "EXTERNAL" : "INTERNAL",
  participationType: kind,
  ...(external ? { externalOrganizationName: "جهة اختبار مؤقتة" } : {}),
  applicant: person(),
  ...(kind === "TEAM"
    ? { team: { name: "فريق تحقق مؤقت", totalMembers: size, members: Array.from({ length: size - 1 }, person), needs: [NEEDS[0]!] } }
    : { preferences: { roles: [ROLES[0]!], friendName: "صديق اختبار" } }),
  idea: hasIdea ? {
    status: "HAS_IDEA", title: "مشروع اختبار مؤقت", projectType: "HYBRID",
    description: Array(50).fill("اختبار").join(" "), expectedTechnologies: "ESP32",
  } : { status: "NEEDS_IDEA" },
  termsWorkshopAccepted: true, termsEquipmentAccepted: true,
});
const valid = (r: unknown) => registrationSchema.safeParse(r).success;
const addedIds: number[] = [];
try {
  check(valid(input()), "individual without idea");
  check(valid(input("INDIVIDUAL", false, true)), "individual with idea");
  check(valid(input("TEAM", false, false, 2)), "two-person team without idea");
  check(valid(input("TEAM", false, true, 6)), "six-person team with idea");
  check(valid(input("TEAM", true, true)), "external team with idea");
  check(!valid(input("TEAM", true, false)), "external without idea rejected");
  check(!valid(input("INDIVIDUAL", true, true)), "external individual rejected");
  check(!valid(input("TEAM", false, true, 7)), "seven members rejected");
  const mismatch = input("TEAM"); mismatch.team!.totalMembers = 4;
  check(!valid(mismatch), "member count mismatch rejected");
  const noCourses = input(); noCourses.applicant.courses = [COURSES[0]!, COURSES[1]!];
  check(!valid(noCourses), "exclusive no-course selection");
  const conflictingNeeds = input("TEAM"); conflictingNeeds.team!.needs.push(NEEDS[1]!);
  check(!valid(conflictingNeeds), "exclusive complete-team selection");
  for (const count of [49, 50, 300, 301]) {
    const r = input("INDIVIDUAL", false, true);
    r.idea.description = Array(count).fill("كلمة").join(" ");
    check(valid(r) === (count >= 50 && count <= 300), `word boundary ${count}`);
  }
  check(countWords("  كلمة \n ثانية  ") === 2, "whitespace word count");
  check(!valid({ ...input(), termsWorkshopAccepted: false }), "workshop terms required");
  check(!valid({ ...input(), termsEquipmentAccepted: false }), "equipment terms required");
  const badPhone = input(); badPhone.applicant.phone = "123";
  check(!valid(badPhone), "invalid phone rejected");
  const other = input(); other.applicant.college = "أخرى";
  check(!valid(other), "other college requires detail");
  const otherCourse = input(); otherCourse.applicant.courses = ["دورة أخرى"];
  check(!valid(otherCourse), "other course requires detail");
  check(registrationOpen(Date.parse(DEADLINE) - 1), "before deadline open");
  check(!registrationOpen(Date.parse(DEADLINE) + 1), "after deadline closed");

  const config = await fetch(`${baseUrl}/registration-config`);
  check(config.ok, "public config accessible");
  for (const path of ["/admin/summary", "/admin/registrations", "/admin/registrations/1", "/admin/export/csv", "/admin/export/xlsx"]) {
    check((await fetch(`${baseUrl}${path}`)).status === 401, `private endpoint ${path}`);
  }
  check((await fetch(`${baseUrl}/admin/registrations/1`, { method: "DELETE" })).status === 401, "unauthorized deletion blocked");
  check((await fetch(`${baseUrl}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "not-a-real-password" }) })).status === 403, "login CSRF required");
  const session = await fetch(`${baseUrl}/admin/session`);
  const cookie = session.headers.get("set-cookie")?.split(";")[0] ?? "";
  const sessionData = await session.json() as { csrfToken: string; authenticated: boolean };
  check(!sessionData.authenticated && !!sessionData.csrfToken, "anonymous session");
  const wrongLogin = await fetch(`${baseUrl}/admin/login`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie, "X-CSRF-Token": sessionData.csrfToken },
    body: JSON.stringify({ password: "deliberately-invalid-test-input" }),
  });
  check(wrongLogin.status === 401, "incorrect password rejected");

  if (!registrationOpen()) {
    const response = await fetch(`${baseUrl}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input()) });
    check(response.status === 410, "closed API rejects registration");
  } else {
    for (const payload of [input(), input("INDIVIDUAL", false, true), input("TEAM"), input("TEAM", false, true, 6), input("TEAM", true, true)]) {
      const response = await fetch(`${baseUrl}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      assert.equal(response.status, 201, await response.clone().text());
      const result = await response.json() as { referenceCode: string };
      const row = (await readRegistrations()).find(r => r.referenceCode === result.referenceCode);
      assert.ok(row); addedIds.push(row.id);
      check(row.applicant.fullNameAr === payload.applicant.fullNameAr, "saved applicant");
      check((row.team?.members.length ?? 0) === (payload.team?.members.length ?? 0), "exact member count persisted");
      check(Boolean(row.team) === (payload.participationType === "TEAM"), "individual has no phantom team");
      check(row.idea.status === payload.idea.status, "idea status persisted");
    }
    for (const payload of [input("TEAM", true, false), input("INDIVIDUAL", true, true)]) {
      check((await fetch(`${baseUrl}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).status === 400, "conditional API rejection");
    }
    const selected = (await readRegistrations()).filter(r => addedIds.includes(r.id));
    check(summarize(selected).participants === 12, "counts actual people separately");
    const bytes = await excelExport(selected);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    check(workbook.worksheets.length === 7, "seven workbook sheets");
    check(workbook.getWorksheet("Participants")!.rowCount === 13, "all participants exported");
    const csv = csvExport(selected);
    check(csv.startsWith("\uFEFF") && csv.includes("تجربة اختبار منصة"), "Arabic CSV BOM");
    check(csv.includes("'@hmk_test"), "CSV formula injection protected");
    const initialCount = (await readRegistrations()).length;
    const duplicate = input(); duplicate.applicant.courses = [COURSES[1]!, COURSES[1]!];
    await assert.rejects(saveRegistration(duplicate));
    check((await readRegistrations()).length === initialCount, "database failure rolled back whole registration");

    const deletedId = addedIds.shift()!;
    check(await removeRegistration(deletedId), "full registration deletion");
    check(!(await readRegistrations()).some(r => r.id === deletedId), "deleted registration absent");
    check((await readRegistrations()).filter(r => addedIds.includes(r.id)).length === 4, "other registrations unaffected");
    for (const table of [participants, teams, projectIdeas, individualPreferences]) {
      check((await db.select().from(table).where(eq(table.registrationId, deletedId))).length === 0, "children cascaded");
    }
    for (const [child, parent, fk] of [
      [participantCourses, participants, participantCourses.participantId],
      [teamNeeds, teams, teamNeeds.teamId],
      [individualRoles, individualPreferences, individualRoles.preferenceId],
    ] as const) {
      const orphanCount = await db.execute(sql`SELECT count(*) as count FROM ${child} LEFT JOIN ${parent} ON ${fk} = ${parent.id} WHERE ${parent.id} IS NULL`);
      check(Number(orphanCount.rows[0]?.count) === 0, "no orphan records");
    }
  }
  process.stdout.write(`PASS: ${checks} development validation, persistence, export, deletion and unauthorized-access checks.\n`);
} finally {
  for (const id of addedIds) await removeRegistration(id);
  await pool.end();
}
