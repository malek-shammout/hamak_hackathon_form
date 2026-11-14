import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label, required, hint, error, children, htmlFor, className,
}: { label: ReactNode; required?: boolean; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-card px-4 text-[15px] transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-destructive";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...p }, ref) => <input ref={ref} aria-invalid={invalid} className={cn(inputCls, "h-12", className)} {...p} />,
);
TextInput.displayName = "TextInput";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...p }, ref) => <textarea ref={ref} aria-invalid={invalid} className={cn(inputCls, "min-h-[140px] py-3 leading-7", className)} {...p} />,
);
TextArea.displayName = "TextArea";

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; placeholder?: string; options: { value: string; label: string }[] }>(
  ({ className, invalid, placeholder, options, ...p }, ref) => (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid} className={cn(inputCls, "h-12 appearance-none pl-10", className)} {...p}>
        <option value="" disabled>{placeholder ?? "اختر..."}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
);
SelectInput.displayName = "SelectInput";

export function ChoiceCard({
  selected, onSelect, icon, title, desc, testId, disabled,
}: { selected: boolean; onSelect: () => void; icon: ReactNode; title: ReactNode; desc?: ReactNode; testId: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      data-testid={testId}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border p-4 text-start transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:p-5",
        selected ? "border-primary/60 bg-accent/70" : "border-border bg-card hover:border-foreground/20",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-7">{title}</span>
        {desc && <span className="mt-1 block text-sm leading-6 text-muted-foreground">{desc}</span>}
      </span>
      <span className={cn("mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Multi-select chips with an optional exclusive value. */
export function ChipGroup({
  options, value, onChange, exclusive, invalid, testIdPrefix,
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; exclusive?: string; invalid?: boolean; testIdPrefix: string }) {
  const toggle = (o: string) => {
    if (value.includes(o)) return onChange(value.filter((x) => x !== o));
    if (exclusive && o === exclusive) return onChange([o]);
    return onChange([...value.filter((x) => x !== exclusive), o]);
  };
  return (
    <div role="group" className={cn("flex flex-wrap gap-2 rounded-xl", invalid && "ring-1 ring-destructive/50 ring-offset-4 ring-offset-background")}>
      {options.map((o, i) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(o)}
            data-testid={`${testIdPrefix}-${i}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/25",
              o === exclusive && !on && "border-dashed",
            )}
          >
            <span className={cn("grid h-4 w-4 place-items-center rounded-[4px] border", on ? "border-primary-foreground/60 bg-primary-foreground/15" : "border-input")}>
              {on && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function CheckRow({ checked, onChange, children, testId, invalid }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; testId: string; invalid?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors", checked ? "border-primary/50 bg-accent/60" : invalid ? "border-destructive/50 bg-warning-soft" : "bg-warning-soft border-warning/30")}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid={testId} />
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20", checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="text-sm leading-7">{children}</span>
    </label>
  );
}
