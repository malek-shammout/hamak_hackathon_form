import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FormProvider, useFormContext, useController, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Building2, Users, User, Lightbulb, HelpCircle, Check, CheckCircle2, Copy,
  Loader2, Lock, Pencil, ShieldCheck, FileText, Cpu, UserPlus, AlertTriangle,
} from "lucide-react";
import { useSubmitRegistration } from "@workspace/api-client-react";
import { PublicHeader } from "@/components/public-chrome";
import { ClubLogo, HackLogo, usePageMeta } from "@/components/brand";
import { Countdown } from "@/components/countdown";
import { ChoiceCard, ChipGroup, CheckRow, Field, SelectInput, TextArea, TextInput } from "@/components/form-bits";
import { ParticipantFields, getErr } from "@/components/participant-fields";
import { useRegistrationWindow } from "@/pages/home";
import { regSchema, defaultValues, emptyParticipant, toPayload, type RegForm } from "@/lib/registration-schema";
import {
  COURSE_OUTSIDE, NEEDS, NEED_COMPLETE, PROJECT_TYPES, ROLES, AFFILIATION_LABEL, PARTICIPATION_LABEL, IDEA_LABEL,
  countWords, projectTypeLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type StepKey = "basics" | "team" | "prefs" | "path" | "idea" | "review";
const STEP_LABEL: Record<StepKey, string> = {
  basics: "الجهة والبيانات الأساسية",
  team: "بيانات الفريق",
  prefs: "تفضيلات المشارك",
  path: "الفريق أو التفضيلات",
  idea: "فكرة المشروع",
  review: "المراجعة والتعهدات",
};
const STEP_FIELDS: Record<StepKey, string[]> = {
  basics: ["affiliationType", "externalOrganizationName", "applicant", "participationType"],
  team: ["team"],
  prefs: ["preferences"],
  path: [],
  idea: ["idea"],
  review: ["termsWorkshopAccepted", "termsEquipmentAccepted"],
};

function SectionHead({ n, title, desc, icon }: { n: string; title: string; desc?: string; icon: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent font-pixel text-sm text-primary">{n}</span>
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
        </div>
      </div>
      <span className="text-muted-foreground/60">{icon}</span>
    </div>
  );
}

const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl border bg-card p-5 shadow-sm sm:p-7", className)}>{children}</div>
);

export default function Register() {
  usePageMeta("التسجيل | هاكاثون الروبوتيك والذكاء الصنعي - نادي الهمك", "سجّل فريقك أو سجّل كمشارك منفرد في هاكاثون الروبوتيك والذكاء الصنعي - نادي الهمك، جامعة دمشق.");
  const { open, deadline, loading } = useRegistrationWindow();
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background">
      <PublicHeader />
      {done ? (
        <SuccessScreen code={done} />
      ) : loading ? (
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
          <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : !open ? (
        <ClosedScreen deadline={deadline} />
      ) : (
        <Wizard onDone={setDone} />
      )}
    </div>
  );
}

