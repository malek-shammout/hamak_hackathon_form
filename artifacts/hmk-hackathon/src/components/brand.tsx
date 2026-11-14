import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Theme ---------------- */
type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("hmk-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("hmk-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

export function ThemeToggle({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="button-theme-toggle"
      aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
      className={cn(
        "relative inline-flex h-10 w-[4.5rem] shrink-0 items-center rounded-full border p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onDark ? "border-white/15 bg-white/5" : "border-border bg-card",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-8 w-8 rounded-full bg-primary shadow-sm transition-transform duration-300",
          isDark ? "-translate-x-8 right-1" : "translate-x-0 right-1",
        )}
      />
      <span className="relative z-10 grid h-8 w-8 place-items-center">
        <Sun className={cn("h-4 w-4", isDark ? "text-muted-foreground" : "text-primary-foreground")} />
      </span>
      <span className="relative z-10 grid h-8 w-8 place-items-center">
        <Moon className={cn("h-4 w-4", isDark ? "text-primary-foreground" : "text-muted-foreground")} />
      </span>
    </button>
  );
}

/* ---------------- Logos ---------------- */
const BASE = import.meta.env.BASE_URL;
export const LOGOS = {
  clubLight: `${BASE}brand/RED LOGO.png`,
  clubDark: `${BASE}brand/WHITE LOGO.png`,
  hackLight: `${BASE}brand/Red Hackathon logovisual.png`,
  hackDark: `${BASE}brand/Hackathon logovisual.png`,
};

/** surface: which background the logo sits on. "auto" follows the theme. */
export function ClubLogo({ surface = "auto", className }: { surface?: "auto" | "dark" | "light"; className?: string }) {
  const { theme } = useTheme();
  const dark = surface === "dark" || (surface === "auto" && theme === "dark");
  return (
    <img
      src={dark ? LOGOS.clubDark : LOGOS.clubLight}
      alt="شعار نادي الهمك للذكاء الصنعي والروبوت"
      className={cn("h-auto object-contain select-none", className)}
      draggable={false}
      data-testid="img-club-logo"
    />
  );
}

export function HackLogo({ surface = "auto", className }: { surface?: "auto" | "dark" | "light"; className?: string }) {
  const { theme } = useTheme();
  const dark = surface === "dark" || (surface === "auto" && theme === "dark");
  return (
    <img
      src={dark ? LOGOS.hackDark : LOGOS.hackLight}
      alt="شعار هاكاثون الهمك"
      className={cn("h-auto object-contain select-none", className)}
      draggable={false}
      data-testid="img-hack-logo"
    />
  );
}

/* ---------------- Meta ---------------- */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", description);
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    }
  }, [title, description]);
}

/* ---------------- Small UI atoms ---------------- */
export function PixelBlocks({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-grid grid-cols-2 gap-[3px]", className)}>
      <span className="h-1.5 w-1.5 bg-primary" />
      <span className="h-1.5 w-1.5 bg-primary/40" />
      <span className="h-1.5 w-1.5 bg-primary/40" />
      <span className="h-1.5 w-1.5 bg-primary" />
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm font-medium text-muted-foreground", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </div>
  );
}
