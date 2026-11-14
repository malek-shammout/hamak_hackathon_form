import { z } from "zod";
import type { RegistrationInput, Participant } from "@workspace/api-client-react";
import {
  COLLEGES, COLLEGE_OTHER, COURSES, COURSE_NONE, COURSE_OTHER, NEEDS, NEED_COMPLETE, ROLES, YEARS, countWords,
} from "./constants";

const participant = z.object({
  fullNameAr: z.string(),
  fullNameEn: z.string(),
  college: z.string(),
  collegeOther: z.string(),
  academicYear: z.string(),
  phone: z.string(),
  telegramUsername: z.string(),
  courses: z.array(z.string()),
  courseOther: z.string(),
});
export type ParticipantForm = z.infer<typeof participant>;

const base = z.object({
  affiliationType: z.string(),
  externalOrganizationName: z.string(),
  participationType: z.string(),
  applicant: participant,
  team: z.object({
    name: z.string(),
    totalMembers: z.string(),
    members: z.array(participant),
    needs: z.array(z.string()),
  }),
  preferences: z.object({ roles: z.array(z.string()), friendName: z.string() }),
  idea: z.object({
    status: z.string(),
    title: z.string(),
    projectType: z.string(),
    description: z.string(),
    expectedTechnologies: z.string(),
  }),
  termsWorkshopAccepted: z.boolean(),
  termsEquipmentAccepted: z.boolean(),
});
export type RegForm = z.infer<typeof base>;

export const emptyParticipant = (courses: string[] = []): ParticipantForm => ({
  fullNameAr: "", fullNameEn: "", college: "", collegeOther: "", academicYear: "",
  phone: "", telegramUsername: "", courses, courseOther: "",
});

export const defaultValues: RegForm = {
  affiliationType: "",
  externalOrganizationName: "",
  participationType: "",
  applicant: emptyParticipant(),
  team: { name: "", totalMembers: "", members: [], needs: [] },
  preferences: { roles: [], friendName: "" },
  idea: { status: "", title: "", projectType: "", description: "", expectedTechnologies: "" },
  termsWorkshopAccepted: false,
  termsEquipmentAccepted: false,
};

