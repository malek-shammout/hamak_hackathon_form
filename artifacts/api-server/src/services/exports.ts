import ExcelJS from "exceljs";
import type { readRegistrations } from "./registrations";

type Rows = Awaited<ReturnType<typeof readRegistrations>>;
type Reg = Rows[number];
type Person = Reg["applicant"];

/* ---------- Arabic labels ---------- */
const AFFILIATION: Record<string, string> = { INTERNAL: "نادي الهمك / جامعة دمشق", EXTERNAL: "جهة خارجية" };
const PARTICIPATION: Record<string, string> = { TEAM: "فريق", INDIVIDUAL: "مشارك منفرد" };
const IDEA: Record<string, string> = { HAS_IDEA: "لديه فكرة", NEEDS_IDEA: "يحتاج إلى فكرة" };
const PROJECT_TYPE: Record<string, string> = {
  HARDWARE: "روبوت أو نظام عتادي", AI: "نظام ذكاء صنعي برمجي", HYBRID: "مشروع مدمج (عتاد + ذكاء صنعي)",
};
const COMPLETE_TEAM = "فريقنا مكتمل ومتوازن تقنياً";
const yes = (b: boolean) => (b ? "نعم" : "لا");
const date = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Damascus", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));

const people = (r: Reg) => [r.applicant, ...(r.team?.members ?? [])];
const roleOf = (r: Reg, i: number) => (r.team ? (i === 0 ? "قائد الفريق" : `عضو ${i + 1}`) : "مشارك منفرد");
const collegeOf = (p: Person) => (p.college === "أخرى" && p.collegeOther ? `أخرى: ${p.collegeOther}` : p.college);
const coursesOf = (p: Person) =>
  p.courses.map(c => (c.startsWith("دورة أخرى") && p.courseOther ? `دورة أخرى: ${p.courseOther}` : c)).join("، ");
const displayName = (r: Reg) => r.team?.name ?? r.applicant.fullNameAr;
const words = (s: string) => s.trim().split(/\s+/u).filter(Boolean).length;

/** Spreadsheet formula injection guard: Excel only evaluates formula objects, but CSV readers evaluate text. */
const safeText = (value: unknown) => {
  const text = String(value ?? "");
  return /^[\s]*[=+\-@\t\r]/u.test(text) ? `'${text}` : text;
};

/* ---------- flat views ---------- */
export function registrationSummary(r: Reg, index: number) {
  const ps = people(r);
  return {
    "#": index + 1,
    "الرقم المرجعي": r.referenceCode,
    "تاريخ التسجيل": date(r.createdAt),
    "نوع المشاركة": PARTICIPATION[r.participationType] ?? r.participationType,
    "الجهة": AFFILIATION[r.affiliationType] ?? r.affiliationType,
    "اسم الجهة الخارجية": r.externalOrganizationName || "",
    "اسم الفريق": r.team?.name ?? "",
    "عدد الأعضاء": r.team?.totalMembers ?? 1,
    "القائد / المشارك": r.applicant.fullNameAr,
    "الاسم بالإنكليزية": r.applicant.fullNameEn,
    "الكلية": collegeOf(r.applicant),
    "السنة": r.applicant.academicYear,
    "الجوال": r.applicant.phone,
    "تيليغرام": r.applicant.telegramUsername,
    "أسماء الأعضاء": ps.slice(1).map(p => p.fullNameAr).join("، "),
    "حالة الفريق": r.team ? (r.team.needs.includes(COMPLETE_TEAM) ? "مكتمل" : "يحتاج أعضاء") : "",
    "احتياجات الفريق": r.team?.needs.join("، ") ?? "",
    "الأدوار المفضلة (للأفراد)": r.preferences?.roles.join("، ") ?? "",
    "صديق يرغب بالعمل معه": r.preferences?.friendName ?? "",
    "حالة الفكرة": IDEA[r.idea.status] ?? r.idea.status,
    "عنوان الفكرة": r.idea.title,
    "نوع المشروع": r.idea.projectType ? PROJECT_TYPE[r.idea.projectType] ?? r.idea.projectType : "",
    "ملخص الفكرة": r.idea.description,
    "عدد كلمات الملخص": r.idea.description ? words(r.idea.description) : "",
    "القطع والتقنيات المتوقعة": r.idea.expectedTechnologies,
    "تعهد الورشة": yes(r.termsWorkshopAccepted),
    "تعهد المعدات": yes(r.termsEquipmentAccepted),
  };
}

