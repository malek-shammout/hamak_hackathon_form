import { useController, useFormContext, useWatch } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Field, TextInput, SelectInput, ChipGroup } from "@/components/form-bits";
import { COLLEGES, COLLEGE_OTHER, COURSES, COURSE_NONE, COURSE_OTHER, YEARS } from "@/lib/constants";
import type { RegForm } from "@/lib/registration-schema";

type Prefix = "applicant" | `team.members.${number}`;

function getErr(errors: unknown, path: string): string | undefined {
  const v = path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), errors);
  return v && typeof v === "object" && "message" in v ? String((v as { message?: string }).message ?? "") || undefined : undefined;
}

export function ParticipantFields({ prefix, idKey }: { prefix: Prefix; idKey: string }) {
  const { register, control, formState: { errors } } = useFormContext<RegForm>();
  const college = useWatch({ control, name: `${prefix}.college` as "applicant.college" });
  const courses = useController({ control, name: `${prefix}.courses` as "applicant.courses" });
  const e = (f: string) => getErr(errors, `${prefix}.${f}`);
  const id = (f: string) => `${idKey}-${f}`;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="الاسم الثلاثي بالعربية" required htmlFor={id("ar")} error={e("fullNameAr")} hint="مثال: أحمد محمد علي">
        <TextInput id={id("ar")} placeholder="أحمد محمد علي" invalid={!!e("fullNameAr")} data-testid={`input-${idKey}-name-ar`} {...register(`${prefix}.fullNameAr` as "applicant.fullNameAr")} />
      </Field>
      <Field label="الاسم الثلاثي باللغة الإنكليزية" required htmlFor={id("en")} error={e("fullNameEn")} hint="Example: Ahmad Mohammad Ali">
        <TextInput id={id("en")} dir="ltr" className="text-left" placeholder="Ahmad Mohammad Ali" invalid={!!e("fullNameEn")} data-testid={`input-${idKey}-name-en`} {...register(`${prefix}.fullNameEn` as "applicant.fullNameEn")} />
      </Field>
      <Field label="الكلية والقسم / الاختصاص" required htmlFor={id("college")} error={e("college")} className="sm:col-span-2">
        <SelectInput id={id("college")} invalid={!!e("college")} placeholder="اختر الكلية والاختصاص" options={COLLEGES.map((c) => ({ value: c, label: c }))} data-testid={`select-${idKey}-college`} {...register(`${prefix}.college` as "applicant.college")} />
      </Field>
      <AnimatePresence initial={false}>
        {college === COLLEGE_OTHER && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden sm:col-span-2">
            <Field label="اسم الجامعة أو الكلية والاختصاص" required htmlFor={id("cother")} error={e("collegeOther")}>
              <TextInput id={id("cother")} placeholder="مثال: جامعة حلب - هندسة الميكاترونيكس" invalid={!!e("collegeOther")} data-testid={`input-${idKey}-college-other`} {...register(`${prefix}.collegeOther` as "applicant.collegeOther")} />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
      <Field label="السنة الدراسية" required htmlFor={id("year")} error={e("academicYear")}>
        <SelectInput id={id("year")} invalid={!!e("academicYear")} placeholder="اختر السنة" options={YEARS.map((c) => ({ value: c, label: c }))} data-testid={`select-${idKey}-year`} {...register(`${prefix}.academicYear` as "applicant.academicYear")} />
      </Field>
      <Field label="رقم الجوال (واتساب)" required htmlFor={id("phone")} error={e("phone")} hint="10 أرقام تبدأ بـ 09، مثال: 0933123456">
        <TextInput id={id("phone")} dir="ltr" className="text-left tabular-nums" inputMode="numeric" maxLength={10} placeholder="09XXXXXXXX" invalid={!!e("phone")} data-testid={`input-${idKey}-phone`} {...register(`${prefix}.phone` as "applicant.phone")} />
      </Field>
      <Field label="معرف Telegram" required htmlFor={id("tg")} error={e("telegramUsername")} hint="يبدأ بـ @، مثال: @Ahmad_Ali" className="sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]">
        <TextInput id={id("tg")} dir="ltr" className="text-left" placeholder="@username" invalid={!!e("telegramUsername")} data-testid={`input-${idKey}-telegram`} {...register(`${prefix}.telegramUsername` as "applicant.telegramUsername")} />
      </Field>
      <Field label="الدورات التدريبية السابقة في النادي" required error={e("courses")} hint="يمكن اختيار أكثر من دورة. «لم أحضر سابقاً» لا يجتمع مع غيره." className="sm:col-span-2">
        <ChipGroup options={COURSES} value={courses.field.value} onChange={courses.field.onChange} exclusive={COURSE_NONE} invalid={!!e("courses")} testIdPrefix={`chip-${idKey}-course`} />
      </Field>
      <AnimatePresence initial={false}>
        {courses.field.value.includes(COURSE_OTHER) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden sm:col-span-2">
            <Field label="اسم الدورة الأخرى" required htmlFor={id("course-other")} error={e("courseOther")}>
              <TextInput id={id("course-other")} placeholder="اكتب اسم الدورة" invalid={!!e("courseOther")} data-testid={`input-${idKey}-course-other`} {...register(`${prefix}.courseOther` as "applicant.courseOther")} />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { getErr };
