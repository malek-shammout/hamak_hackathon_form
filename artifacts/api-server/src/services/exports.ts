import ExcelJS from "exceljs";
import type { readRegistrations } from "./registrations";
type Rows = Awaited<ReturnType<typeof readRegistrations>>;
type ExportRow = Record<string, string | number | boolean>;
export function exportTables(rows: Rows): Record<string, ExportRow[]> {
  const result: Record<string, ExportRow[]> = {
    Registrations: [], Teams: [], Participants: [], "Participant Courses": [],
    "Individual Preferences": [], "Team Needs": [], "Project Ideas": [],
  };
  for (const r of rows) {
    const base = { "الرقم المرجعي": r.referenceCode, "معرف الطلب": r.id };
    result.Registrations!.push({ ...base, "الجهة": r.affiliationType, "الجهة الخارجية": r.externalOrganizationName,
      "نوع المشاركة": r.participationType, "تاريخ التسجيل": r.createdAt,
      "تعهد الورشة": r.termsWorkshopAccepted, "تعهد المعدات": r.termsEquipmentAccepted, "تاريخ الموافقة": r.acceptedAt });
    if (r.team) {
      result.Teams!.push({ ...base, "الفريق": r.team.name, "عدد الأعضاء": r.team.totalMembers });
      for (const need of r.team.needs) result["Team Needs"]!.push({ ...base, "الفريق": r.team.name, "الاحتياج": need });
    }
    [r.applicant, ...(r.team?.members ?? [])].forEach((p, index) => {
      const person = { ...base, "معرف الشخص": `${r.id}-${index + 1}`, "الاسم العربي": p.fullNameAr };
      result.Participants!.push({ ...person, "الاسم الإنكليزي": p.fullNameEn, "الدور": r.team ? index === 0 ? "قائد" : "عضو" : "فرد",
        "الكلية": p.college, "كلية أخرى": p.collegeOther, "السنة": p.academicYear, "الجوال": p.phone, "تيليغرام": p.telegramUsername });
      p.courses.forEach(course => result["Participant Courses"]!.push({ ...person, "الدورة": course,
        "اسم الدورة الأخرى": course.startsWith("دورة أخرى") ? p.courseOther : "" }));
    });
    r.preferences?.roles.forEach(role => result["Individual Preferences"]!.push({ ...base, "الدور المفضل": role, "الصديق": r.preferences!.friendName }));
    result["Project Ideas"]!.push({ ...base, "حالة الفكرة": r.idea.status, "العنوان": r.idea.title,
      "النوع": r.idea.projectType ?? "", "الملخص": r.idea.description, "التقنيات": r.idea.expectedTechnologies });
  }
  return result;
}
// ExcelJS stores string cells as strings, not formula objects. CSV must escape formula prefixes.
const safeCsv = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export function csvExport(rows: Rows) {
  // One row per person; repeat parent data so all relationships remain available in one CSV.
  const flat = rows.flatMap(r => [r.applicant, ...(r.team?.members ?? [])].map((p, i) => ({
    "الرقم المرجعي": r.referenceCode, "معرف الطلب": r.id, "معرف الشخص": `${r.id}-${i + 1}`,
    "الجهة": r.affiliationType, "الجهة الخارجية": r.externalOrganizationName,
    "نوع المشاركة": r.participationType, "الفريق": r.team?.name ?? "", "عدد الأعضاء": r.team?.totalMembers ?? 1,
    "الدور": r.team ? i === 0 ? "قائد" : "عضو" : "فرد",
    "الاسم العربي": p.fullNameAr, "الاسم الإنكليزي": p.fullNameEn, "الكلية": p.college,
    "كلية أخرى": p.collegeOther, "السنة": p.academicYear, "الجوال": p.phone, "تيليغرام": p.telegramUsername,
    "الدورات": p.courses.join(" | "), "دورة أخرى": p.courseOther,
    "التفضيلات": r.preferences?.roles.join(" | ") ?? "", "الصديق": r.preferences?.friendName ?? "",
    "احتياجات الفريق": r.team?.needs.join(" | ") ?? "",
    "حالة الفكرة": r.idea.status, "عنوان الفكرة": r.idea.title, "نوع الفكرة": r.idea.projectType ?? "",
    "ملخص الفكرة": r.idea.description, "التقنيات": r.idea.expectedTechnologies,
    "تعهد الورشة": r.termsWorkshopAccepted, "تعهد المعدات": r.termsEquipmentAccepted,
    "تاريخ الموافقة": r.acceptedAt, "تاريخ التسجيل": r.createdAt,
  })));
  if (!flat.length) return "\uFEFFالرقم المرجعي,الاسم العربي\r\n";
  return "\uFEFF" + [Object.keys(flat[0]!).map(safeCsv).join(","), ...flat.map(r => Object.values(r).map(safeCsv).join(","))].join("\r\n");
}
export async function excelExport(rows: Rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نادي الهمك";
  for (const [name, records] of Object.entries(exportTables(rows))) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1, rightToLeft: true }] });
    const keys = Object.keys(records[0] ?? { "الرقم المرجعي": "" });
    sheet.columns = keys.map(key => ({ header: key, key, width: key.includes("ملخص") ? 60 : 28 }));
    records.forEach(row => sheet.addRow(row));
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: keys.length } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8293A" } };
    sheet.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
  }
  return workbook.xlsx.writeBuffer();
}