export function participantRows(rows: Rows) {
  return rows.flatMap((r, ri) => people(r).map((p, i) => ({
    "# الطلب": ri + 1,
    "الرقم المرجعي": r.referenceCode,
    "الفريق / الطلب": displayName(r),
    "الدور": roleOf(r, i),
    "الاسم العربي": p.fullNameAr,
    "الاسم الإنكليزي": p.fullNameEn,
    "الكلية والاختصاص": collegeOf(p),
    "السنة": p.academicYear,
    "الجوال": p.phone,
    "تيليغرام": p.telegramUsername,
    "الدورات": coursesOf(p),
    "الجهة": AFFILIATION[r.affiliationType] ?? r.affiliationType,
    "عنوان الفكرة": r.idea.title || IDEA[r.idea.status] || "",
  })));
}

/* ---------- workbook styling ---------- */
const RED = "FFE22C35", INK = "FF17171B", SOFT = "FFF4F4F6", LINE = "FFE4E4E8", WHITE = "FFFFFFFF";
const FONT = "Arial";
const border = { top: { style: "thin", color: { argb: LINE } }, bottom: { style: "thin", color: { argb: LINE } }, left: { style: "thin", color: { argb: LINE } }, right: { style: "thin", color: { argb: LINE } } } as const;
const fill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });

function tableSheet(wb: ExcelJS.Workbook, name: string, records: Record<string, unknown>[], wide: Record<string, number> = {}) {
  const sheet = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1, rightToLeft: true }] });
  const keys = Object.keys(records[0] ?? { "الرقم المرجعي": "" });
  sheet.columns = keys.map(key => ({ header: key, key, width: wide[key] ?? (key === "#" || key === "# الطلب" ? 7 : 22) }));
  records.forEach(row => sheet.addRow(row));
  const header = sheet.getRow(1);
  header.height = 30;
  header.eachCell(c => {
    c.font = { name: FONT, bold: true, color: { argb: WHITE } };
    c.fill = fill(INK);
    c.alignment = { vertical: "middle", horizontal: "right", wrapText: true, readingOrder: "rtl" };
  });
  sheet.eachRow((row, n) => {
    if (n === 1) return;
    row.eachCell({ includeEmpty: true }, c => {
      c.font = { name: FONT, size: 10 };
      c.alignment = { vertical: "top", horizontal: "right", wrapText: true, readingOrder: "rtl" };
      c.border = border;
      if (n % 2 === 0) c.fill = fill(SOFT);
    });
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: keys.length } };
  return sheet;
}

const usedNames = new Set<string>();
function sheetName(index: number, r: Reg) {
  const base = `${index + 1}. ${displayName(r)}`.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31).trim();
  let name = base, k = 2;
  while (usedNames.has(name)) name = `${base.slice(0, 27)} (${k++})`;
  usedNames.add(name);
  return name;
}

const CARD_COLS = [5, 16, 24, 24, 30, 15, 14, 18, 40]; // 9 columns: people table drives the width
const CARD_TOTAL = CARD_COLS.reduce((a, b) => a + b, 0);

