import { z } from "zod";
import { SubmitRegistrationBody } from "@workspace/api-zod";
import { COLLEGES, YEARS, COURSES, NEEDS, ROLES } from "./options";

export const DEADLINE = "2026-12-01T23:59:59+03:00";
export const registrationOpen = (now = Date.now()) => now <= Date.parse(DEADLINE);
export const NO_COURSES = "لم أحضر سابقاً";
export const OTHER_COURSE = "دورة أخرى";
export const COMPLETE_TEAM = "فريقنا مكتمل ومتوازن تقنياً";
export const countWords = (value: string) => value.trim().split(/\s+/u).filter(Boolean).length;

const required = z.string().trim().min(1, "هذا الحقل مطلوب").max(300, "النص أطول من الحد المسموح");
const optional = z.string().trim().max(300).optional();
const choices = z.array(required).min(1, "اختر خياراً واحداً على الأقل").max(15).refine(a => new Set(a).size === a.length, "لا تكرر الخيارات");
export const personSchema = z.object({
  fullNameAr: required.refine(s => s.split(/\s+/).length >= 3 && /^[\p{Script=Arabic}\s\u0640'-]+$/u.test(s), "أدخل الاسم الثلاثي بالعربية"),
  fullNameEn: required.refine(s => s.split(/\s+/).length >= 3 && /^[A-Za-z\s'-]+$/.test(s), "أدخل الاسم الثلاثي بالإنكليزية"),
  college: required.refine(s => COLLEGES.includes(s), "اختر كلية من القائمة"),
  collegeOther: optional,
  academicYear: required.refine(s => YEARS.includes(s), "اختر السنة الدراسية"),
  phone: z.string().regex(/^09[0-9]{8}$/, "رقم الجوال عشرة أرقام ويبدأ بـ 09"),
  telegramUsername: z.string().regex(/^@[A-Za-z0-9_]{1,32}$/, "أدخل معرف تيليغرام يبدأ بـ @"),
  courses: choices.refine(a => a.every(s => COURSES.includes(s)), "اختر الدورات من القائمة"),
  courseOther: optional,
}).superRefine((p, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (p.college === "أخرى" && !p.collegeOther) issue("collegeOther", "حدد الجامعة والكلية والاختصاص");
  if (p.courses.includes(NO_COURSES) && p.courses.length > 1) issue("courses", "لم أحضر سابقاً لا يجتمع مع دورات أخرى");
  if (p.courses.some(c => c.startsWith(OTHER_COURSE)) && !p.courseOther) issue("courseOther", "حدد اسم الدورة الأخرى");
});
const schema = z.object({
  affiliationType: z.enum(["INTERNAL", "EXTERNAL"]),
  participationType: z.enum(["TEAM", "INDIVIDUAL"]),
  externalOrganizationName: optional,
  applicant: personSchema,
  team: z.object({
    name: required,
    totalMembers: z.number().int().min(2).max(6),
    members: z.array(personSchema).min(1).max(5),
    needs: choices.refine(a => a.every(s => NEEDS.includes(s)), "اختر احتياجات الفريق من القائمة"),
  }).optional(),
  preferences: z.object({ roles: choices.refine(a => a.every(s => ROLES.includes(s)), "اختر دوراً تقنياً من القائمة"), friendName: optional }).optional(),
  idea: z.object({
    status: z.enum(["HAS_IDEA", "NEEDS_IDEA"]),
    title: optional,
    projectType: z.enum(["HARDWARE", "AI", "HYBRID"]).optional(),
    description: z.string().trim().max(15000).optional(),
    expectedTechnologies: z.string().trim().max(3000).optional(),
  }),
  termsWorkshopAccepted: z.literal(true, { message: "الموافقة على حضور الورشة مطلوبة" }),
  termsEquipmentAccepted: z.literal(true, { message: "الموافقة على الدليل وحفظ المعدات مطلوبة" }),
}).superRefine((r, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  if (r.affiliationType === "EXTERNAL") {
    if (r.participationType !== "TEAM") issue(["participationType"], "الجهات الخارجية تسجل كفرق فقط");
    if (!r.externalOrganizationName) issue(["externalOrganizationName"], "اسم الجهة الخارجية مطلوب");
    if (r.idea.status !== "HAS_IDEA") issue(["idea", "status"], "فكرة المشروع إلزامية للفرق الخارجية");
  }
  if (r.participationType === "TEAM") {
    if (!r.team) issue(["team"], "بيانات الفريق مطلوبة");
    else {
      if (r.team.members.length + 1 !== r.team.totalMembers) issue(["team", "members"], "عدد الأعضاء لا يطابق العدد المحدد");
      if (r.team.needs.includes(COMPLETE_TEAM) && r.team.needs.length > 1) issue(["team", "needs"], "الفريق المكتمل لا يختار احتياجات إضافية");
    }
    if (r.preferences) issue(["preferences"], "تفضيلات الأفراد لا تخص الفرق");
  } else {
    if (r.team) issue(["team"], "المشارك المنفرد لا يسجل فريقاً");
    if (!r.preferences) issue(["preferences"], "اختر تفضيلاتك التقنية");
  }
  if (r.idea.status === "HAS_IDEA") {
    if (!r.idea.title) issue(["idea", "title"], "عنوان الفكرة مطلوب");
    if (!r.idea.projectType) issue(["idea", "projectType"], "نوع المشروع مطلوب");
    const words = countWords(r.idea.description ?? "");
    if (words < 50 || words > 300) issue(["idea", "description"], "ملخص الفكرة بين 50 و300 كلمة");
    if (!r.idea.expectedTechnologies) issue(["idea", "expectedTechnologies"], "القطع والتقنيات مطلوبة");
  }
});
// Generated structural contract first, followed by conditional domain rules.
export const registrationSchema = SubmitRegistrationBody.pipe(schema);
export type RegistrationData = z.infer<typeof schema>;
