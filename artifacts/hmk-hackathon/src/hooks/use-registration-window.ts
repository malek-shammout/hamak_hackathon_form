import { useGetRegistrationConfig, getGetRegistrationConfigQueryKey, type RegistrationMode } from "@workspace/api-client-react";
import { useCountdown } from "@/components/countdown";
import { DEADLINE_ISO } from "@/lib/constants";

const tz = { timeZone: "Asia/Damascus" } as const;

/** "1 ديسمبر 2026 · 23:59:59 بتوقيت دمشق" */
export function formatDeadline(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const date = new Intl.DateTimeFormat("ar-u-nu-latn", { ...tz, day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(d);
  return `${date} · ${time} بتوقيت دمشق`;
}

/**
 * Public registration window, driven by the organizer settings on the server.
 * The server is authoritative; the local countdown only flips AUTO mode to closed
 * at the exact second without waiting for the next refetch.
 */
export function useRegistrationWindow() {
  const cfg = useGetRegistrationConfig({
    query: { queryKey: getGetRegistrationConfigQueryKey(), refetchInterval: 60_000, refetchOnWindowFocus: true },
  });
  const data = cfg.data;
  // Guard against non-JSON responses (e.g. an HTML page) being treated as a config.
  const valid = !!data && typeof data === "object" && typeof data.open === "boolean";
  const mode: RegistrationMode = valid ? data.mode ?? "AUTO" : "AUTO";
  const deadline = valid && data.deadline ? data.deadline : DEADLINE_ISO;
  const cd = useCountdown(deadline);
  const open = valid ? (mode === "AUTO" ? data.open && !cd.expired : data.open) : false;
  const unavailable = !cfg.isLoading && !valid;
  const deadlineLabel = formatDeadline(deadline);
  const closedMessage = valid ? (data.closedMessage ?? "").trim() : "";

  let status: string;
  if (open) status = "التسجيل مفتوح الآن";
  else if (unavailable) status = "تعذّر التحقق من حالة التسجيل";
  else if (mode === "CLOSED" && !cd.expired) status = "التسجيل مغلق حالياً";
  else status = "انتهى التسجيل";

  const closedText = closedMessage
    || (mode === "CLOSED" && !cd.expired
      ? "تابع قنوات نادي الهمك لمعرفة موعد إعادة الفتح."
      : `أُغلق باب التسجيل في ${deadlineLabel}. شكراً لاهتمامك.`);

  return {
    deadline, deadlineLabel, open, mode, status, closedText, unavailable,
    /** Countdown is meaningful only when the deadline actually controls the form. */
    showCountdown: mode === "AUTO",
    loading: cfg.isLoading,
    retry: () => cfg.refetch(),
  };
}