/** One formatted, self-contained sheet for a single registration. */
function registrationSheet(wb: ExcelJS.Workbook, r: Reg, index: number) {
  const s = wb.addWorksheet(sheetName(index, r), { views: [{ rightToLeft: true, showGridLines: false }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 } });
  s.columns = CARD_COLS.map(width => ({ width }));
  const last = CARD_COLS.length;
  let row = 1;

  const merged = (text: string, opts: { size?: number; bold?: boolean; color?: string; bg?: string; height?: number; from?: number } = {}) => {
    const from = opts.from ?? 1;
    s.mergeCells(row, from, row, last);
    const c = s.getCell(row, from);
    c.value = text;
    c.font = { name: FONT, size: opts.size ?? 10, bold: opts.bold, color: { argb: opts.color ?? INK } };
    c.alignment = { vertical: "middle", horizontal: "right", wrapText: true, readingOrder: "rtl" };
    if (opts.bg) for (let i = 1; i <= last; i++) s.getCell(row, i).fill = fill(opts.bg);
    if (opts.height) s.getRow(row).height = opts.height;
    row++;
  };
  const section = (title: string) => { row++; merged(title, { size: 12, bold: true, color: WHITE, bg: RED, height: 24 }); };
  const field = (label: string, value: string | number, opts: { long?: boolean } = {}) => {
    const lc = s.getCell(row, 1);
    s.mergeCells(row, 1, row, 2);
    lc.value = label;
    lc.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
    lc.fill = fill(SOFT);
    lc.alignment = { vertical: "top", horizontal: "right", wrapText: true, readingOrder: "rtl" };
    s.mergeCells(row, 3, row, last);
    const vc = s.getCell(row, 3);
    const text = String(value ?? "") || "—";
    vc.value = text;
    vc.font = { name: FONT, size: 10 };
    vc.alignment = { vertical: "top", horizontal: "right", wrapText: true, readingOrder: "rtl" };
    for (let i = 1; i <= last; i++) s.getCell(row, i).border = border;
    // merged cells don't auto-fit: estimate height from text length
    const charsPerLine = (CARD_TOTAL - CARD_COLS[0]! - CARD_COLS[1]!) * 1.05;
    const lines = text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / charsPerLine)), 0);
    s.getRow(row).height = Math.max(20, lines * (opts.long ? 15 : 14) + 6);
    row++;
  };

  merged(displayName(r), { size: 16, bold: true, color: WHITE, bg: INK, height: 32 });
  merged(`${r.referenceCode}  ·  ${PARTICIPATION[r.participationType]}  ·  ${AFFILIATION[r.affiliationType]}  ·  ${date(r.createdAt)}`, { size: 10, color: "FFC8C8CE", bg: INK, height: 20 });

  section("بيانات الطلب");
  field("الرقم المرجعي", r.referenceCode);
  field("تاريخ التسجيل", date(r.createdAt));
  field("نوع المشاركة", PARTICIPATION[r.participationType] ?? r.participationType);
  field("الجهة", AFFILIATION[r.affiliationType] ?? r.affiliationType);
  if (r.externalOrganizationName) field("اسم الجهة الخارجية", r.externalOrganizationName);
  if (r.team) {
    field("اسم الفريق", r.team.name);
    field("عدد الأعضاء", r.team.totalMembers);
    field("احتياجات الفريق", r.team.needs.join("، "));
  }
  if (r.preferences) {
    field("الأدوار التقنية المفضلة", r.preferences.roles.join("، "));
    field("صديق يرغب بالعمل معه", r.preferences.friendName || "—");
  }
  field("التعهدات", `حضور الورشة: ${yes(r.termsWorkshopAccepted)}  ·  الالتزام بالدليل والمعدات: ${yes(r.termsEquipmentAccepted)}`);

  section("فكرة المشروع");
  field("حالة الفكرة", IDEA[r.idea.status] ?? r.idea.status);
  if (r.idea.status === "HAS_IDEA") {
    field("عنوان الفكرة", r.idea.title);
    field("نوع المشروع", r.idea.projectType ? PROJECT_TYPE[r.idea.projectType] ?? r.idea.projectType : "");
    field(`ملخص الفكرة (${words(r.idea.description)} كلمة)`, r.idea.description, { long: true });
    field("القطع والتقنيات المتوقعة", r.idea.expectedTechnologies, { long: true });
  }

  section(r.team ? `أعضاء الفريق (${people(r).length})` : "بيانات المشارك");
  const head = ["#", "الدور", "الاسم العربي", "الاسم الإنكليزي", "الكلية والاختصاص", "السنة", "الجوال", "تيليغرام", "الدورات"];
  head.forEach((h, i) => {
    const c = s.getCell(row, i + 1);
    c.value = h;
    c.font = { name: FONT, size: 10, bold: true, color: { argb: WHITE } };
    c.fill = fill(INK);
    c.alignment = { vertical: "middle", horizontal: "right", wrapText: true, readingOrder: "rtl" };
    c.border = border;
  });
  s.getRow(row).height = 22;
  row++;
  people(r).forEach((p, i) => {
    const vals = [i + 1, roleOf(r, i), p.fullNameAr, p.fullNameEn, collegeOf(p), p.academicYear, p.phone, p.telegramUsername, coursesOf(p)];
    vals.forEach((v, j) => {
      const c = s.getCell(row, j + 1);
      c.value = v;
      c.font = { name: FONT, size: 10, bold: j === 2 };
      c.alignment = { vertical: "top", horizontal: "right", wrapText: true, readingOrder: "rtl" };
      c.border = border;
      if (i % 2 === 1) c.fill = fill(SOFT);
    });
    const longest = Math.max(...vals.map((v, j) => Math.ceil(String(v).length / (CARD_COLS[j]! * 1.05))));
    s.getRow(row).height = Math.max(20, longest * 14 + 6);
    row++;
  });
  return s;
}

