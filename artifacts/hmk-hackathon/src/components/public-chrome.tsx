import { Link } from "react-router-dom";
import { BookOpen, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ClubLogo, HackLogo, ThemeToggle } from "@/components/brand";
import { GuideTabs } from "@/components/guide";

export function GuideDialogButton({ variant = "ghost" }: { variant?: "ghost" | "solid" }) {
  return (
    <Dialog>
      <DialogTrigger variant={variant} />
      <DialogContent dir="rtl" className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto rounded-2xl p-5 sm:p-8 [&>button.absolute]:hidden">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="text-2xl font-extrabold">الهاكثون في سطور</DialogTitle>
            <DialogDescription className="mt-1">ملخص دليل المشاركة والقواعد · الإصدار 1.0</DialogDescription>
          </div>
          <DialogClose className="grid h-9 w-9 place-items-center rounded-lg border hover:bg-muted" aria-label="إغلاق" data-testid="button-close-guide">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>
        <GuideTabs />
      </DialogContent>
    </Dialog>
  );
}

import { DialogTrigger as RadixTrigger } from "@/components/ui/dialog";
function DialogTrigger({ variant }: { variant: "ghost" | "solid" }) {
  return (
    <RadixTrigger
      data-testid="button-open-guide"
      className={
        variant === "solid"
          ? "inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          : "inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-3.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
      }
    >
      <BookOpen className="h-4 w-4" />
      <span>دليل الهاكاثون</span>
    </RadixTrigger>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" data-testid="link-home">
          <ClubLogo className="h-9 w-auto sm:h-10" />
          <span className="h-8 w-px bg-border" />
          <HackLogo className="h-7 w-auto sm:h-8" />
          <span className="hidden min-w-0 flex-col leading-tight md:flex">
            <span className="truncate text-sm font-bold">هاكاثون الروبوتيك والذكاء الصنعي</span>
            <span className="truncate text-xs text-muted-foreground">نادي الهمك · جامعة دمشق</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><GuideDialogButton /></div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-6">
          <ClubLogo className="h-14 w-auto" />
          <HackLogo className="h-11 w-auto" />
          <div className="max-w-sm text-sm leading-7 text-muted-foreground">
            <div className="font-bold text-foreground">نادي الهمك للذكاء الصنعي والروبوت</div>
            جامعة دمشق · هاكاثون الروبوتيك والذكاء الصنعي 2026
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 text-sm md:items-end">
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg px-3 py-2 hover:bg-muted" data-testid="link-footer-home">الرئيسية</Link>
            <Link to="/register" className="rounded-lg px-3 py-2 hover:bg-muted" data-testid="link-footer-register">التسجيل</Link>
          </div>
          <span dir="ltr" className="font-pixel text-xs text-muted-foreground">HMK AI AND ROBOTICS CLUB</span>
        </div>
      </div>
    </footer>
  );
}
