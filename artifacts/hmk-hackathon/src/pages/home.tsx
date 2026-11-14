import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, User, Building2, Cpu, BrainCircuit, Bot, Lock, Sparkles, Trophy } from "lucide-react";
import { useGetRegistrationConfig } from "@workspace/api-client-react";
import { ClubLogo, HackLogo, Eyebrow, PixelBlocks, usePageMeta } from "@/components/brand";
import { Countdown, useCountdown } from "@/components/countdown";
import { GuideTabs } from "@/components/guide";
import { PublicHeader, PublicFooter, GuideDialogButton } from "@/components/public-chrome";
import { DEADLINE_ISO, GUIDE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function useRegistrationWindow() {
  const cfg = useGetRegistrationConfig();
  const deadline = cfg.data?.deadline ?? DEADLINE_ISO;
  const cd = useCountdown(deadline);
  const open = !cd.expired && (cfg.data ? cfg.data.open : true);
  return { deadline, open, loading: cfg.isLoading };
}

function RegisterCta({ open, className }: { open: boolean; className?: string }) {
  if (!open)
    return (
      <span
        aria-disabled
        data-testid="status-registration-closed"
        className={cn("inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-white/10 px-6 text-sm font-bold text-white/60", className)}
      >
        <Lock className="h-4 w-4" /> انتهى التسجيل
      </span>
    );
  return (
    <Link
      to="/register"
      data-testid="link-start-registration"
      className={cn(
        "group inline-flex h-12 items-center gap-3 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/.7)] transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      ابدأ التسجيل
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

const TICKER = ["ROBOTICS", "AI", "HARDWARE", "COMPUTER VISION", "IOT", "3D DESIGN", "PCB", "TINYML", "BUILD IT"];

export default function Home() {
  usePageMeta(
    "هاكاثون الروبوتيك والذكاء الصنعي | نادي الهمك · جامعة دمشق",
    "ابنِ مشروعك. اختر مجالك. نافس على الأفضل. المنصة الرسمية للتعريف والتسجيل في هاكاثون نادي الهمك للذكاء الصنعي والروبوت.",
  );
  const { deadline, open } = useRegistrationWindow();

  return (
    <div className="grain min-h-[100dvh] bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-ink text-ink-foreground">
          <div className="pixel-grid absolute inset-0" />
          <div className="pointer-events-none absolute -bottom-40 left-[12%] h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]" />
          <div className="pointer-events-none absolute left-[22%] top-[18%] h-[340px] w-[340px] rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute left-[14%] top-[8%] h-[520px] w-[520px] rounded-full border border-white/[0.04]" />

          <div className="relative grid gap-12 px-6 py-14 sm:px-10 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:px-16 lg:py-24">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/75">
                <span className={cn("h-2 w-2 rounded-full", open ? "bg-emerald-400" : "bg-white/40")} />
                {open ? "التسجيل مفتوح الآن" : "انتهى التسجيل"} · نادي الهمك · جامعة دمشق
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7 font-kufi text-[2.6rem] font-black leading-[1.25] tracking-tight sm:text-6xl lg:text-[4.4rem]"
                data-testid="text-hero-title"
              >
                ابنِ مشروعك.
                <br />
                اختر مجالك.
                <br />
                نافس على <span className="text-primary">الأفضل.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-7 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
                هاكاثون الروبوتيك والذكاء الصنعي: منافسة طلابية يبني فيها المشاركون مشاريعهم في أي مجال، بشرط أن يكون فيها روبوتيك أو ذكاء صنعي، وأن تكون الفكرة أصلية، وأن يعمل المشروع فعلاً.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="mt-9 flex flex-wrap items-center gap-3">
                <RegisterCta open={open} />
                <GuideDialogButton variant="solid" />
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}
              className="flex flex-col items-center justify-center gap-10 lg:items-end">
              <div className="relative w-full max-w-md">
                <span className="absolute -top-3 right-10 h-1 w-10 bg-primary" />
                <span className="absolute -bottom-3 left-10 h-1 w-10 bg-primary" />
                <span className="absolute -left-6 top-6 font-pixel text-primary/70">+</span>
                <span className="absolute -right-5 bottom-10 h-2 w-2 rounded-full bg-primary" />
                <div className="floaty rounded-3xl border border-white/10 bg-white/[0.035] p-8 backdrop-blur-sm sm:p-10">
                  <HackLogo surface="dark" className="mx-auto w-full" />
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                    <ClubLogo surface="dark" className="h-12 w-auto" />
                    <span dir="ltr" className="font-pixel text-[11px] leading-5 text-white/50 text-left">DAMASCUS<br />UNIVERSITY · 2026</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md">
                <div className="mb-3 flex items-center justify-between text-xs text-white/60">
                  <span className="font-bold text-white/85">{open ? "ينتهي التسجيل خلال" : "انتهى التسجيل"}</span>
                  <span>1 ديسمبر 2026 · 23:59:59 بتوقيت دمشق</span>
                </div>
                <Countdown deadline={deadline} className="justify-between" />
              </div>
            </motion.div>
          </div>

          {/* ticker */}
          <div className="relative overflow-hidden border-t border-white/10 py-4" dir="ltr">
            <motion.div className="flex w-max gap-10 whitespace-nowrap font-pixel text-sm text-white/35"
              animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, ease: "linear", repeat: Infinity }}>
              {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center gap-10">{t}<span className="h-1.5 w-1.5 bg-primary" /></span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN BUILD */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Eyebrow>المجال حرّ</Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-snug sm:text-5xl">
              لا قائمة تحديات.
              <br />
              <span className="text-primary">فكرتك</span> هي التحدي.
            </h2>
          </div>
          <p className="text-lg leading-9 text-muted-foreground">{GUIDE.openField}</p>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {[
            { i: Bot, ...GUIDE.projectTypes[0], span: "md:col-span-3", tone: "card" },
            { i: BrainCircuit, ...GUIDE.projectTypes[1], span: "md:col-span-3", tone: "card" },
            { i: Cpu, ...GUIDE.projectTypes[2], span: "md:col-span-6", tone: "accent" },
          ].map((p, idx) => (
            <motion.div key={p.t} {...reveal} transition={{ ...reveal.transition, delay: idx * 0.08 }}
              className={cn("group relative overflow-hidden rounded-2xl border p-7 sm:p-9", p.span, p.tone === "accent" ? "bg-accent/70 border-primary/25" : "bg-card")}>
              <div className="flex items-start justify-between gap-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <p.i className="h-6 w-6" />
                </div>
                <span className="font-pixel text-5xl text-foreground/[0.07] transition-colors group-hover:text-primary/20">0{idx + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold">{p.t}</h3>
              <p className="mt-2 max-w-xl leading-8 text-muted-foreground">{p.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.p {...reveal} className="mt-6 text-sm leading-7 text-muted-foreground">
          <span className="font-bold text-foreground">أمثلة للإلهام فقط: </span>{GUIDE.inspiration}
        </motion.p>
      </section>

      {/* STAGES */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>ثلاث مراحل</Eyebrow>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl">من الفكرة إلى العرض الحي</h2>
            </div>
            <p className="max-w-md leading-8 text-muted-foreground">النتيجة النهائية = مجموع درجة كل مرحلة مضروبة بوزنها.</p>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-[1fr_2fr_2fr]">
            {GUIDE.stages.map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="relative bg-background p-7 sm:p-8">
                <div className="flex items-baseline justify-between">
                  <span className="font-pixel text-6xl leading-none text-primary">{s.n}</span>
                  <span className="font-pixel text-2xl text-foreground/70">{s.w}%</span>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold">{s.t}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{s.what}</p>
                <div className="mt-5 border-t pt-4 text-sm">
                  <span className="text-muted-foreground">التسليم: </span>
                  <span className="font-medium">{s.deliver}</span>
                </div>
                <div className="absolute bottom-0 right-0 h-1 bg-primary" style={{ width: `${s.w * 2.5}%` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDE */}
      <section id="guide" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
        <motion.div {...reveal} className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>دليل المشاركة والقواعد · الإصدار 1.0</Eyebrow>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">الهاكثون في سطور</h2>
          </div>
          <PixelBlocks className="scale-150" />
        </motion.div>
        <motion.div {...reveal}><GuideTabs /></motion.div>
      </section>

      {/* PATHS */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <motion.div {...reveal}>
          <Eyebrow>ثلاثة مسارات للتسجيل</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-3xl font-black leading-snug sm:text-5xl">اختر الطريقة التي تناسبك، والنموذج يتكيّف معك.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <motion.div {...reveal} className="rounded-2xl border bg-card p-7 lg:col-span-5 lg:row-span-2 sm:p-9">
            <Users className="h-7 w-7 text-primary" />
            <h3 className="mt-6 text-2xl font-extrabold">قائد فريق</h3>
            <p className="mt-3 leading-8 text-muted-foreground">لديك فريق جاهز من 2 إلى 6 أعضاء من طلاب النادي أو جامعة دمشق. تسجّل بياناتك وبيانات أعضائك، وتحدد ما ينقص فريقكم من اختصاصات.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["بيانات القائد والأعضاء", "احتياجات الفريق", "فكرة مبدئية أو طلب مساعدة"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-primary" />{t}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal} className="rounded-2xl border bg-card p-7 lg:col-span-7 sm:p-9">
            <div className="flex items-start gap-5">
              <User className="h-7 w-7 shrink-0 text-primary" />
              <div>
                <h3 className="text-2xl font-extrabold">مشارك منفرد</h3>
                <p className="mt-3 leading-8 text-muted-foreground">لا فريق لديك بعد؟ سجّل كفرد وحدد دورك التقني المفضل، وتنظّم اللجنة جلسة لتشكيل فرق متوازنة.</p>
              </div>
            </div>
          </motion.div>
          <motion.div {...reveal} className="relative overflow-hidden rounded-2xl bg-ink p-7 text-ink-foreground lg:col-span-7 sm:p-9">
            <div className="pixel-grid absolute inset-0" />
            <div className="relative flex items-start gap-5">
              <Building2 className="h-7 w-7 shrink-0 text-primary" />
              <div>
                <h3 className="text-2xl font-extrabold">جهة خارجية</h3>
                <p className="mt-3 leading-8 text-white/65">فريق خارجي، نادٍ علمي، حاضنة أو جامعة أخرى: تسجّل كفريق مستقل بقائد وأعضاء، مع فكرة مشروع مكتملة إلزامياً.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRIZES */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div {...reveal}>
            <Trophy className="h-8 w-8 text-primary" />
            <h2 className="mt-5 text-3xl font-black sm:text-4xl">جوائز وامتيازات</h2>
            <p className="mt-4 leading-8 text-muted-foreground">{GUIDE.prizesNote}</p>
          </motion.div>
          <motion.div {...reveal} className="flex flex-wrap content-start gap-2.5">
            {GUIDE.specialPrizes.map((p) => (
              <span key={p} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-3 py-16 sm:px-5">
        <motion.div {...reveal} className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-ink px-6 py-16 text-center text-ink-foreground sm:py-20">
          <div className="pixel-grid absolute inset-0" />
          <div className="pointer-events-none absolute left-1/2 top-full h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[120px]" />
          <div className="relative">
            <h2 className="font-kufi text-4xl font-black sm:text-6xl">
              أفكارك تبدأ <span className="text-primary">من هنا.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg leading-8 text-white/65">التسجيل يأخذ دقائق. جهّز بيانات فريقك، وفكرتك إن وجدت.</p>
            <div className="mt-9 flex justify-center"><Countdown deadline={deadline} compact /></div>
            <div className="mt-9 flex justify-center"><RegisterCta open={open} /></div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}
