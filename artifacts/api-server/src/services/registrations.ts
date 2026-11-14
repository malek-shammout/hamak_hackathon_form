import { randomBytes } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import {
  db, registrations, participants, participantCourses, teams, teamNeeds,
  individualPreferences, individualRoles, projectIdeas,
} from "@workspace/db";
import { COMPLETE_TEAM, registrationOpen, type RegistrationData } from "../lib/registration-validation";

export async function saveRegistration(input: RegistrationData) {
  return db.transaction(async tx => {
    if (!registrationOpen()) throw new Error("REGISTRATION_CLOSED");
    const referenceCode = `HMK-${randomBytes(8).toString("hex").toUpperCase()}`;
    const [registration] = await tx.insert(registrations).values({
      referenceCode,
      affiliationType: input.affiliationType,
      participationType: input.participationType,
      externalOrganizationName: input.affiliationType === "EXTERNAL" ? input.externalOrganizationName : null,
      termsWorkshopAccepted: true,
      termsEquipmentAccepted: true,
    }).returning();
    const registrationId = registration!.id;
    const people = [input.applicant, ...(input.team?.members ?? [])];
    for (const [index, person] of people.entries()) {
      const { courses, courseOther, ...fields } = person;
      const [saved] = await tx.insert(participants).values({
        ...fields, registrationId,
        collegeOther: fields.college === "أخرى" ? fields.collegeOther : null,
        role: input.participationType === "INDIVIDUAL" ? "INDIVIDUAL" : index === 0 ? "LEADER" : "MEMBER",
      }).returning();
      await tx.insert(participantCourses).values(courses.map(course => ({
        participantId: saved!.id, course,
        otherName: course.startsWith("دورة أخرى") ? courseOther : null,
      })));
    }
    if (input.team) {
      const [team] = await tx.insert(teams).values({
        registrationId, name: input.team.name, totalMembers: input.team.totalMembers,
        completionStatus: input.team.needs.includes(COMPLETE_TEAM) ? "COMPLETE" : "NEEDS_MEMBERS",
      }).returning();
      await tx.insert(teamNeeds).values(input.team.needs.map(need => ({ teamId: team!.id, need })));
    }
    if (input.preferences) {
      const [preference] = await tx.insert(individualPreferences).values({
        registrationId, friendName: input.preferences.friendName,
      }).returning();
      await tx.insert(individualRoles).values(input.preferences.roles.map(role => ({ preferenceId: preference!.id, role })));
    }
    await tx.insert(projectIdeas).values({
      registrationId, status: input.idea.status,
      ...(input.idea.status === "HAS_IDEA" ? {
        title: input.idea.title, projectType: input.idea.projectType,
        description: input.idea.description, expectedTechnologies: input.idea.expectedTechnologies,
      } : {}),
    });
    return { referenceCode };
  });
}

export async function readRegistrations() {
  return db.transaction(async tx => {
    const rows = await tx.select().from(registrations).orderBy(desc(registrations.createdAt));
    const people = await tx.select().from(participants);
    const courses = await tx.select().from(participantCourses);
    const allTeams = await tx.select().from(teams);
    const needs = await tx.select().from(teamNeeds);
    const preferences = await tx.select().from(individualPreferences);
    const roles = await tx.select().from(individualRoles);
    const ideas = await tx.select().from(projectIdeas);
    const formatPerson = (p: typeof people[number]) => ({
      fullNameAr: p.fullNameAr, fullNameEn: p.fullNameEn, college: p.college,
      collegeOther: p.collegeOther ?? "", academicYear: p.academicYear,
      phone: p.phone, telegramUsername: p.telegramUsername,
      courses: courses.filter(c => c.participantId === p.id).map(c => c.course),
      courseOther: courses.find(c => c.participantId === p.id && c.otherName)?.otherName ?? "",
    });
    return rows.map(r => {
      const members = people.filter(p => p.registrationId === r.id);
      const applicant = members.find(p => p.role !== "MEMBER");
      const team = allTeams.find(t => t.registrationId === r.id);
      const preference = preferences.find(p => p.registrationId === r.id);
      const idea = ideas.find(i => i.registrationId === r.id);
      if (!applicant || !idea) throw new Error("INCONSISTENT_REGISTRATION");
      return {
        id: r.id, referenceCode: r.referenceCode, createdAt: r.createdAt.toISOString(),
        acceptedAt: r.acceptedAt.toISOString(),
        affiliationType: r.affiliationType, participationType: r.participationType,
        externalOrganizationName: r.externalOrganizationName ?? "",
        termsWorkshopAccepted: r.termsWorkshopAccepted, termsEquipmentAccepted: r.termsEquipmentAccepted,
        applicant: formatPerson(applicant),
        ...(team ? { team: { name: team.name, totalMembers: team.totalMembers,
          members: members.filter(p => p.role === "MEMBER").map(formatPerson),
          needs: needs.filter(n => n.teamId === team.id).map(n => n.need) } } : {}),
        ...(preference ? { preferences: { friendName: preference.friendName ?? "",
          roles: roles.filter(role => role.preferenceId === preference.id).map(role => role.role) } } : {}),
        idea: { status: idea.status, title: idea.title ?? "",
          ...(idea.projectType ? { projectType: idea.projectType } : {}),
          description: idea.description ?? "", expectedTechnologies: idea.expectedTechnologies ?? "" },
      };
    });
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

export async function removeRegistration(id: number) {
  // All child foreign keys cascade; this single statement is atomic.
  const deleted = await db.delete(registrations).where(eq(registrations.id, id)).returning({ id: registrations.id });
  return deleted.length > 0;
}

export function summarize(rows: Awaited<ReturnType<typeof readRegistrations>>) {
  return {
    registrations: rows.length,
    participants: rows.reduce((sum, row) => sum + (row.team?.totalMembers ?? 1), 0),
    internalTeams: rows.filter(r => r.affiliationType === "INTERNAL" && r.team).length,
    externalTeams: rows.filter(r => r.affiliationType === "EXTERNAL" && r.team).length,
    individuals: rows.filter(r => r.participationType === "INDIVIDUAL").length,
    ideas: rows.filter(r => r.idea.status === "HAS_IDEA").length,
    needsIdea: rows.filter(r => r.idea.status === "NEEDS_IDEA").length,
    needsMembers: rows.filter(r => r.team && !r.team.needs.includes(COMPLETE_TEAM)).length,
  };
}
