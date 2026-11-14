import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, Building2, CalendarDays, FileText, Lightbulb, RotateCw, Table2, TrendingUp, User, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import type { Registration, Participant } from "@workspace/api-client-react";
import { AdminGate, AdminLayout } from "@/components/admin-shell";
import { usePageMeta } from "@/components/brand";
import { useAdminSession, useRegistrations } from "@/hooks/use-admin";
import {
  AFFILIATION_LABEL, COLLEGE_OTHER, COURSE_OTHER, NEED_COMPLETE, NEEDS, PROJECT_TYPES, ROLES, YEARS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/*
 * Colors (validated with the dataviz palette checker, light + dark surfaces):
 *   series-1 = brand red, series-2 = blue. Ranked bars use series-1 only (one hue);
 *   two-part splits use series-1 / series-2 with legend + direct labels.
 */
const SERIES = "[--s1:#e22c35] [--s2:#2a78d6] dark:[--s1:#e63740] dark:[--s2:#3987e5]";
const TZ = "Asia/Damascus";
const nf = new Intl.NumberFormat("en-US");
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

type Row = { key: string; label: string; value: number };

const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const dayLabel = (key: string) => {
  const [, m, d] = key.split("-");
  return `${Number(d)}/${Number(m)}`;
};
const fullDay = (key: string) =>
  new Intl.DateTimeFormat("ar-u-nu-latn", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${key}T12:00:00Z`));

function countBy<T>(items: T[], keys: (item: T) => string[], order?: readonly string[], label: (k: string) => string = (k) => k): Row[] {
  const map = new Map<string, number>();
  for (const it of items) for (const k of new Set(keys(it))) map.set(k, (map.get(k) ?? 0) + 1);
  const rows = [...map.entries()].map(([key, value]) => ({ key, label: label(key), value }));
  if (order) {
    const idx = (k: string) => { const i = order.indexOf(k); return i === -1 ? order.length : i; };
    return rows.sort((a, b) => idx(a.key) - idx(b.key));
  }
  return rows.sort((a, b) => b.value - a.value);
}

function useAnalytics(list: Registration[]) {
  return useMemo(() => {
    const teams = list.filter((r) => r.team);
    const indiv = list.filter((r) => r.participationType === "INDIVIDUAL");
    const people: Participant[] = list.flatMap((r) => [r.applicant, ...(r.team?.members ?? [])]);
    const participants = list.reduce((s, r) => s + (r.team?.totalMembers ?? 1), 0);
    const ideas = list.filter((r) => r.idea.status === "HAS_IDEA");
    const external = list.filter((r) => r.affiliationType === "EXTERNAL");
    const now = Date.now();
    const last24 = list.filter((r) => now - Date.parse(r.createdAt) <= 86_400_000).length;

    // daily series, gap-filled from the first registration to today (Damascus calendar)
    const byDay = new Map<string, { regs: number; people: number }>();
    for (const r of list) {
      const k = dayKey(r.createdAt);
      const v = byDay.get(k) ?? { regs: 0, people: 0 };
      v.regs += 1; v.people += r.team?.totalMembers ?? 1;
      byDay.set(k, v);
    }
    const days: { key: string; label: string; regs: number; people: number; cumulative: number }[] = [];
    if (list.length) {
      const first = [...byDay.keys()].sort()[0]!;
      const today = dayKey(new Date().toISOString());
      let cumulative = 0;
      for (let t = Date.parse(`${first}T12:00:00Z`); ; t += 86_400_000) {
        const key = new Date(t).toISOString().slice(0, 10);
        const v = byDay.get(key) ?? { regs: 0, people: 0 };
        cumulative += v.people;
        days.push({ key, label: dayLabel(key), regs: v.regs, people: v.people, cumulative });
        if (key >= today || days.length > 400) break;
      }
    }
    const busiest = days.reduce<(typeof days)[number] | null>((b, d) => (!b || d.regs > b.regs ? d : b), null);

    return {
      total: list.length, participants, teams: teams.length, individuals: indiv.length, last24,
      avgTeam: teams.length ? teams.reduce((s, r) => s + r.team!.totalMembers, 0) / teams.length : 0,
      externalShare: pct(external.length, list.length), ideaShare: pct(ideas.length, list.length),
      days, busiest,
      splits: {
        participation: [
          { key: "TEAM", label: "فرق", value: teams.length },
          { key: "INDIVIDUAL", label: "أفراد", value: indiv.length },
        ],
        affiliation: [
          { key: "INTERNAL", label: AFFILIATION_LABEL.INTERNAL!, value: list.length - external.length },
          { key: "EXTERNAL", label: AFFILIATION_LABEL.EXTERNAL!, value: external.length },
        ],
        idea: [
          { key: "HAS_IDEA", label: "لديهم فكرة", value: ideas.length },
          { key: "NEEDS_IDEA", label: "يحتاجون فكرة", value: list.length - ideas.length },
        ],
        completion: [
          { key: "COMPLETE", label: "مكتملة", value: teams.filter((r) => r.team!.needs.includes(NEED_COMPLETE)).length },
          { key: "NEEDS", label: "تحتاج أعضاء", value: teams.filter((r) => !r.team!.needs.includes(NEED_COMPLETE)).length },
        ],
      },
      colleges: countBy(people, (p) => [p.college], undefined, (k) => (k === COLLEGE_OTHER ? "أخرى (جامعات وكليات أخرى)" : k.replace("كلية الهندسة الميكانيكية والكهربائية - ", "الميكانيك والكهرباء · "))),
      years: countBy(people, (p) => [p.academicYear], YEARS),
      courses: countBy(people, (p) => p.courses, undefined, (k) => (k === COURSE_OTHER ? "دورة أخرى" : k)),
      projectTypes: countBy(ideas, (r) => (r.idea.projectType ? [r.idea.projectType] : []), PROJECT_TYPES.map((p) => p.value), (k) => PROJECT_TYPES.find((p) => p.value === k)?.label ?? k),
      teamSizes: countBy(teams, (r) => [String(r.team!.totalMembers)], ["2", "3", "4", "5", "6"], (k) => `${k} أشخاص`),
      needs: countBy(teams, (r) => r.team!.needs, NEEDS),
      roles: countBy(indiv, (r) => r.preferences?.roles ?? [], ROLES),
      orgs: countBy(external, (r) => [r.externalOrganizationName?.trim() || "—"]),
      peopleCount: people.length,
      ideasCount: ideas.length,
    };
  }, [list]);
}

/* ---------------- page ---------------- */
export default function AdminAnalytics() {
  usePageMeta("التحليلات | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <AdminLayout title="التحليلات" crumb="لوحة المنظمين">
        <AnalyticsBody />
      </AdminLayout>
    </AdminGate>
  );
}

function AnalyticsBody() {
  const authed = !!useAdminSession().data?.authenticated;
  const list = useRegistrations(authed);
  const a = useAnalytics(list.data ?? []);
  if (list.isLoading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (list.isError)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 font-bold">تعذّر تحميل البيانات</p>
        <button onClick={() => list.refetch()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"><RotateCw className="h-4 w-4" /> إعادة المحاولة</button>
      </div>
    );
  if (a.total === 0)
    return (
      <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-4 font-bold">لا توجد بيانات للتحليل بعد</p>
        <p className="mt-1 text-sm text-muted-foreground">ستظهر الرسوم البيانية تلقائياً عند وصول أول طلب تسجيل.</p>
      </div>
    );

  const kpis = [
    { l: "طلبات التسجيل", v: nf.format(a.total), i: FileText, note: `${a.last24} خلال آخر 24 ساعة`, hero: true },
    { l: "الأشخاص المسجلون", v: nf.format(a.participants), i: Users, note: "القادة + الأعضاء + الأفراد", hero: true },
    { l: "متوسط حجم الفريق", v: a.avgTeam ? a.avgTeam.toFixed(1) : "—", i: Users, note: `${a.teams} فريقاً` },
    { l: "المشاركون المنفردون", v: nf.format(a.individuals), i: User, note: `${pct(a.individuals, a.total)}% من الطلبات` },
    { l: "طلبات من جهات خارجية", v: `${a.externalShare}%`, i: Building2, note: `${a.orgs.length} جهة` },
    { l: "طلبات لديها فكرة", v: `${a.ideaShare}%`, i: Lightbulb, note: `${a.ideasCount} فكرة مقدّمة` },
    { l: "أنشط يوم", v: a.busiest ? nf.format(a.busiest.regs) : "—", i: CalendarDays, note: a.busiest ? fullDay(a.busiest.key) : "" },
    { l: "أيام منذ أول طلب", v: nf.format(a.days.length), i: TrendingUp, note: a.days.length ? `${(a.total / a.days.length).toFixed(1)} طلب يومياً بالمتوسط` : "" },
  ];

  return (
    <div className={cn("space-y-6", SERIES)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={cn("relative overflow-hidden rounded-2xl border p-5", k.hero ? "border-transparent bg-ink text-ink-foreground" : "bg-card")}>
            {k.hero && <div className="pixel-grid absolute inset-0" />}
            <div className="relative flex items-start justify-between">
              <span className={cn("text-sm", k.hero ? "text-white/65" : "text-muted-foreground")}>{k.l}</span>
              <k.i className={cn("h-4 w-4", k.hero ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="relative mt-4 font-pixel text-4xl leading-none" dir="ltr" style={{ textAlign: "right" }}>{k.v}</div>
            {k.note && <div className={cn("relative mt-3 text-xs", k.hero ? "text-white/45" : "text-muted-foreground")}>{k.note}</div>}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="طلبات التسجيل اليومية" sub="عدد الطلبات الجديدة في كل يوم (بتوقيت دمشق)">
          <DailyBars data={a.days} />
          <DayTable data={a.days} />
        </Panel>
        <Panel title="النمو التراكمي للمشاركين" sub="إجمالي الأشخاص المسجلين حتى نهاية كل يوم">
          <CumulativeLine data={a.days} />
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="تركيبة الطلبات" sub="أجزاء من الكل — كل شريط يمثل 100%">
          <div className="space-y-6">
            <Split title="نوع المشاركة" rows={a.splits.participation} />
            <Split title="الجهة" rows={a.splits.affiliation} />
            <Split title="حالة الفكرة" rows={a.splits.idea} />
            {a.teams > 0 && <Split title="اكتمال الفرق" rows={a.splits.completion} />}
          </div>
        </Panel>
        <Panel title="أحجام الفرق" sub="عدد الفرق حسب عدد الأعضاء (شاملاً القائد)">
          <Ranked rows={a.teamSizes} total={a.teams} unit="فريق" />
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="الكليات والاختصاصات" sub={`من أصل ${a.peopleCount} شخصاً`}>
          <Ranked rows={a.colleges} total={a.peopleCount} unit="شخص" />
        </Panel>
        <Panel title="السنوات الدراسية" sub={`من أصل ${a.peopleCount} شخصاً`}>
          <Ranked rows={a.years} total={a.peopleCount} unit="شخص" />
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="الدورات التي حضرها المشاركون" sub="قد يختار الشخص أكثر من دورة، لذا لا يساوي المجموع 100%">
          <Ranked rows={a.courses} total={a.peopleCount} unit="شخص" />
        </Panel>
        <Panel title="أنواع المشاريع" sub={`من أصل ${a.ideasCount} فكرة مقدّمة`}>
          <Ranked rows={a.projectTypes} total={a.ideasCount} unit="فكرة" empty="لم تُقدَّم أفكار بعد" />
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="احتياجات الفرق" sub={`من أصل ${a.teams} فريقاً · قد يختار الفريق أكثر من احتياج`}>
          <Ranked rows={a.needs} total={a.teams} unit="فريق" empty="لا توجد فرق بعد" />
        </Panel>
        <Panel title="الأدوار المفضلة للمنفردين" sub={`من أصل ${a.individuals} مشاركاً منفرداً · اختيار متعدد`}>
          <Ranked rows={a.roles} total={a.individuals} unit="شخص" empty="لا يوجد مشاركون منفردون بعد" />
        </Panel>
      </div>

      {a.orgs.length > 0 && (
        <Panel title="الجهات الخارجية" sub="عدد الفرق من كل جهة">
          <Ranked rows={a.orgs} total={a.total - a.splits.affiliation[0]!.value} unit="فريق" />
        </Panel>
      )}
    </div>
  );
}

/* ---------------- building blocks ---------------- */
function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-bold">{title}</h2>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Ranked horizontal bars — one hue, values and shares always visible (doubles as the table view). */
function Ranked({ rows, total, unit, empty = "لا توجد بيانات" }: { rows: Row[]; total: number; unit: string; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3" role="list">
      {rows.map((r) => (
        <li key={r.key} className="group" title={`${r.label}: ${r.value} ${unit} (${pct(r.value, total)}%)`} tabIndex={0}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground/85">{r.label}</span>
            <span className="shrink-0 tabular-nums" dir="ltr"><b>{r.value}</b> <span className="text-muted-foreground">· {pct(r.value, total)}%</span></span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[var(--s1)] transition-[filter] group-hover:brightness-110 group-focus:brightness-110"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Two-part split as one 100% bar, with legend + direct labels (identity never color-alone). */
function Split({ title, rows }: { title: string; rows: Row[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const colors = ["var(--s1)", "var(--s2)"];
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex h-7 gap-[2px] overflow-hidden rounded-lg bg-muted" role="img" aria-label={rows.map((r) => `${r.label} ${r.value}`).join("، ")}>
        {rows.map((r, i) => r.value > 0 && (
          <div key={r.key} className="h-full first:rounded-r-lg last:rounded-l-lg hover:brightness-110" title={`${r.label}: ${r.value} (${pct(r.value, total)}%)`}
            style={{ width: `${(r.value / Math.max(total, 1)) * 100}%`, background: colors[i] }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {rows.map((r, i) => (
          <span key={r.key} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[i] }} />
            {r.label} <b className="text-foreground tabular-nums" dir="ltr">{r.value} · {pct(r.value, total)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

type Day = { key: string; label: string; regs: number; people: number; cumulative: number };

function ChartTip({ active, payload, kind }: TooltipProps<number, string> & { kind: "daily" | "cumulative" }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload as Day;
  return (
    <div dir="rtl" className="rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-muted-foreground">{fullDay(d.key)}</div>
      {kind === "daily" ? (
        <>
          <div className="flex items-center gap-2"><span className="h-0.5 w-3 bg-[var(--s1)]" /><b className="text-sm tabular-nums">{d.regs}</b> طلب جديد</div>
          <div className="mt-0.5 text-muted-foreground">{d.people} شخصاً</div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2"><span className="h-0.5 w-3 bg-[var(--s1)]" /><b className="text-sm tabular-nums">{d.cumulative}</b> شخصاً حتى هذا اليوم</div>
          <div className="mt-0.5 text-muted-foreground">+{d.people} في هذا اليوم</div>
        </>
      )}
    </div>
  );
}

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false } as const;

function DailyBars({ data }: { data: Day[] }) {
  return (
    <div dir="ltr" className="h-64" role="img" aria-label="رسم بياني لعدد الطلبات اليومية">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="0" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axis} allowDecimals={false} width={44} />
          <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }} content={<ChartTip kind="daily" />} />
          <Bar dataKey="regs" fill="var(--s1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CumulativeLine({ data }: { data: Day[] }) {
  return (
    <div dir="ltr" className="h-64" role="img" aria-label="رسم بياني للنمو التراكمي للمشاركين">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axis} allowDecimals={false} width={44} />
          <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }} content={<ChartTip kind="cumulative" />} />
          <Line type="monotone" dataKey="cumulative" stroke="var(--s1)" strokeWidth={2} dot={data.length <= 14 ? { r: 4, fill: "var(--s1)", stroke: "hsl(var(--card))", strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: "var(--s1)", stroke: "hsl(var(--card))", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayTable({ data }: { data: Day[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" aria-expanded={open} data-testid="button-toggle-day-table">
        <Table2 className="h-3.5 w-3.5" /> {open ? "إخفاء الجدول" : "عرض البيانات كجدول"}
      </button>
      {open && (
        <div className="mt-3 max-h-72 overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr><th className="px-3 py-2 text-right font-medium">اليوم</th><th className="px-3 py-2 text-right font-medium">طلبات</th><th className="px-3 py-2 text-right font-medium">أشخاص</th><th className="px-3 py-2 text-right font-medium">التراكمي</th></tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.key}><td className="px-3 py-1.5">{fullDay(d.key)}</td><td className="px-3 py-1.5">{d.regs}</td><td className="px-3 py-1.5">{d.people}</td><td className="px-3 py-1.5">{d.cumulative}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
