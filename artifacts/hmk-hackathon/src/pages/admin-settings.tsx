import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Loader2, Lock, LockOpen, MessageSquareText, RotateCw, Save, Timer } from "lucide-react";
import type { RegistrationMode, RegistrationSettings } from "@workspace/api-client-react";
import { AdminGate, AdminLayout } from "@/components/admin-shell";
import { usePageMeta } from "@/components/brand";
import { useAdminSession, useRegSettings, useSaveRegSettings, apiErrorMessage } from "@/hooks/use-admin";
import { formatDeadline } from "@/hooks/use-registration-window";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TZ = "Asia/Damascus";
const MAX_MESSAGE = 600;

/* Damascus wall-clock <-> UTC ISO, independent of the admin's own time zone. */
function damascusParts(ms: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}
const pad = (n: number) => String(n).padStart(2, "0");
export function isoToDamascusInput(iso: string) {
  const p = damascusParts(Date.parse(iso));
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`;
}
export function damascusInputToIso(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((v) => Number(v ?? 0)) as [number, number, number, number, number, number];
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const p = damascusParts(guess);
  const offset = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - guess;
  return new Date(guess - offset).toISOString();
}

const MODES: { v: RegistrationMode; title: string; desc: string; icon: typeof Timer }[] = [
  { v: "AUTO", title: "تلقائي حسب الموعد", desc: "مفتوح حتى الموعد النهائي ثم يُغلق وحده.", icon: Timer },
  { v: "OPEN", title: "مفتوح يدوياً", desc: "يبقى مفتوحاً حتى بعد الموعد إلى أن تغيّره.", icon: LockOpen },
  { v: "CLOSED", title: "مغلق يدوياً", desc: "يُغلق فوراً لكل الزوار مهما كان الموعد.", icon: Lock },
];

export default function AdminSettings() {
  usePageMeta("التحكم بالتسجيل | لوحة منظمي هاكاثون الهمك");
  return (
    <AdminGate>
      <AdminLayout title="التحكم بالتسجيل" crumb="لوحة المنظمين">
        <SettingsBody />
      </AdminLayout>
    </AdminGate>
  );
}

function SettingsBody() {
  const authed = !!useAdminSession().data?.authenticated;
  const q = useRegSettings(authed);
  if (q.isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (q.isError || !q.data)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 font-bold">تعذّر تحميل إعدادات التسجيل</p>
        <button onClick={() => q.refetch()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground" data-testid="button-retry-settings">
          <RotateCw className="h-4 w-4" /> إعادة المحاولة
        </button>
      </div>
    );
  return <SettingsForm current={q.data} />;
}

function SettingsForm({ current }: { current: RegistrationSettings }) {
  const save = useSaveRegSettings();
  const { toast } = useToast();
  const [mode, setMode] = useState<RegistrationMode>(current.mode);
  const [deadlineInput, setDeadlineInput] = useState(() => isoToDamascusInput(current.deadline));
  const [message, setMessage] = useState(current.closedMessage);

  // Re-sync when the server copy changes (another organizer saved, or after our own save).
  useEffect(() => {
    setMode(current.mode);
    setDeadlineInput(isoToDamascusInput(current.deadline));
    setMessage(current.closedMessage);
  }, [current.mode, current.deadline, current.closedMessage, current.updatedAt]);

  const deadlineIso = useMemo(() => damascusInputToIso(deadlineInput), [deadlineInput]);
  const dirty = mode !== current.mode || deadlineIso !== new Date(current.deadline).toISOString() || message.trim() !== current.closedMessage;
  const deadlinePast = deadlineIso ? Date.parse(deadlineIso) < Date.now() : false;
  const willBeOpen = mode === "OPEN" || (mode === "AUTO" && !deadlinePast);
  const invalid = !deadlineIso || message.length > MAX_MESSAGE;

  const submit = (override?: Partial<{ mode: RegistrationMode }>) => {
    const m = override?.mode ?? mode;
    const deadline = override ? current.deadline : deadlineIso;
    if (!deadline) return;
    save.mutate(
      { data: { mode: m, deadline, closedMessage: override ? current.closedMessage : message.trim() } },
      {
        onSuccess: (s) => toast({ title: s.open ? "التسجيل مفتوح الآن" : "التسجيل مغلق الآن", description: "تم حفظ الإعدادات وتطبيقها على الموقع فوراً." }),
        onError: (e) => toast({ title: "تعذّر الحفظ", description: apiErrorMessage(e, "حاول مجدداً."), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* mode */}
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <h2 className="flex items-center gap-2 font-bold"><Timer className="h-4 w-4 text-primary" /> وضع التسجيل</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="وضع التسجيل">
            {MODES.map((m) => (
              <button key={m.v} type="button" role="radio" aria-checked={mode === m.v} onClick={() => setMode(m.v)} data-testid={`mode-${m.v.toLowerCase()}`}
                className={cn("rounded-xl border p-4 text-right transition-colors", mode === m.v ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "hover:border-primary/40")}>
                <m.icon className={cn("h-5 w-5", mode === m.v ? "text-primary" : "text-muted-foreground")} />
                <div className="mt-3 font-bold">{m.title}</div>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* deadline */}
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <h2 className="flex items-center gap-2 font-bold"><CalendarClock className="h-4 w-4 text-primary" /> الموعد النهائي</h2>
          <p className="mt-1 text-sm text-muted-foreground">بتوقيت دمشق. يُستخدم للإغلاق التلقائي وللعد التنازلي في الصفحة الرئيسية.</p>
          <input type="datetime-local" step={1} dir="ltr" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)}
            className="mt-4 h-12 w-full max-w-sm rounded-xl border border-input bg-background px-3 text-left focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            aria-label="الموعد النهائي بتوقيت دمشق" data-testid="input-deadline" />
          {deadlineIso && <p className="mt-2 text-sm text-muted-foreground" data-testid="text-deadline-preview">{formatDeadline(deadlineIso)}</p>}
          {!deadlineIso && <p className="mt-2 text-sm text-destructive">أدخل تاريخاً ووقتاً صحيحين.</p>}
          {deadlinePast && mode === "AUTO" && (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" /> هذا الموعد مضى، لذلك سيبقى التسجيل مغلقاً في الوضع التلقائي.
            </p>
          )}
        </section>

        {/* message */}
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <h2 className="flex items-center gap-2 font-bold"><MessageSquareText className="h-4 w-4 text-primary" /> رسالة الإغلاق</h2>
          <p className="mt-1 text-sm text-muted-foreground">تظهر للزوار عندما يكون التسجيل مغلقاً. اتركها فارغة لاستخدام الرسالة الافتراضية.</p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={MAX_MESSAGE + 50}
            placeholder="مثال: اكتمل العدد المطلوب. نشكر اهتمامكم، تابعوا قناة النادي لمعرفة الفعاليات القادمة."
            className="mt-4 w-full rounded-xl border border-input bg-background p-3 leading-7 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" data-testid="input-closed-message" />
          <div className={cn("mt-1 text-left text-xs", message.length > MAX_MESSAGE ? "text-destructive" : "text-muted-foreground")} dir="ltr">{message.length} / {MAX_MESSAGE}</div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={!dirty || invalid || save.isPending} onClick={() => submit()} data-testid="button-save-settings"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ وتطبيق
          </button>
          {dirty && (
            <span className="text-sm text-muted-foreground">
              بعد الحفظ سيكون التسجيل <b className={willBeOpen ? "text-success" : "text-primary"}>{willBeOpen ? "مفتوحاً" : "مغلقاً"}</b>
            </span>
          )}
        </div>
      </div>

      {/* live status */}
      <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <motion.div layout className="relative overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground">
          <div className="pixel-grid absolute inset-0" />
          <div className="relative">
            <div className="text-xs text-white/55">الحالة على الموقع الآن</div>
            <div className="mt-3 flex items-center gap-3" data-testid="text-live-status">
              <span className={cn("grid h-11 w-11 place-items-center rounded-xl", current.open ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary")}>
                {current.open ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </span>
              <span className="text-2xl font-black">{current.open ? "مفتوح" : "مغلق"}</span>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-white/55">الوضع</dt><dd>{MODES.find((m) => m.v === current.mode)?.title}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/55">الموعد</dt><dd className="text-left">{formatDeadline(current.deadline)}</dd></div>
              {current.updatedAt && (
                <div className="flex justify-between gap-3"><dt className="text-white/55">آخر تعديل</dt><dd className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDeadline(current.updatedAt)}</dd></div>
              )}
            </dl>
            <div className="mt-6 grid gap-2">
              {current.open ? (
                <button type="button" onClick={() => submit({ mode: "CLOSED" })} disabled={save.isPending} data-testid="button-close-now"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
                  <Lock className="h-4 w-4" /> إغلاق التسجيل الآن
                </button>
              ) : (
                <button type="button" onClick={() => submit({ mode: "OPEN" })} disabled={save.isPending} data-testid="button-open-now"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-60">
                  <LockOpen className="h-4 w-4" /> فتح التسجيل الآن
                </button>
              )}
              <p className="text-center text-xs leading-6 text-white/45">الإجراء السريع يحتفظ بالموعد والرسالة الحاليين.</p>
            </div>
          </div>
        </motion.div>
        <a href="/register" target="_blank" rel="noreferrer" className="block rounded-xl border bg-card p-4 text-sm hover:border-primary/40" data-testid="link-preview-register">
          معاينة صفحة التسجيل كما يراها الزوار ←
        </a>
      </aside>
    </div>
  );
}
