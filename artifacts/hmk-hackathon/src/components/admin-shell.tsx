import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, LogOut, ShieldCheck, Download, FileSpreadsheet, LayoutGrid, ListChecks, UserRound, AlertTriangle, RotateCw } from "lucide-react";
import { ClubLogo, HackLogo, ThemeToggle, usePageMeta } from "@/components/brand";
import { Field } from "@/components/form-bits";
import { useAdminSession, useLogin, useLogout, apiErrorMessage } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export function AdminGate({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  if (session.isLoading)
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="w-72 space-y-3">
          <div className="h-3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  if (session.isError)
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 font-bold">تعذّر التحقق من الجلسة</p>
          <button onClick={() => session.refetch()} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground" data-testid="button-retry-session">
            <RotateCw className="h-4 w-4" /> إعادة المحاولة
          </button>
        </div>
      </div>
    );
  if (!session.data?.authenticated) return <AdminLogin />;
  return <>{children}</>;
}

const loginSchema = z.object({ password: z.string().min(1, "كلمة المرور مطلوبة") });

function AdminLogin() {
  usePageMeta("دخول المنظمين | هاكاثون الهمك", "منطقة خاصة بمنظمي هاكاثون الهمك.");
  const login = useLogin();
  const [show, setShow] = useState(false);
  const form = useForm<{ password: string }>({ resolver: zodResolver(loginSchema), defaultValues: { password: "" } });
  const onSubmit = form.handleSubmit((d) => login.mutate({ data: d }, { onError: () => form.resetField("password") }));
  const err = form.formState.errors.password?.message;

  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-2">
      {/* brand panel (first in RTL = right) */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pixel-grid absolute inset-0" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[110px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClubLogo surface="dark" className="h-11 w-auto" />
            <div className="leading-tight">
              <div className="font-bold">الهمك</div>
              <div className="text-xs text-white/55">للذكاء الصنعي والروبوتيك</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> مساحة المنظمين
          </span>
        </div>
        <div className="relative">
          <HackLogo surface="dark" className="mb-10 w-72" />
          <h2 className="font-kufi text-6xl font-black leading-[1.3]">
            كل طلب
            <br />
            فكرة <span className="text-primary">تنتظر.</span>
          </h2>
          <p className="mt-6 max-w-sm leading-8 text-white/60">استعرض التسجيلات، افرز بيانات الأفراد، وصدّر المعلومات بأمان.</p>
        </div>
        <div className="relative text-xs text-white/40">جامعة دمشق · 2026</div>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:invisible">
            <ClubLogo className="h-9 w-auto" />
          </div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> أهلاً بعودتك</div>
            <h1 className="mt-3 text-4xl font-black">سجّل دخولك</h1>
            <p className="mt-2 text-sm text-muted-foreground">أدخل كلمة مرور المنظمين للوصول إلى لوحة التحكم.</p>

            <form onSubmit={onSubmit} className="mt-9 space-y-6" noValidate>
              <Field label="كلمة المرور" htmlFor="admin-pw" error={err}>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="admin-pw" type={show ? "text" : "password"} autoComplete="current-password" dir="ltr" placeholder="••••••••"
                    aria-invalid={!!err}
                    className="h-12 w-full rounded-xl border border-input bg-card pl-12 pr-11 text-left focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    data-testid="input-admin-password" {...form.register("password")}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={show ? "إخفاء" : "إظهار"} data-testid="button-toggle-password">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              {login.isError && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" data-testid="text-login-error">
                  <AlertTriangle className="h-4 w-4" /> {apiErrorMessage(login.error, "كلمة المرور غير صحيحة.")}
                </div>
              )}
              <button type="submit" disabled={login.isPending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60" data-testid="button-admin-login">
                {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                تسجيل الدخول
                {!login.isPending && <ArrowLeft className="h-4 w-4" />}
              </button>
            </form>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> جلسة آمنة · الوصول للمنظمين فقط
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/admin-hmk", label: "نظرة عامة", icon: LayoutGrid, end: true },
  { to: "/admin-hmk/registrations", label: "التسجيلات", icon: ListChecks, end: false },
  { to: "/admin-hmk/individuals", label: "المشاركون المنفردون", icon: UserRound, end: false },
];

export function AdminLayout({ children, title, crumb }: { children: ReactNode; title: string; crumb?: ReactNode }) {
  const logout = useLogout();
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/admin-hmk" className="flex items-center gap-3" data-testid="link-admin-home">
            <ClubLogo className="h-9 w-auto" />
            <span className="hidden h-7 w-px bg-border sm:block" />
            <HackLogo className="hidden h-7 w-auto sm:block" />
            <span className="rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-accent-foreground">لوحة المنظمين</span>
          </Link>
          <div className="flex items-center gap-2">
            <ExportMenu />
            <ThemeToggle />
            <button onClick={() => logout.mutate()} disabled={logout.isPending} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm hover:border-primary/40 hover:text-primary" data-testid="button-admin-logout">
              {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 sm:px-6 no-scrollbar">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`link-admin-${n.to.split("/")[2] ?? "overview"}`}
              className={({ isActive }) => cn("relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {({ isActive }) => (
                <>
                  <n.icon className="h-4 w-4" /> {n.label}
                  {isActive && <motion.span layoutId="admin-nav" className="absolute inset-x-2 -bottom-px h-0.5 bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        {crumb && <div className="mb-2 text-sm text-muted-foreground">{crumb}</div>}
        <h1 className="mb-7 text-2xl font-black sm:text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

function ExportMenu() {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
      <a href="/api/admin/export/xlsx" download className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium hover:bg-muted" data-testid="link-export-xlsx">
        <FileSpreadsheet className="h-4 w-4 text-success" /> <span className="hidden md:inline">Excel</span>
      </a>
      <a href="/api/admin/export/csv" download className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium hover:bg-muted" data-testid="link-export-csv">
        <Download className="h-4 w-4" /> <span className="hidden md:inline">CSV</span>
      </a>
    </div>
  );
}