const AR_NAME = /^[\p{Script=Arabic}\s\u0640'-]+$/u;
const EN_NAME = /^[A-Za-z\s'-]+$/;
const threeParts = (s: string) => s.trim().split(/\s+/).filter(Boolean).length >= 3;

function checkParticipant(p: ParticipantForm, path: (string | number)[], ctx: z.RefinementCtx) {
  const add = (field: string, message: string) => ctx.addIssue({ code: "custom", path: [...path, field], message });
  for (const field of ["fullNameAr", "fullNameEn", "collegeOther", "courseOther"] as const) {
    if (p[field].trim().length > 300) add(field, "الحد الأقصى 300 حرف");
  }
  if (!p.fullNameAr.trim()) add("fullNameAr", "الاسم الثلاثي بالعربية مطلوب");
  else if (!AR_NAME.test(p.fullNameAr.trim())) add("fullNameAr", "اكتب الاسم بأحرف عربية فقط");
  else if (!threeParts(p.fullNameAr)) add("fullNameAr", "يرجى كتابة الاسم الثلاثي كاملاً");
  if (!p.fullNameEn.trim()) add("fullNameEn", "الاسم الثلاثي بالإنكليزية مطلوب");
  else if (!EN_NAME.test(p.fullNameEn.trim())) add("fullNameEn", "اكتب الاسم بأحرف إنكليزية فقط");
  else if (!threeParts(p.fullNameEn)) add("fullNameEn", "يرجى كتابة الاسم الثلاثي كاملاً");
  if (!COLLEGES.includes(p.college)) add("college", "اختر الكلية والاختصاص");
  else if (p.college === COLLEGE_OTHER && !p.collegeOther.trim()) add("collegeOther", "اكتب اسم الجامعة أو الكلية والاختصاص");
  if (!YEARS.includes(p.academicYear)) add("academicYear", "اختر السنة الدراسية");
  if (!/^09\d{8}$/.test(p.phone.trim())) add("phone", "رقم الجوال يجب أن يتكون من 10 أرقام ويبدأ بـ 09");
  if (!/^@[A-Za-z0-9_]{1,32}$/.test(p.telegramUsername.trim())) add("telegramUsername", "معرف Telegram يجب أن يبدأ بـ @ ويحتوي أحرفاً إنكليزية أو أرقاماً أو _");
  if (p.courses.length === 0 || p.courses.some((c) => !COURSES.includes(c))) add("courses", "اختر خياراً واحداً على الأقل");
  else if (p.courses.includes(COURSE_NONE) && p.courses.length > 1) add("courses", "خيار «لم أحضر سابقاً» لا يجتمع مع الدورات الأخرى");
  if (p.courses.includes(COURSE_OTHER) && !p.courseOther.trim()) add("courseOther", "اكتب اسم الدورة");
}

export const regSchema = base.superRefine((v, ctx) => {
  const add = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  const external = v.affiliationType === "EXTERNAL";
  for (const [path, value, max] of [
    [["externalOrganizationName"], v.externalOrganizationName, 300],
    [["team", "name"], v.participationType === "TEAM" ? v.team.name : "", 300],
    [["preferences", "friendName"], v.participationType === "INDIVIDUAL" ? v.preferences.friendName : "", 300],
  ] as const) {
    if (value.trim().length > max) add([...path], `الحد الأقصى ${max} حرف`);
  }

  if (v.affiliationType !== "INTERNAL" && v.affiliationType !== "EXTERNAL") add(["affiliationType"], "اختر الجهة المشاركة");
  if (external && !v.externalOrganizationName.trim()) add(["externalOrganizationName"], "اسم الجهة الخارجية مطلوب");
  checkParticipant(v.applicant, ["applicant"], ctx);
  if (v.participationType !== "TEAM" && v.participationType !== "INDIVIDUAL") add(["participationType"], "اختر طبيعة المشاركة");
  if (external && v.participationType !== "TEAM") add(["participationType"], "الجهات الخارجية تسجّل كفريق فقط");

  if (v.participationType === "TEAM") {
    if (!v.team.name.trim()) add(["team", "name"], "اسم الفريق مطلوب");
    const n = Number(v.team.totalMembers);
    if (!(n >= 2 && n <= 6)) add(["team", "totalMembers"], "اختر عدد الأعضاء (من 2 إلى 6)");
    else if (v.team.members.length !== n - 1) add(["team", "totalMembers"], "عدد بطاقات الأعضاء لا يطابق العدد المختار");
    v.team.members.forEach((m, i) => checkParticipant(m, ["team", "members", i], ctx));
    if (v.team.needs.length === 0 || v.team.needs.some((x) => !NEEDS.includes(x))) add(["team", "needs"], "اختر خياراً واحداً على الأقل");
    else if (v.team.needs.includes(NEED_COMPLETE) && v.team.needs.length > 1) add(["team", "needs"], "خيار «فريقنا مكتمل» لا يجتمع مع الاحتياجات الأخرى");
  }
  if (v.participationType === "INDIVIDUAL") {
    if (v.preferences.roles.length === 0 || v.preferences.roles.some((r) => !ROLES.includes(r))) add(["preferences", "roles"], "اختر دوراً تقنياً واحداً على الأقل");
  }

  const needsIdeaFields = external || v.idea.status === "HAS_IDEA";
  if (!external && v.idea.status !== "HAS_IDEA" && v.idea.status !== "NEEDS_IDEA") add(["idea", "status"], "اختر إحدى الإجابتين");
  if (needsIdeaFields) {
    if (v.idea.title.trim().length > 300) add(["idea", "title"], "الحد الأقصى 300 حرف");
    if (v.idea.description.trim().length > 15000) add(["idea", "description"], "الملخص أطول من الحد المسموح");
    if (v.idea.expectedTechnologies.trim().length > 3000) add(["idea", "expectedTechnologies"], "الحد الأقصى 3000 حرف");
    if (!v.idea.title.trim()) add(["idea", "title"], "عنوان الفكرة مطلوب");
    if (!["HARDWARE", "AI", "HYBRID"].includes(v.idea.projectType)) add(["idea", "projectType"], "اختر نوع المشروع");
    const w = countWords(v.idea.description);
    if (w < 50 || w > 300) add(["idea", "description"], `الملخص يجب أن يكون بين 50 و300 كلمة (الحالي: ${w})`);
    if (!v.idea.expectedTechnologies.trim()) add(["idea", "expectedTechnologies"], "اذكر القطع والتقنيات المتوقعة");
  }

  if (!v.termsWorkshopAccepted) add(["termsWorkshopAccepted"], "هذا التعهد إلزامي");
  if (!v.termsEquipmentAccepted) add(["termsEquipmentAccepted"], "هذا التعهد إلزامي");
});

function toParticipant(p: ParticipantForm): Participant {
  const out: Participant = {
    fullNameAr: p.fullNameAr.trim(),
    fullNameEn: p.fullNameEn.trim(),
    college: p.college,
    academicYear: p.academicYear,
    phone: p.phone.trim(),
    telegramUsername: p.telegramUsername.trim(),
    courses: p.courses,
  };
  if (p.college === COLLEGE_OTHER) out.collegeOther = p.collegeOther.trim();
  if (p.courses.includes(COURSE_OTHER)) out.courseOther = p.courseOther.trim();
  return out;
}

export function toPayload(v: RegForm): RegistrationInput {
  const external = v.affiliationType === "EXTERNAL";
  const participationType = external ? "TEAM" : (v.participationType as "TEAM" | "INDIVIDUAL");
  const hasIdea = external || v.idea.status === "HAS_IDEA";
  const payload: RegistrationInput = {
    affiliationType: v.affiliationType as "INTERNAL" | "EXTERNAL",
    participationType,
    applicant: toParticipant(v.applicant),
    idea: hasIdea
      ? {
          status: "HAS_IDEA",
          title: v.idea.title.trim(),
          projectType: v.idea.projectType as "HARDWARE" | "AI" | "HYBRID",
          description: v.idea.description.trim(),
          expectedTechnologies: v.idea.expectedTechnologies.trim(),
        }
      : { status: "NEEDS_IDEA" },
    termsWorkshopAccepted: v.termsWorkshopAccepted,
    termsEquipmentAccepted: v.termsEquipmentAccepted,
  };
  if (external) payload.externalOrganizationName = v.externalOrganizationName.trim();
  if (participationType === "TEAM") {
    payload.team = {
      name: v.team.name.trim(),
      totalMembers: Number(v.team.totalMembers),
      members: v.team.members.map(toParticipant),
      needs: v.team.needs,
    };
  } else {
    payload.preferences = { roles: v.preferences.roles };
    if (v.preferences.friendName.trim()) payload.preferences.friendName = v.preferences.friendName.trim();
  }
  return payload;
}
