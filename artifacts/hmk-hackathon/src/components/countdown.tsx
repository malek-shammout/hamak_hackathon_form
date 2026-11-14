import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function useCountdown(deadlineIso: string) {
  const target = new Date(deadlineIso).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return {
    expired: diff <= 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ deadline, className, compact }: { deadline: string; className?: string; compact?: boolean }) {
  const c = useCountdown(deadline);
  const units = [
    { v: c.days, l: "يوم" },
    { v: c.hours, l: "ساعة" },
    { v: c.minutes, l: "دقيقة" },
    { v: c.seconds, l: "ثانية" },
  ];
  return (
    <div dir="ltr" className={cn("flex items-stretch gap-2 sm:gap-3", className)} data-testid="countdown" role="timer" aria-live="off">
      {units.map((u, i) => (
        <div key={u.l} className="flex items-stretch gap-2 sm:gap-3">
          {i > 0 && <span className="font-pixel self-center text-xl text-primary blink sm:text-2xl">:</span>}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]",
              compact ? "min-w-[3.6rem] px-2 py-2" : "min-w-[4.2rem] px-3 py-3 sm:min-w-[5.4rem] sm:py-4",
            )}
          >
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/10" />
            <span
              className={cn("font-pixel tabular-nums leading-none text-white", compact ? "text-2xl" : "text-3xl sm:text-5xl")}
              data-testid={`countdown-${["days", "hours", "minutes", "seconds"][i]}`}
            >
              {pad(u.v)}
            </span>
            <span dir="rtl" className="mt-2 text-[11px] font-medium text-white/55 sm:text-xs">
              {u.l}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
