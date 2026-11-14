import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle, Building2, ChevronLeft, FileText, Inbox, Lightbulb, Loader2, RotateCw, Search, Trash2, User, UserPlus, Users, X, Phone, Send,
} from "lucide-react";
import type { Registration, Participant } from "@workspace/api-client-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminGate, AdminLayout } from "@/components/admin-shell";
import { usePageMeta } from "@/components/brand";
import { useAdminSession, useDeleteReg, useRegistrationDetail, useRegistrations, useSummary, apiErrorMessage } from "@/hooks/use-admin";
import { AFFILIATION_LABEL, COLLEGE_OTHER, COURSES, COURSE_OTHER, IDEA_LABEL, NEED_COMPLETE, PARTICIPATION_LABEL, ROLES, YEARS, projectTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ---------------- helpers ---------------- */
const fmtDate = (s: string) =>
  new Intl.DateTimeFormat("ar-SY-u-nu-latn", { timeZone: "Asia/Damascus", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(s));
const people = (r: Registration): Participant[] => [r.applicant, ...(r.team?.members ?? [])];
const needsMembers = (r: Registration) => !!r.team && r.team.needs.some((n) => n !== NEED_COMPLETE);
const collegeOf = (p: Participant) => (p.college === COLLEGE_OTHER && p.collegeOther ? `أخرى: ${p.collegeOther}` : p.college);
const coursesOf = (p: Participant) => p.courses.map((c) => (c === COURSE_OTHER && p.courseOther ? `دورة أخرى: ${p.courseOther}` : c));
const memberCount = (r: Registration) => (r.team ? r.team.totalMembers : 1);

function useAuthed() {
  return !!useAdminSession().data?.authenticated;
}

function Pill({ children, tone = "muted", testId }: { children: ReactNode; tone?: "muted" | "red" | "ok" | "warn" | "ink"; testId?: string }) {
  return (
    <span data-testid={testId} className={cn("inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
      tone === "red" && "bg-accent text-accent-foreground", tone === "ok" && "bg-success/10 text-success", tone === "warn" && "bg-warning-soft text-warning",
      tone === "ink" && "bg-foreground text-background", tone === "muted" && "bg-muted text-muted-foreground")}>{children}</span>
  );
}

function ErrorBox({ onRetry, msg }: { onRetry: () => void; msg?: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-3 font-bold">{msg ?? "تعذّر تحميل البيانات"}</p>
      <button onClick={onRetry} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground" data-testid="button-retry">
        <RotateCw className="h-4 w-4" /> إعادة المحاولة
      </button>
    </div>
  );
}

function EmptyBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted"><Inbox className="h-6 w-6 text-muted-foreground" /></div>
      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

const SkeletonRows = () => (
  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
);

/* ---------------- Delete dialog ---------------- */
function DeleteDialog({ reg, open, onOpenChange, onDeleted }: { reg: Registration | null; open: boolean; onOpenChange: (o: boolean) => void; onDeleted?: () => void }) {
  const del = useDeleteReg();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState("");
  if (!reg) return null;
  const ok = confirm.trim() === reg.referenceCode;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setConfirm(""); }}>
      <AlertDialogContent dir="rtl" className="rounded-2xl">
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /> حذف طلب التسجيل نهائياً</AlertDialogTitle>
          <AlertDialogDescription className="leading-7">
            سيُحذف الطلب <b dir="ltr" className="font-mono">{reg.referenceCode}</b> وجميع سجلاته المرتبطة: بيانات {reg.team ? `الفريق «${reg.team.name}» و${reg.team.totalMembers} أشخاص` : "المشارك"}، الدورات، {reg.team ? "الاحتياجات" : "التفضيلات"}، والفكرة. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="block text-sm">
          للتأكيد، اكتب الرقم المرجعي:
          <input dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={reg.referenceCode}
            className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 text-left font-mono focus:border-destructive focus:outline-none" data-testid="input-delete-confirm" />
        </label>
        {del.isError && <p className="text-sm text-destructive">{apiErrorMessage(del.error, "تعذّر الحذف. حاول مجدداً.")}</p>}
        <AlertDialogFooter className="gap-2 sm:justify-start">
          <AlertDialogAction
            disabled={!ok || del.isPending}
            onClick={(e) => {
              e.preventDefault();
              del.mutate({ id: reg.id }, {
                onSuccess: () => { toast({ title: "تم حذف الطلب", description: reg.referenceCode }); onOpenChange(false); setConfirm(""); onDeleted?.(); },
              });
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete"
          >
            {del.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حذف نهائي
          </AlertDialogAction>
          <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Overview ---------------- */
export function AdminOverview() {
  usePageMeta("نظرة عامة | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <AdminLayout title="نظرة عامة" crumb="لوحة المنظمين">
        <OverviewBody />
      </AdminLayout>
    </AdminGate>
  );
}

function OverviewBody() {
  const authed = useAuthed();
  const s = useSummary(authed);
  const list = useRegistrations(authed);
  if (s.isLoading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (s.isError || !s.data) return <ErrorBox onRetry={() => s.refetch()} />;
  const d = s.data;
  const cards = [
    { k: "registrations", l: "إجمالي طلبات التسجيل", v: d.registrations, i: FileText, hero: true, note: "كل طلب = فريق أو فرد" },
    { k: "participants", l: "إجمالي الأشخاص المسجلين", v: d.participants, i: Users, hero: true, note: "القادة + الأعضاء + الأفراد" },
    { k: "internalTeams", l: "فرق النادي / جامعة دمشق", v: d.internalTeams, i: Users },
    { k: "externalTeams", l: "الفرق الخارجية", v: d.externalTeams, i: Building2 },
    { k: "individuals", l: "المشاركون المنفردون", v: d.individuals, i: User },
    { k: "ideas", l: "الأفكار المقدمة", v: d.ideas, i: Lightbulb },
    { k: "needsIdea", l: "يحتاجون إلى فكرة", v: d.needsIdea, i: Lightbulb },
    { k: "needsMembers", l: "فرق تحتاج أعضاء", v: d.needsMembers, i: UserPlus },
  ];
  const recent = (list.data ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={cn("relative overflow-hidden rounded-2xl border p-5", c.hero ? "bg-ink text-ink-foreground border-transparent" : "bg-card")}>
            {c.hero && <div className="pixel-grid absolute inset-0" />}
            <div className="relative flex items-start justify-between">
              <span className={cn("text-sm", c.hero ? "text-white/65" : "text-muted-foreground")}>{c.l}</span>
              <c.i className={cn("h-4 w-4", c.hero ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="relative mt-4 font-pixel text-4xl leading-none" data-testid={`stat-${c.k}`}>{c.v}</div>
            {c.note && <div className="relative mt-3 text-xs text-white/45">{c.note}</div>}
          </motion.div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="font-bold">أحدث الطلبات</span>
          <Link to="/admin-hmk/registrations" className="inline-flex items-center gap-1 text-sm text-primary" data-testid="link-all-registrations">كل التسجيلات <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        {list.isLoading ? <div className="p-5"><SkeletonRows /></div> : recent.length === 0 ? (
          <div className="p-5"><EmptyBox title="لا توجد طلبات بعد" desc="ستظهر الطلبات هنا فور وصولها." /></div>
        ) : (
          <ul className="divide-y">
            {recent.map((r) => (
              <li key={r.id}>
                <Link to={`/admin-hmk/registrations/${r.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50" data-testid={`link-recent-${r.id}`}>
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">{r.referenceCode}</span>
                  <span className="flex-1 truncate font-medium">{r.team?.name ?? r.applicant.fullNameAr}</span>
                  <Pill tone={r.participationType === "TEAM" ? "red" : "muted"}>{PARTICIPATION_LABEL[r.participationType]}</Pill>
                  <span className="hidden text-xs text-muted-foreground sm:block">{fmtDate(r.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Filters ---------------- */
type Filters = { q: string; aff: string; org: string; part: string; year: string; course: string; idea: string; needs: string; role: string };
const emptyFilters: Filters = { q: "", aff: "", org: "", part: "", year: "", course: "", idea: "", needs: "", role: "" };

function applyFilters(list: Registration[], f: Filters) {
  const q = f.q.trim().toLowerCase();
  return list.filter((r) => {
    const ps = people(r);
    if (f.aff && r.affiliationType !== f.aff) return false;
    if (f.org && r.externalOrganizationName !== f.org) return false;
    if (f.part && r.participationType !== f.part) return false;
    if (f.year && !ps.some((p) => p.academicYear === f.year)) return false;
    if (f.course && !ps.some((p) => p.courses.includes(f.course))) return false;
    if (f.idea && r.idea.status !== f.idea) return false;
    if (f.needs === "yes" && !needsMembers(r)) return false;
    if (f.needs === "no" && (!r.team || needsMembers(r))) return false;
    if (f.role && !(r.preferences?.roles ?? []).includes(f.role)) return false;
    if (q) {
      const hay = [r.referenceCode, r.team?.name, r.externalOrganizationName, r.idea.title, r.preferences?.friendName, ...ps.flatMap((p) => [p.fullNameAr, p.fullNameEn, p.phone, p.telegramUsername])]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function Sel({ value, onChange, label, options, testId }: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[]; testId: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} data-testid={testId}
      className={cn("h-10 max-w-[220px] rounded-xl border bg-card px-3 text-sm focus:border-primary focus:outline-none", value && "border-primary/50 bg-accent/60 text-accent-foreground")}>
      <option value="">{label}: الكل</option>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function FilterBar({ f, set, orgs, mode }: { f: Filters; set: (f: Filters) => void; orgs: string[]; mode: "all" | "individuals" }) {
  const u = (k: keyof Filters) => (v: string) => set({ ...f, [k]: v });
  const active = Object.entries(f).filter(([k, v]) => v && k !== "q").length;
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-3 sm:p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="search" value={f.q} onChange={(e) => u("q")(e.target.value)} placeholder="ابحث بالاسم، اسم الفريق، الرقم المرجعي، الهاتف..."
          className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" data-testid="input-search" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {mode === "all" && (
          <>
            <Sel testId="filter-affiliation" label="الجهة" value={f.aff} onChange={u("aff")} options={[{ v: "INTERNAL", l: "طلاب النادي / جامعة دمشق" }, { v: "EXTERNAL", l: "جهات خارجية" }]} />
            <Sel testId="filter-org" label="اسم الجهة الخارجية" value={f.org} onChange={u("org")} options={orgs.map((o) => ({ v: o, l: o }))} />
            <Sel testId="filter-participation" label="نوع المشاركة" value={f.part} onChange={u("part")} options={[{ v: "TEAM", l: "فريق" }, { v: "INDIVIDUAL", l: "فرد" }]} />
          </>
        )}
        <Sel testId="filter-year" label="السنة" value={f.year} onChange={u("year")} options={YEARS.map((y) => ({ v: y, l: y }))} />
        <Sel testId="filter-course" label="الدورات" value={f.course} onChange={u("course")} options={COURSES.map((c) => ({ v: c, l: c }))} />
        <Sel testId="filter-idea" label="حالة الفكرة" value={f.idea} onChange={u("idea")} options={[{ v: "HAS_IDEA", l: IDEA_LABEL.HAS_IDEA }, { v: "NEEDS_IDEA", l: IDEA_LABEL.NEEDS_IDEA }]} />
        {mode === "all" && <Sel testId="filter-needs" label="احتياج أعضاء" value={f.needs} onChange={u("needs")} options={[{ v: "yes", l: "تحتاج أعضاء إضافيين" }, { v: "no", l: "فرق مكتملة" }]} />}
        {mode === "individuals" && <Sel testId="filter-role" label="الدور التقني" value={f.role} onChange={u("role")} options={ROLES.map((r) => ({ v: r, l: r }))} />}
        {(active > 0 || f.q) && (
          <button onClick={() => set(emptyFilters)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-primary hover:bg-accent" data-testid="button-clear-filters">
            <X className="h-4 w-4" /> مسح ({active + (f.q ? 1 : 0)})
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Registrations ---------------- */
export function AdminRegistrations() {
  usePageMeta("التسجيلات | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <AdminLayout title="جدول التسجيلات" crumb="لوحة المنظمين">
        <RegistrationsBody />
      </AdminLayout>
    </AdminGate>
  );
}

function RegistrationsBody() {
  const authed = useAuthed();
  const list = useRegistrations(authed);
  const nav = useNavigate();
  const [f, setF] = useState<Filters>(emptyFilters);
  const [toDelete, setToDelete] = useState<Registration | null>(null);
  const data = useMemo(() => (list.data ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [list.data]);
  const orgs = useMemo(() => Array.from(new Set(data.map((r) => r.externalOrganizationName).filter(Boolean) as string[])).sort(), [data]);
  const rows = useMemo(() => applyFilters(data, f), [data, f]);

  return (
    <div className="space-y-5">
      <FilterBar f={f} set={setF} orgs={orgs} mode="all" />
      <div className="text-sm text-muted-foreground" data-testid="text-result-count">{rows.length} من {data.length} طلب</div>
      {list.isLoading ? <SkeletonRows /> : list.isError ? <ErrorBox onRetry={() => list.refetch()} /> : data.length === 0 ? (
        <EmptyBox title="لا توجد تسجيلات بعد" desc="عند وصول أول طلب سيظهر هنا." />
      ) : rows.length === 0 ? (
        <EmptyBox title="لا نتائج مطابقة" desc="جرّب تعديل البحث أو مسح الفلاتر." />
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-start [&>th]:font-medium">
                  <th>الرقم المرجعي</th><th>نوع الجهة</th><th>الجهة الخارجية</th><th>القائد / المشارك</th><th>نوع المشاركة</th><th>الفريق</th><th>الأعضاء</th><th>حالة الفكرة</th><th>التاريخ</th><th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/admin-hmk/registrations/${r.id}`)} className="cursor-pointer transition-colors hover:bg-muted/40 [&>td]:px-4 [&>td]:py-3" data-testid={`row-registration-${r.id}`}>
                    <td dir="ltr" className="text-right font-mono text-xs">{r.referenceCode}</td>
                    <td><Pill tone={r.affiliationType === "EXTERNAL" ? "ink" : "muted"}>{r.affiliationType === "EXTERNAL" ? "خارجية" : "داخلية"}</Pill></td>
                    <td className="max-w-[160px] truncate">{r.externalOrganizationName ?? "—"}</td>
                    <td className="font-medium">{r.applicant.fullNameAr}</td>
                    <td>{PARTICIPATION_LABEL[r.participationType]}</td>
                    <td>{r.team?.name ?? "—"}{needsMembers(r) && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" title="تحتاج أعضاء" />}</td>
                    <td className="font-pixel">{memberCount(r)}</td>
                    <td><Pill tone={r.idea.status === "HAS_IDEA" ? "ok" : "warn"}>{IDEA_LABEL[r.idea.status]}</Pill></td>
                    <td className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.createdAt)}</td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); setToDelete(r); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="حذف" data-testid={`button-delete-${r.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4" data-testid={`card-registration-${r.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/admin-hmk/registrations/${r.id}`} className="min-w-0">
                    <div className="truncate font-bold">{r.team?.name ?? r.applicant.fullNameAr}</div>
                    <div dir="ltr" className="text-right font-mono text-xs text-muted-foreground">{r.referenceCode}</div>
                  </Link>
                  <button onClick={() => setToDelete(r)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill tone={r.affiliationType === "EXTERNAL" ? "ink" : "muted"}>{AFFILIATION_LABEL[r.affiliationType]}</Pill>
                  <Pill tone="red">{PARTICIPATION_LABEL[r.participationType]}</Pill>
                  <Pill tone={r.idea.status === "HAS_IDEA" ? "ok" : "warn"}>{IDEA_LABEL[r.idea.status]}</Pill>
                  {needsMembers(r) && <Pill tone="red">تحتاج أعضاء</Pill>}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{r.team ? `القائد: ${r.applicant.fullNameAr} · ${r.team.totalMembers} أعضاء` : r.applicant.fullNameAr}{r.externalOrganizationName ? ` · ${r.externalOrganizationName}` : ""} · {fmtDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <DeleteDialog reg={toDelete} open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} />
    </div>
  );
}

/* ---------------- Individuals ---------------- */
export function AdminIndividuals() {
  usePageMeta("المشاركون المنفردون | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <AdminLayout title="المشاركون المنفردون" crumb="أفراد غير موزعين على فرق">
        <IndividualsBody />
      </AdminLayout>
    </AdminGate>
  );
}

function IndividualsBody() {
  const authed = useAuthed();
  const list = useRegistrations(authed);
  const [f, setF] = useState<Filters>(emptyFilters);
  const [toDelete, setToDelete] = useState<Registration | null>(null);
  const data = useMemo(() => (list.data ?? []).filter((r) => r.participationType === "INDIVIDUAL").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [list.data]);
  const rows = useMemo(() => applyFilters(data, f), [data, f]);
  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">استعراض وفرز فقط، لتسهيل تشكيل الفرق لاحقاً خارج المنصة.</p>
      <FilterBar f={f} set={setF} orgs={[]} mode="individuals" />
      <div className="text-sm text-muted-foreground">{rows.length} من {data.length} مشارك</div>
      {list.isLoading ? <SkeletonRows /> : list.isError ? <ErrorBox onRetry={() => list.refetch()} /> : data.length === 0 ? (
        <EmptyBox title="لا يوجد مشاركون منفردون بعد" desc="سيظهر هنا كل من يسجّل كفرد." />
      ) : rows.length === 0 ? <EmptyBox title="لا نتائج مطابقة" desc="جرّب تعديل البحث أو مسح الفلاتر." /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((r) => {
            const p = r.applicant;
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5" data-testid={`card-individual-${r.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent font-bold text-accent-foreground">{p.fullNameAr.trim().charAt(0)}</span>
                    <div>
                      <Link to={`/admin-hmk/registrations/${r.id}`} className="font-bold hover:text-primary" data-testid={`link-individual-${r.id}`}>{p.fullNameAr}</Link>
                      <div dir="ltr" className="text-right text-xs text-muted-foreground">{p.fullNameEn} · <span className="font-mono">{r.referenceCode}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Pill tone={r.idea.status === "HAS_IDEA" ? "ok" : "warn"}>{IDEA_LABEL[r.idea.status]}</Pill>
                    <button onClick={() => setToDelete(r)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="حذف" data-testid={`button-delete-individual-${r.id}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">الكلية والاختصاص</dt><dd>{collegeOf(p)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">السنة</dt><dd>{p.academicYear}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">التواصل</dt><dd dir="ltr" className="text-right font-mono text-xs">{p.phone} · {p.telegramUsername}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">صديق يرغب بالعمل معه</dt><dd>{r.preferences?.friendName || "—"}</dd></div>
                </dl>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">التفضيلات التقنية</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{(r.preferences?.roles ?? []).map((x) => <Pill key={x} tone="red">{x}</Pill>)}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground">الدورات السابقة</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{coursesOf(p).map((x) => <Pill key={x}>{x}</Pill>)}</div>
                </div>
                {r.idea.status === "HAS_IDEA" && (
                  <div className="mt-4 rounded-xl bg-muted/60 p-3.5 text-sm">
                    <div className="font-bold">{r.idea.title} <span className="text-xs font-normal text-muted-foreground">· {projectTypeLabel(r.idea.projectType)}</span></div>
                    <p className="mt-1.5 line-clamp-3 leading-7 text-muted-foreground">{r.idea.description}</p>
                    <Link to={`/admin-hmk/registrations/${r.id}`} className="mt-1 inline-flex items-center text-xs text-primary">التفاصيل الكاملة <ChevronLeft className="h-3.5 w-3.5" /></Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <DeleteDialog reg={toDelete} open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} />
    </div>
  );
}

/* ---------------- Detail ---------------- */
export function AdminRegistrationDetail() {
  usePageMeta("تفاصيل الطلب | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <DetailBody />
    </AdminGate>
  );
}

function PersonCard({ p, role, idx }: { p: Participant; role: string; idx: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5" data-testid={`card-person-${idx}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted font-pixel text-sm">{String(idx + 1).padStart(2, "0")}</span>
          <div>
            <div className="font-bold">{p.fullNameAr}</div>
            <div dir="ltr" className="text-right text-xs text-muted-foreground">{p.fullNameEn}</div>
          </div>
        </div>
        <Pill tone={idx === 0 ? "red" : "muted"}>{role}</Pill>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">الكلية والاختصاص</dt><dd className="mt-0.5">{collegeOf(p)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">السنة الدراسية</dt><dd className="mt-0.5">{p.academicYear}</dd></div>
        <div><dt className="text-xs text-muted-foreground">التواصل</dt>
          <dd className="mt-0.5 space-y-0.5 font-mono text-xs" dir="ltr">
            <div className="flex items-center justify-end gap-1.5">{p.phone}<Phone className="h-3 w-3" /></div>
            <div className="flex items-center justify-end gap-1.5">{p.telegramUsername}<Send className="h-3 w-3" /></div>
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">{coursesOf(p).map((c) => <Pill key={c}>{c}</Pill>)}</div>
    </div>
  );
}

function DetailBody() {
  const { id } = useParams();
  const num = Number(id);
  const authed = useAuthed();
  const q = useRegistrationDetail(num, authed);
  const nav = useNavigate();
  const [del, setDel] = useState(false);
  const r = q.data;
  const back = r?.participationType === "INDIVIDUAL" ? "/admin-hmk/individuals" : "/admin-hmk/registrations";

  return (
    <AdminLayout
      title={r ? (r.team?.name ?? r.applicant.fullNameAr) : "تفاصيل الطلب"}
      crumb={<Link to={back} className="inline-flex items-center gap-1 hover:text-primary" data-testid="link-back-list"><ChevronLeft className="h-4 w-4 rotate-180" /> {r?.participationType === "INDIVIDUAL" ? "المشاركون المنفردون" : "التسجيلات"}</Link>}
    >
      {q.isLoading ? <SkeletonRows /> : q.isError || !r ? (
        <ErrorBox onRetry={() => q.refetch()} msg={(q.error as { status?: number } | null)?.status === 404 ? "الطلب غير موجود أو تم حذفه" : undefined} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {r.team && (
              <section className="rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="mb-4 font-extrabold">بيانات الفريق</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><div className="text-xs text-muted-foreground">اسم الفريق</div><div className="mt-1 font-bold">{r.team.name}</div></div>
                  <div><div className="text-xs text-muted-foreground">عدد الأعضاء</div><div className="mt-1 font-pixel text-xl">{r.team.totalMembers}</div></div>
                  <div><div className="text-xs text-muted-foreground">الجهة</div><div className="mt-1">{AFFILIATION_LABEL[r.affiliationType]}{r.externalOrganizationName ? ` · ${r.externalOrganizationName}` : ""}</div></div>
                </div>
                <div className="mt-5">
                  <div className="text-xs text-muted-foreground">احتياجات الفريق</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{r.team.needs.map((n) => <Pill key={n} tone={n === NEED_COMPLETE ? "ok" : "red"}>{n}</Pill>)}</div>
                </div>
              </section>
            )}
            {r.preferences && (
              <section className="rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="mb-4 font-extrabold">تفضيلات المشارك المنفرد</h2>
                <div className="flex flex-wrap gap-1.5">{r.preferences.roles.map((x) => <Pill key={x} tone="red">{x}</Pill>)}</div>
                <div className="mt-4 text-sm"><span className="text-muted-foreground">صديق يرغب بالعمل معه: </span>{r.preferences.friendName || "—"}</div>
              </section>
            )}
            <section>
              <h2 className="mb-3 font-extrabold">{r.team ? `الأشخاص (${people(r).length})` : "بيانات المشارك"}</h2>
              <div className="grid gap-3 xl:grid-cols-2">
                {people(r).map((p, i) => <PersonCard key={i} p={p} idx={i} role={i === 0 ? (r.team ? "قائد الفريق" : "مشارك منفرد") : `عضو ${i + 1}`} />)}
              </div>
            </section>
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-extrabold">فكرة المشروع</h2>
                <Pill tone={r.idea.status === "HAS_IDEA" ? "ok" : "warn"}>{IDEA_LABEL[r.idea.status]}</Pill>
              </div>
              {r.idea.status === "HAS_IDEA" ? (
                <div className="space-y-4">
                  <div><div className="text-xs text-muted-foreground">العنوان</div><div className="mt-1 text-lg font-bold">{r.idea.title}</div></div>
                  <div><div className="text-xs text-muted-foreground">نوع المشروع</div><div className="mt-1">{projectTypeLabel(r.idea.projectType)}</div></div>
                  <div><div className="text-xs text-muted-foreground">الملخص</div><p className="mt-1 whitespace-pre-line leading-8">{r.idea.description}</p></div>
                  <div><div className="text-xs text-muted-foreground">القطع والتقنيات المتوقعة</div><p className="mt-1 whitespace-pre-line leading-7">{r.idea.expectedTechnologies}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">لم يقدّم فكرة. يحتاج إلى مساعدة النادي في اختيار أو تطوير فكرة مناسبة.</p>}
            </section>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-ink-foreground">
              <div className="pixel-grid absolute inset-0" />
              <div className="relative">
                <div className="text-xs text-white/55">الرقم المرجعي</div>
                <div dir="ltr" className="mt-1 text-right font-pixel text-xl" data-testid="text-detail-reference">{r.referenceCode}</div>
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/55">نوع الجهة</span><span>{AFFILIATION_LABEL[r.affiliationType]}</span></div>
                  <div className="flex justify-between"><span className="text-white/55">المشاركة</span><span>{PARTICIPATION_LABEL[r.participationType]}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-white/55">التاريخ</span><span className="text-xs">{fmtDate(r.createdAt)}</span></div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-5 text-sm">
              <div className="font-bold">التعهدات</div>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <div className="flex justify-between"><span>ورشة التفكير التصميمي</span><span className={r.termsWorkshopAccepted ? "text-success" : "text-destructive"}>{r.termsWorkshopAccepted ? "موافق" : "لا"}</span></div>
                <div className="flex justify-between"><span>الحفاظ على المعدات</span><span className={r.termsEquipmentAccepted ? "text-success" : "text-destructive"}>{r.termsEquipmentAccepted ? "موافق" : "لا"}</span></div>
              </div>
            </div>
            <button onClick={() => setDel(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 text-sm font-bold text-destructive hover:bg-destructive/5" data-testid="button-delete-detail">
              <Trash2 className="h-4 w-4" /> حذف الطلب بالكامل
            </button>
          </aside>
        </div>
      )}
      <DeleteDialog reg={r ?? null} open={del} onOpenChange={setDel} onDeleted={() => nav(back, { replace: true })} />
    </AdminLayout>
  );
}