function ClosedScreen({ deadline }: { deadline: string }) {
  return (
    <div className="px-4 py-16">
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl bg-ink p-10 text-center text-ink-foreground">
        <div className="pixel-grid absolute inset-0" />
        <div className="relative">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-6 text-3xl font-black" data-testid="text-registration-closed">انتهى التسجيل</h1>
          <p className="mt-3 leading-8 text-white/65">أُغلق باب التسجيل في 1 ديسمبر 2026 الساعة 23:59:59 بتوقيت دمشق. شكراً لاهتمامك.</p>
          <div className="mt-8 flex justify-center"><Countdown deadline={deadline} compact /></div>
          <Link to="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm hover:bg-white/5" data-testid="link-back-home">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
  return (
    <div className="px-4 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] bg-ink text-ink-foreground">
        <div className="pixel-grid absolute inset-0" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]" />
        <div className="relative px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="flex items-center justify-center gap-5">
            <ClubLogo surface="dark" className="h-12 w-auto" />
            <span className="h-10 w-px bg-white/15" />
            <HackLogo surface="dark" className="h-10 w-auto" />
          </div>
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 14 }}
            className="mx-auto mt-10 grid h-20 w-20 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <CheckCircle2 className="h-10 w-10" />
          </motion.div>
          <h1 className="mt-7 text-3xl font-black sm:text-4xl">تم استلام طلبك بنجاح</h1>
          <p className="mx-auto mt-4 max-w-lg leading-8 text-white/70">
            شكراً لتسجيلك في هاكاثون الروبوتيك والذكاء الصنعي. أهلاً بك في رحلة البناء. ستتواصل معك اللجنة المنظمة عبر وسائل التواصل التي أدخلتها.
          </p>
          <div className="mx-auto mt-9 max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs text-white/55">الرقم المرجعي لطلبك</div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span dir="ltr" className="font-pixel text-2xl tracking-wider text-white sm:text-3xl" data-testid="text-reference-code">{code}</span>
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 hover:bg-white/10"
                aria-label="نسخ الرقم المرجعي" data-testid="button-copy-reference"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 text-xs text-white/45">احتفظ بهذا الرقم للرجوع إليه عند التواصل مع اللجنة.</div>
          </div>
          <Link to="/" className="mt-9 inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-medium hover:bg-white/15" data-testid="link-success-home">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function Wizard({ onDone }: { onDone: (code: string) => void }) {
  const form = useForm<RegForm>({ resolver: zodResolver(regSchema), defaultValues, mode: "onTouched" });
  const { control, setValue, getValues, trigger, formState: { errors } } = form;
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const submit = useSubmitRegistration();

  const affiliation = useWatch({ control, name: "affiliationType" });
  const participation = useWatch({ control, name: "participationType" });
  const steps = useMemo<StepKey[]>(
    () => ["basics", participation === "TEAM" ? "team" : participation === "INDIVIDUAL" ? "prefs" : "path", "idea", "review"],
    [participation],
  );
  const step = steps[stepIdx];

  const chooseAffiliation = (v: "INTERNAL" | "EXTERNAL") => {
    setValue("affiliationType", v, { shouldValidate: true });
    if (v === "EXTERNAL") {
      setValue("participationType", "TEAM", { shouldValidate: true });
      setValue("idea.status", "HAS_IDEA");
      const c = getValues("applicant.courses");
      if (c.length === 0) setValue("applicant.courses", [COURSE_OUTSIDE]);
    } else {
      setValue("externalOrganizationName", "");
      if (getValues("idea.status") === "HAS_IDEA" && !getValues("idea.title")) setValue("idea.status", "");
    }
  };

  const go = async (delta: number) => {
    setServerError(null);
    if (delta > 0) {
      const ok = await trigger(STEP_FIELDS[step] as never);
      if (!ok) {
        setTimeout(() => (document.querySelector('[aria-invalid="true"], [role="alert"]') as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
        return;
      }
    }
    setDir(delta);
    setStepIdx((i) => Math.min(Math.max(i + delta, 0), steps.length - 1));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const jump = (i: number) => {
    if (i >= stepIdx) return;
    setDir(-1);
    setStepIdx(i);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      setServerError(null);
      submit.mutate(
        { data: toPayload(values) },
        {
          onSuccess: (res) => onDone(res.referenceCode),
          onError: (err: unknown) => {
            const e = err as { data?: { error?: string; issues?: { path: (string | number)[]; message: string }[] } | null; status?: number };
            for (const issue of e?.data?.issues ?? []) {
              form.setError(issue.path.join(".") as never, { type: "server", message: issue.message });
            }
            setServerError(e?.data?.error ?? "تعذّر إرسال الطلب حالياً. تحقق من اتصالك وحاول مجدداً.");
          },
        },
      );
    },
    () => setServerError("يوجد حقول غير مكتملة. راجع الخطوات السابقة."),
  );

  const progress = ((stepIdx + 1) / steps.length) * 100;

  return (
    <FormProvider {...form}>
      <div ref={topRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-12">
        {/* Title + stepper */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">طلب تسجيل في الهاكاثون</div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              فكرتك تستحق <span className="text-primary">أن تُبنى.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">املأ الخطوات بالترتيب. بياناتك محفوظة أثناء التنقل بين الخطوات.</p>
          </div>
          <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1" aria-label="خطوات التسجيل">
            {steps.map((s, i) => {
              const state = i < stepIdx ? "done" : i === stepIdx ? "current" : "todo";
              return (
                <li key={s + i} className="flex shrink-0 items-center gap-2">
                  {i > 0 && <span className={cn("h-px w-6 sm:w-10", i <= stepIdx ? "bg-primary" : "bg-border")} />}
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    disabled={state === "todo" || state === "current"}
                    aria-current={state === "current" ? "step" : undefined}
                    data-testid={`step-${s}`}
                    className={cn("flex items-center gap-2 text-sm font-medium", state === "current" ? "text-primary" : state === "done" ? "text-foreground hover:text-primary" : "text-muted-foreground")}
                  >
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full border-2 font-pixel text-xs",
                      state === "current" ? "border-primary bg-accent text-primary" : state === "done" ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn(state !== "current" && "hidden xl:inline")}>{STEP_LABEL[s]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <form onSubmit={(e) => { e.preventDefault(); if (step === "review") onSubmit(); else go(1); }} noValidate className="min-w-0">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir > 0 ? -24 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir > 0 ? 24 : -24 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {step === "basics" && <StepBasics onAffiliation={chooseAffiliation} />}
                {step === "team" && <StepTeam />}
                {step === "prefs" && <StepPrefs />}
                {step === "idea" && <StepIdea />}
                {step === "review" && <StepReview onEdit={(k) => jump(steps.indexOf(k))} />}
              </motion.div>
            </AnimatePresence>

            {serverError && (
              <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" data-testid="text-submit-error">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {serverError}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {stepIdx > 0 ? (
                <button type="button" onClick={() => go(-1)} className="inline-flex h-12 items-center gap-2 rounded-xl border bg-card px-5 text-sm font-medium hover:bg-muted" data-testid="button-prev-step">
                  <ArrowRight className="h-4 w-4" /> السابق
                </button>
              ) : <span />}
              {step === "review" ? (
                <SubmitButton pending={submit.isPending} />
              ) : (
                <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-next-step">
                  التالي <ArrowLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          <SummaryAside />
        </div>
        {Object.keys(errors).length > 0 && <span className="sr-only">يوجد أخطاء في النموذج</span>}
      </div>
    </FormProvider>
  );
}

function SubmitButton({ pending }: { pending: boolean }) {
  const { control } = useFormContextTyped();
  const a = useWatch({ control, name: "termsWorkshopAccepted" });
  const b = useWatch({ control, name: "termsEquipmentAccepted" });
  const disabled = !a || !b || pending;
  return (
    <button type="submit" disabled={disabled} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground transition-all enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-submit-registration">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "جارٍ الإرسال..." : "إرسال الطلب"}
      {!pending && <ArrowLeft className="h-4 w-4" />}
    </button>
  );
}

const useFormContextTyped = () => useFormContext<RegForm>();

/* ---------------- Steps ---------------- */

function StepBasics({ onAffiliation }: { onAffiliation: (v: "INTERNAL" | "EXTERNAL") => void }) {
  const { control, register, setValue, formState: { errors } } = useFormContextTyped();
  const affiliation = useWatch({ control, name: "affiliationType" });
  const participation = useWatch({ control, name: "participationType" });
  const external = affiliation === "EXTERNAL";
  return (
    <>
      <Card>
        <SectionHead n="01" title="الجهة المشاركة" desc="حدد الجهة التي تمثلها في الهاكاثون." icon={<Building2 className="h-5 w-5" />} />
        <div role="radiogroup" className="grid gap-3 md:grid-cols-2">
          <ChoiceCard testId="choice-affiliation-internal" selected={affiliation === "INTERNAL"} onSelect={() => onAffiliation("INTERNAL")} icon={<Users className="h-5 w-5" />}
            title="من طلاب نادي الهمك للذكاء الصنعي والروبوت (أو طلاب جامعة دمشق)" />
          <ChoiceCard testId="choice-affiliation-external" selected={external} onSelect={() => onAffiliation("EXTERNAL")} icon={<Building2 className="h-5 w-5" />}
            title="جهة خارجية مشاركة" desc="فريق خارجي / نادي علمي / حاضنة / جامعة أخرى" />
        </div>
        {errors.affiliationType && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{errors.affiliationType.message}</p>}
        <AnimatePresence initial={false}>
          {external && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-6">
                <Field label="اسم الجهة الخارجية المشاركة" required htmlFor="ext-org" error={errors.externalOrganizationName?.message} hint="مثال: فريق سايبوتس / نادي الروبوتيك في جامعة أخرى / حاضنة...">
                  <TextInput id="ext-org" invalid={!!errors.externalOrganizationName} placeholder="اسم الجهة" data-testid="input-external-org" {...register("externalOrganizationName")} />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card>
        <SectionHead n="02" title={external ? "بيانات قائد الفريق" : "بياناتك الشخصية"} desc="بيانات قائد الفريق أو المشارك المنفرد." icon={<User className="h-5 w-5" />} />
        <ParticipantFields prefix="applicant" idKey="applicant" />
      </Card>

      <Card>
        <SectionHead n="03" title="كيف تود المشاركة في الهاكاثون؟" icon={<HelpCircle className="h-5 w-5" />} />
        {external ? (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-accent/60 p-4 text-sm leading-7" data-testid="text-external-team-locked">
            <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>الجهات الخارجية تسجَّل كفريق مستقل. ستُسجَّل بصفتك <b>قائد الفريق</b>، وتُدخل بيانات الأعضاء في الخطوة التالية.</span>
          </div>
        ) : (
          <div role="radiogroup" className="grid gap-3 md:grid-cols-2">
            <ChoiceCard testId="choice-participation-team" selected={participation === "TEAM"} onSelect={() => setValue("participationType", "TEAM", { shouldValidate: true })}
              icon={<Users className="h-5 w-5" />} title="كقائد فريق" desc="لدي فريق جاهز وأريد تسجيل بيانات أعضائه" disabled={!affiliation} />
            <ChoiceCard testId="choice-participation-individual" selected={participation === "INDIVIDUAL"} onSelect={() => setValue("participationType", "INDIVIDUAL", { shouldValidate: true })}
              icon={<User className="h-5 w-5" />} title="كمشارك منفرد" desc="أرغب بأن تقوم اللجنة بفرزي وضمي لفريق يناسب خبراتي" disabled={!affiliation} />
          </div>
        )}
        {!affiliation && <p className="mt-3 text-xs text-muted-foreground">اختر الجهة المشاركة أولاً.</p>}
        {errors.participationType && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{errors.participationType.message}</p>}
      </Card>
    </>
  );
}

function StepTeam() {
  const { control, register, getValues, formState: { errors } } = useFormContextTyped();
  const external = useWatch({ control, name: "affiliationType" }) === "EXTERNAL";
  const org = useWatch({ control, name: "externalOrganizationName" });
  const total = useWatch({ control, name: "team.totalMembers" });
  const { fields, replace } = useFieldArray({ control, name: "team.members" });
  const needs = useController({ control, name: "team.needs" });
  const totalReg = register("team.totalMembers");

  const resize = (n: number) => {
    const cur = getValues("team.members");
    const next = Array.from({ length: Math.max(0, n - 1) }, (_, i) => cur[i] ?? emptyParticipant(external ? [COURSE_OUTSIDE] : []));
    replace(next);
  };

  return (
    <>
      <Card>
        <SectionHead n="01" title="بيانات الفريق" desc="العدد يشمل القائد." icon={<Users className="h-5 w-5" />} />
        {external && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" data-testid="badge-external-org">
            <Building2 className="h-4 w-4" /> تسجيل فريق تابع لـ: {org}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="اسم الفريق" required htmlFor="team-name" error={errors.team?.name?.message} hint="مثال: RoboTech">
            <TextInput id="team-name" placeholder="RoboTech" invalid={!!errors.team?.name} data-testid="input-team-name" {...register("team.name")} />
          </Field>
          <Field label="عدد أعضاء الفريق" required htmlFor="team-total" error={errors.team?.totalMembers?.message} hint="من 2 إلى 6 أعضاء، يشمل القائد.">
            <SelectInput id="team-total" invalid={!!errors.team?.totalMembers} placeholder="اختر العدد" data-testid="select-team-total"
              options={[2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} أعضاء` }))}
              {...totalReg}
              onChange={(e) => { totalReg.onChange(e); resize(Number(e.target.value)); }} />
          </Field>
        </div>
        {total && (
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
              {Array.from({ length: Number(total) }).map((_, i) => (
                <span key={i} className={cn("h-3 w-3", i === 0 ? "bg-primary" : "bg-foreground/25")} />
              ))}
            </span>
            القائد + {Number(total) - 1} {Number(total) - 1 === 1 ? "عضو إضافي" : "أعضاء إضافيين"}
          </div>
        )}
      </Card>

      <AnimatePresence initial={false}>
        {fields.map((f, i) => (
          <motion.div key={f.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
            <Card>
              <SectionHead n={String(i + 2).padStart(2, "0")} title={`العضو ${i + 2}`} desc={`عضو ${i + 1} من ${fields.length} (غير القائد)`} icon={<UserPlus className="h-5 w-5" />} />
              <ParticipantFields prefix={`team.members.${i}`} idKey={`member-${i}`} />
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Card>
        <SectionHead n="+" title="احتياجات الفريق" desc="هل ينقص فريقكم عضو باختصاص معين ترغبون بضمه إليكم؟" icon={<Cpu className="h-5 w-5" />} />
        <ChipGroup options={NEEDS} value={needs.field.value} onChange={needs.field.onChange} exclusive={NEED_COMPLETE} invalid={!!errors.team?.needs} testIdPrefix="chip-need" />
        {errors.team?.needs && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{errors.team.needs.message}</p>}
      </Card>
    </>
  );
}

function StepPrefs() {
  const { control, register, formState: { errors } } = useFormContextTyped();
  const roles = useController({ control, name: "preferences.roles" });
  return (
    <Card>
      <SectionHead n="01" title="تفضيلات المشارك المنفرد" desc="تساعد اللجنة على ضمك إلى فريق يناسب خبراتك." icon={<User className="h-5 w-5" />} />
      <div className="space-y-7">
        <Field label="ما هو الدور التقني الذي تفضله أو تتقنه داخل الفريق؟" required error={errors.preferences?.roles?.message} hint="يمكن اختيار أكثر من دور.">
          <div className="grid gap-2.5">
            {ROLES.map((r, i) => {
              const on = roles.field.value.includes(r);
              return (
                <button key={r} type="button" role="checkbox" aria-checked={on} data-testid={`checkbox-role-${i}`}
                  onClick={() => roles.field.onChange(on ? roles.field.value.filter((x) => x !== r) : [...roles.field.value, r])}
                  className={cn("flex items-center gap-3 rounded-xl border p-4 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                    on ? "border-primary/60 bg-accent/70" : "bg-card hover:border-foreground/20")}>
                  <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  {r}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="هل يوجد صديق آخر سجل كفرد وترغب بالعمل معه في نفس الفريق؟" htmlFor="friend" hint="اكتب اسمه الثلاثي هنا إن وجد ليتم أخذ ذلك بعين الاعتبار أثناء الفرز.">
          <TextInput id="friend" placeholder="الاسم الثلاثي (اختياري)" data-testid="input-friend-name" {...register("preferences.friendName")} />
        </Field>
      </div>
    </Card>
  );
}

function StepIdea() {
  const { control, register, setValue, formState: { errors } } = useFormContextTyped();
  const external = useWatch({ control, name: "affiliationType" }) === "EXTERNAL";
  const team = useWatch({ control, name: "participationType" }) === "TEAM";
  const status = useWatch({ control, name: "idea.status" });
  const desc = useWatch({ control, name: "idea.description" });
  const projectType = useWatch({ control, name: "idea.projectType" });
  const words = countWords(desc);
  const showFields = external || status === "HAS_IDEA";
  const wordState = words === 0 ? "idle" : words < 50 || words > 300 ? "bad" : "ok";

  return (
    <Card>
      <SectionHead n="01" title="فكرة المشروع" desc={external ? "الفرق الخارجية ملزمة بتقديم فكرة مشروع مكتملة." : undefined} icon={<Lightbulb className="h-5 w-5" />} />

      {!external && (
        <div className="mb-6">
          <div className="mb-3 text-sm font-bold">{team ? "هل لديكم فكرة مشروع مبدئية حالياً؟" : "هل لديك فكرة مشروع مبدئية حالياً؟"} <span className="text-primary">*</span></div>
          <div role="radiogroup" className="grid gap-3 md:grid-cols-2">
            <ChoiceCard testId="choice-idea-yes" selected={status === "HAS_IDEA"} onSelect={() => setValue("idea.status", "HAS_IDEA", { shouldValidate: true })}
              icon={<Lightbulb className="h-5 w-5" />} title={team ? "نعم، لدينا فكرة مبدئية نود طرحها." : "نعم، لدي فكرة مبدئية أود طرحها."} />
            <ChoiceCard testId="choice-idea-no" selected={status === "NEEDS_IDEA"} onSelect={() => setValue("idea.status", "NEEDS_IDEA", { shouldValidate: true })}
              icon={<HelpCircle className="h-5 w-5" />} title="لا توجد فكرة محددة حالياً"
              desc={team ? "وسنعتمد على النادي لمساعدتنا في اختيار أو تطوير فكرة مناسبة." : "وسأعتمد على النادي لمساعدتي في اختيار أو تطوير فكرة مناسبة."} />
          </div>
          {errors.idea?.status && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{errors.idea.status.message}</p>}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showFields && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="space-y-6 border-t pt-6">
              <Field label="عنوان الفكرة المبدئي" required htmlFor="idea-title" error={errors.idea?.title?.message} hint="مثال: نظام فرز النفايات الذكي">
                <TextInput id="idea-title" placeholder="نظام فرز النفايات الذكي" invalid={!!errors.idea?.title} data-testid="input-idea-title" {...register("idea.title")} />
              </Field>
              <Field label="نوع المشروع" required error={errors.idea?.projectType?.message}>
                <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-3">
                  {PROJECT_TYPES.map((p) => (
                    <button key={p.value} type="button" role="radio" aria-checked={projectType === p.value} data-testid={`radio-project-type-${p.value}`}
                      onClick={() => setValue("idea.projectType", p.value, { shouldValidate: true })}
                      className={cn("rounded-xl border p-4 text-start text-sm font-medium leading-6 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                        projectType === p.value ? "border-primary/60 bg-accent/70 text-accent-foreground" : "bg-card hover:border-foreground/20")}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="ملخص الفكرة والمشكلة التي تحلها" required htmlFor="idea-desc" error={errors.idea?.description?.message}>
                <TextArea id="idea-desc" rows={8} invalid={!!errors.idea?.description} data-testid="input-idea-description"
                  placeholder="وضّح المشكلة، والحل المقترح، ودور الذكاء الصنعي أو الروبوتيك في الحل..." {...register("idea.description")} />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">المشكلة · الحل المقترح · دور الذكاء الصنعي أو الروبوتيك</span>
                  <span data-testid="text-word-count" className={cn("rounded-md px-2 py-1 font-medium tabular-nums", wordState === "ok" ? "bg-success/10 text-success" : wordState === "bad" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                    {words} / 50–300 كلمة
                  </span>
                </div>
              </Field>
              <Field label="القطع والتقنيات الأساسية المتوقع استخدامها" required htmlFor="idea-tech" error={errors.idea?.expectedTechnologies?.message} hint="مثال: Raspberry Pi، حساس لون TCS3200، محركات DC، ESP32 وغيرها">
                <TextArea id="idea-tech" rows={3} className="min-h-[96px]" invalid={!!errors.idea?.expectedTechnologies} data-testid="input-idea-tech" {...register("idea.expectedTechnologies")} />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {status === "NEEDS_IDEA" && !external && (
        <div className="flex items-start gap-3 rounded-xl bg-muted/70 p-4 text-sm leading-7" data-testid="text-needs-idea-note">
          <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-primary" />
          لا مشكلة. سيُصنَّف طلبك ضمن «يحتاج إلى فكرة مشروع»، وسيساعدك النادي في اختيار فكرة مناسبة أو تطويرها.
        </div>
      )}
    </Card>
  );
}

function ReviewRow({ k, v, testId }: { k: string; v: ReactNode; testId?: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[170px_1fr]">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium" data-testid={testId}>{v || "—"}</span>
    </div>
  );
}

function StepReview({ onEdit }: { onEdit: (k: StepKey) => void }) {
  const { control, setValue, formState: { errors } } = useFormContextTyped();
  const v = useWatch({ control }) as RegForm;
  const external = v.affiliationType === "EXTERNAL";
  const isTeam = v.participationType === "TEAM";
  const hasIdea = external || v.idea?.status === "HAS_IDEA";
  const EditBtn = ({ k }: { k: StepKey }) => (
    <button type="button" onClick={() => onEdit(k)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-accent" data-testid={`button-edit-${k}`}>
      <Pencil className="h-3.5 w-3.5" /> تعديل
    </button>
  );
  return (
    <>
      <Card>
        <SectionHead n="01" title="مراجعة ملخص الطلب" desc="تأكد من صحة البيانات قبل الإرسال." icon={<FileText className="h-5 w-5" />} />
        <div className="divide-y">
          <div className="pb-3">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">المشاركة</span><EditBtn k="basics" /></div>
            <ReviewRow k="الجهة المشاركة" v={AFFILIATION_LABEL[v.affiliationType]} testId="review-affiliation" />
            {external && <ReviewRow k="اسم الجهة الخارجية" v={v.externalOrganizationName} testId="review-org" />}
            <ReviewRow k="اسم مقدم الطلب" v={v.applicant?.fullNameAr} testId="review-applicant" />
            <ReviewRow k="نوع المشاركة" v={PARTICIPATION_LABEL[v.participationType]} testId="review-participation" />
          </div>
          {isTeam && (
            <div className="py-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">الفريق</span><EditBtn k="team" /></div>
              <ReviewRow k="اسم الفريق" v={v.team?.name} testId="review-team-name" />
              <ReviewRow k="عدد الأعضاء" v={v.team?.totalMembers ? `${v.team.totalMembers} (يشمل القائد)` : ""} testId="review-team-total" />
              <ReviewRow k="ملخص الأعضاء" v={
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2"><span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">قائد</span>{v.applicant?.fullNameAr}</li>
                  {v.team?.members?.map((m, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2"><span className="h-1.5 w-1.5 bg-foreground/40" />{m.fullNameAr || "—"}<span className="text-xs text-muted-foreground">· {m.academicYear}</span></li>
                  ))}
                </ul>
              } />
              <ReviewRow k="احتياجات الفريق" v={v.team?.needs?.join("، ")} />
            </div>
          )}
          {!isTeam && (
            <div className="py-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">التفضيلات</span><EditBtn k="prefs" /></div>
              <ReviewRow k="الأدوار المفضلة" v={v.preferences?.roles?.join("، ")} />
              <ReviewRow k="صديق للعمل معه" v={v.preferences?.friendName} />
            </div>
          )}
          <div className="pt-3">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">الفكرة</span><EditBtn k="idea" /></div>
            <ReviewRow k="حالة الفكرة" v={
              <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs", hasIdea ? "bg-success/10 text-success" : "bg-warning-soft text-warning")}>{hasIdea ? "لديه فكرة" : "يحتاج إلى فكرة"}</span>
            } testId="review-idea-status" />
            {hasIdea && <ReviewRow k="عنوان الفكرة" v={v.idea?.title} testId="review-idea-title" />}
            {hasIdea && <ReviewRow k="نوع المشروع" v={projectTypeLabel(v.idea?.projectType)} />}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHead n="02" title="التعهدات النهائية" desc="لا يتفعل زر الإرسال إلا بعد تحديد التعهدين." icon={<ShieldCheck className="h-5 w-5" />} />
        <div className="space-y-3">
          <CheckRow testId="checkbox-terms-workshop" checked={!!v.termsWorkshopAccepted} invalid={!!errors.termsWorkshopAccepted} onChange={(c) => setValue("termsWorkshopAccepted", c, { shouldValidate: true })}>
            أتعهد بالالتزام بحضور ورشة التفكير التصميمي (Design Thinking) والجلسات التحضيرية لتثبيت الأفكار وتشكيل الفرق.
          </CheckRow>
          <CheckRow testId="checkbox-terms-equipment" checked={!!v.termsEquipmentAccepted} invalid={!!errors.termsEquipmentAccepted} onChange={(c) => setValue("termsEquipmentAccepted", c, { shouldValidate: true })}>
            اطلعت على دليل وقواعد الهاكاثون، وأتعهد بالحفاظ على قطع ومعدات النادي المستعارة وإعادتها سليمة.
          </CheckRow>
        </div>
      </Card>
    </>
  );
}

function SummaryAside() {
  const { control, formState: { errors } } = useFormContextTyped();
  const v = useWatch({ control }) as RegForm;
  const external = v.affiliationType === "EXTERNAL";
  const hasIdea = external || v.idea?.status === "HAS_IDEA";
  const errCount = ["affiliationType", "applicant", "team", "preferences", "idea"].filter((k) => getErr(errors, k) || (errors as Record<string, unknown>)[k]).length;
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <span className="font-extrabold">ملخص الطلب</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> مسودة</span>
        </div>
        <dl className="divide-y text-sm">
          <div className="py-3"><dt className="text-xs text-muted-foreground">مقدم الطلب</dt><dd className="mt-1 font-bold">{v.applicant?.fullNameAr || "سيظهر اسمك هنا"}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-muted-foreground">الجهة</dt><dd className="font-medium">{v.affiliationType ? (external ? "خارجية" : "داخلية") : "—"}</dd></div>
          {external && <div className="flex justify-between gap-3 py-3"><dt className="text-muted-foreground">اسم الجهة</dt><dd className="truncate font-medium">{v.externalOrganizationName || "—"}</dd></div>}
          <div className="flex justify-between py-3"><dt className="text-muted-foreground">المشاركة</dt><dd className="font-medium">{PARTICIPATION_LABEL[v.participationType] ?? "—"}</dd></div>
          {v.participationType === "TEAM" && (
            <div className="flex justify-between py-3"><dt className="text-muted-foreground">الفريق</dt><dd className="font-medium">{v.team?.name || "—"} {v.team?.totalMembers && <span className="font-pixel text-primary">· {v.team.totalMembers}</span>}</dd></div>
          )}
          <div className="flex justify-between py-3"><dt className="text-muted-foreground">الفكرة</dt>
            <dd>{v.idea?.status || external ? <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", hasIdea ? "bg-success/10 text-success" : "bg-warning-soft text-warning")}>{hasIdea ? IDEA_LABEL.HAS_IDEA : "يحتاج إلى فكرة"}</span> : "—"}</dd>
          </div>
        </dl>
        {errCount > 0 && <div className="mt-2 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">توجد حقول تحتاج إلى تصحيح.</div>}
        <div className="mt-3 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" /> بياناتك تُرسل مباشرة إلى اللجنة المنظمة ولا تُعرض للعموم.
        </div>
      </div>
    </aside>
  );
}