/* ---------- public API ---------- */
/** Full workbook: summary (one complete row per registration), participants, then one sheet per registration. */
export async function excelExport(rows: Rows) {
  usedNames.clear();
  const wb = new ExcelJS.Workbook();
  wb.creator = "نادي الهمك";
  wb.created = new Date();
  tableSheet(wb, "الطلبات", rows.map(registrationSummary), {
    "ملخص الفكرة": 70, "القطع والتقنيات المتوقعة": 40, "أسماء الأعضاء": 40, "احتياجات الفريق": 34, "الأدوار المفضلة (للأفراد)": 34,
    "الكلية": 32, "عنوان الفكرة": 30, "الرقم المرجعي": 22, "تاريخ التسجيل": 17,
  });
  tableSheet(wb, "المشاركون", participantRows(rows), { "الكلية والاختصاص": 34, "الدورات": 44, "الاسم الإنكليزي": 26, "الفريق / الطلب": 24, "عنوان الفكرة": 28 });
  rows.forEach((r, i) => registrationSheet(wb, r, i));
  return wb.xlsx.writeBuffer();
}

/** Workbook for a single registration (the same formatted sheet). */
export async function excelExportOne(r: Reg) {
  usedNames.clear();
  const wb = new ExcelJS.Workbook();
  wb.creator = "نادي الهمك";
  registrationSheet(wb, r, 0);
  return wb.xlsx.writeBuffer();
}

/** CSV: one row per person, with all registration and idea details repeated. */
export function csvExport(rows: Rows) {
  const flat = rows.flatMap((r, ri) => people(r).map((p, i) => {
    const summary = registrationSummary(r, ri);
    return {
      "# الطلب": ri + 1, "الرقم المرجعي": r.referenceCode, "الدور": roleOf(r, i),
      "الاسم العربي": p.fullNameAr, "الاسم الإنكليزي": p.fullNameEn, "الكلية والاختصاص": collegeOf(p),
      "السنة": p.academicYear, "الجوال": p.phone, "تيليغرام": p.telegramUsername, "الدورات": coursesOf(p),
      ...Object.fromEntries(Object.entries(summary).filter(([k]) => !["#", "الرقم المرجعي", "القائد / المشارك", "الاسم بالإنكليزية", "الكلية", "السنة", "الجوال", "تيليغرام"].includes(k))),
    };
  }));
  const cell = (v: unknown) => `"${safeText(v).replaceAll('"', '""')}"`;
  if (!flat.length) return "﻿الرقم المرجعي,الاسم العربي\r\n";
  return "﻿" + [Object.keys(flat[0]!).map(cell).join(","), ...flat.map(r => Object.values(r).map(cell).join(","))].join("\r\n");
}

