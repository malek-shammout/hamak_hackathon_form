import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, ShieldCheck, Layers, Scale, Gavel, Check } from "lucide-react";
import { GUIDE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "about", label: "النبذة", icon: BookOpen },
  { id: "goals", label: "الأهداف", icon: Target },
  { id: "terms", label: "الشروط", icon: ShieldCheck },
  { id: "stages", label: "المراحل الثلاث", icon: Layers },
  { id: "criteria", label: "معايير التقييم", icon: Scale },
  { id: "rules", label: "القواعد العامة", icon: Gavel },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[15px] leading-7 text-foreground/85">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-primary" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Panel({ id }: { id: TabId }) {
  switch (id) {
    case "about":
      return (
        <div className="space-y-6">
          <p className="text-lg leading-9 text-foreground/90">{GUIDE.about}</p>
          <div className="rounded-xl border border-primary/25 bg-accent/60 p-5 text-[15px] leading-8 text-foreground/90">
            {GUIDE.openField}
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold text-muted-foreground">مبدأ المجال المفتوح</h4>
            <Bullets items={GUIDE.openPrinciple} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {GUIDE.projectTypes.map((p, i) => (
              <div key={p.t} className="rounded-xl border bg-background/60 p-4">
                <div className="font-pixel text-xs text-primary">0{i + 1}</div>
                <div className="mt-2 font-bold">{p.t}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            <span className="font-bold text-foreground">أمثلة للإلهام فقط، وليست قيداً: </span>
            {GUIDE.inspiration}
          </p>
        </div>
      );
    case "goals":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {GUIDE.goals.map((g, i) => (
            <li key={g} className="flex gap-4 rounded-xl border bg-background/60 p-4">
              <span className="font-pixel text-2xl leading-none text-primary">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] leading-7">{g}</span>
            </li>
          ))}
        </ol>
      );
    case "terms":
      return (
        <div className="space-y-7">
          <div>
            <h4 className="mb-3 font-bold">من يحق له المشاركة (وفق الدليل)</h4>
            <Bullets items={GUIDE.eligibility} />
          </div>
          <div>
            <h4 className="mb-3 font-bold">الفريق والمشاركة</h4>
            <Bullets items={GUIDE.team} />
          </div>
          <div className="rounded-xl border border-dashed border-primary/40 p-4 text-[15px] leading-7">
            <span className="font-bold text-primary">تحديث بخصوص الجهات الخارجية: </span>
            {GUIDE.external}
          </div>
          <div>
            <h4 className="mb-3 font-bold">شروط المشروع</h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GUIDE.projectConditions.map((c) => (
                <div key={c.t} className="flex gap-3 rounded-lg bg-muted/70 p-3.5">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm leading-6">
                    <span className="font-bold">{c.t}: </span>
                    {c.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-bold">المرشد</h4>
            <Bullets items={GUIDE.mentor} />
          </div>
        </div>
      );
    case "stages":
      return (
        <div className="space-y-5">
          <div className="flex h-3 overflow-hidden rounded-full" dir="rtl">
            {GUIDE.stages.map((s, i) => (
              <div key={s.n} style={{ width: `${s.w}%` }} className={cn(i === 0 ? "bg-primary" : i === 1 ? "bg-foreground/80" : "bg-primary/45")} />
            ))}
          </div>
          {GUIDE.stages.map((s) => (
            <div key={s.n} className="grid gap-4 rounded-xl border bg-background/60 p-5 sm:grid-cols-[110px_1fr]">
              <div>
                <div className="font-pixel text-4xl leading-none text-primary">{s.n}</div>
                <div className="mt-2 text-xs text-muted-foreground">الوزن <span className="font-pixel text-foreground">{s.w}%</span></div>
              </div>
              <div>
                <h4 className="text-lg font-bold">{s.t}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{s.what}</p>
                <div className="mt-2 inline-flex rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">التسليم: {s.deliver}</div>
                <div className="mt-3"><Bullets items={s.points} /></div>
              </div>
            </div>
          ))}
          <div>
            <h4 className="mb-3 font-bold">قبول الأفكار</h4>
            <Bullets items={GUIDE.acceptance} />
          </div>
        </div>
      );
    case "criteria":
      return (
        <div className="space-y-6">
          {GUIDE.criteria.map((c) => (
            <div key={c.stage} className="overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between bg-muted/70 px-4 py-3">
                <span className="font-bold">{c.stage}</span>
                <span className="text-xs text-muted-foreground">من 100 · الوزن <span className="font-pixel text-primary">{c.weight}%</span></span>
              </div>
              <div className="divide-y">
                {c.rows.map(([name, pts, q]) => (
                  <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[200px_1fr_auto]">
                    <span className="font-medium">{name}</span>
                    <span className="hidden text-sm text-muted-foreground sm:block">{q}</span>
                    <span className="font-pixel text-lg text-primary">{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="rounded-xl bg-accent/60 p-4 text-sm leading-7">
            النتيجة النهائية = مجموع (درجة كل مرحلة × وزنها). الأوزان: الأولى 20%، الثانية 40%، الثالثة 40%. {GUIDE.tieBreak}
          </p>
        </div>
      );
    case "rules":
      return (
        <div className="space-y-7">
          <Bullets items={GUIDE.rules} />
          <div className="overflow-hidden rounded-xl border">
            <div className="bg-muted/70 px-4 py-3 font-bold">المخالفات</div>
            <div className="divide-y">
              {GUIDE.violations.map(([v, a]) => (
                <div key={v} className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr]">
                  <span className="font-medium">{v}</span>
                  <span className="text-sm text-muted-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-bold">الملكية الفكرية</h4>
            <Bullets items={GUIDE.ip} />
          </div>
        </div>
      );
  }
}

export function GuideTabs({ className }: { className?: string }) {
  const [tab, setTab] = useState<TabId>("about");
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[230px_1fr]", className)}>
      <div role="tablist" aria-label="أقسام الدليل" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              data-testid={`tab-guide-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary/40 bg-accent text-accent-foreground" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-[360px] rounded-2xl border bg-card p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            <Panel id={tab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
