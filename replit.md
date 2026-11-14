# [Project name]

منصة التسجيل الرسمية العربية لهاكاثون الروبوتيك والذكاء الصنعي في نادي الهمك بجامعة دمشق.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/hmk-hackathon` — الصفحة العامة، التسجيل، `/admin-hmk`، والثيم RTL.
- `artifacts/api-server` — API، تسجيل الدخول، التحقق، وخدمات الطلبات والتصدير.
- `lib/db/src/schema` — مصدر مخطط PostgreSQL. ملفات SQL المولدة في `lib/db/drizzle`.
- `lib/api-spec/openapi.yaml` — مصدر عقد REST؛ أعد توليد العملاء بعد تعديله.
- `README.md` و`docs/database.md` — التشغيل والنشر والتوثيق ومخطط ERD.
- صور الشعارات والخط المحلي في `artifacts/hmk-hackathon/public/brand`.

## Architecture decisions

- تُحفظ بيانات الطلب وعلاقاته في PostgreSQL؛ لا تُحفظ بيانات المشاركين في حقول JSON.
- حفظ الطلب وقراءة تفاصيله في معاملات متسقة؛ كل البيانات التابعة تُحذف مع الطلب.
- واجهات الإدارة والخادم منفصلة عن صفحات التسجيل العامة ومحمية بجلسة وCSRF.
- نصوص الدليل تُعرض مع الفصل بين قواعده الأقدم وشروط التسجيل الأحدث.

## Product

تعريف الهاكاثون، عرض دليل المشاركة، عدّ تنازلي لإغلاق التسجيل في دمشق، تسجيل فرق وأفراد بخطوات مشروطة، وواجهة خاصة بالمنظمين للاستعراض والبحث والتصدير والحذف الكامل.

## User preferences

- مسار الإدارة `/admin-hmk` دون رابط عام إليه؛ وظائفها المسموحة هي القراءة والفلترة والتصدير وحذف الطلب كاملاً فقط.
- لا تنشئ حالات قبول أو رفض، ملاحظات إدارية، تعديل بيانات أو توزيع أفراد على الفرق.
- مواصفات التسجيل الأحدث تتقدم على تعارضات دليل أكتوبر 2026.

## Gotchas

- يجب ضبط `ADMIN_PASSWORD` و`SESSION_SECRET` في Secrets؛ لا توجد كلمات مرور افتراضية.
- كل تغيير في `lib/api-spec/openapi.yaml` يتبعه `pnpm --filter @workspace/api-spec run codegen`.
- `pnpm --filter @workspace/db run push` للتطوير فقط؛ Publish يدير فرق مخطط قاعدة الإنتاج.
- لا تشغّل DDL عند بدء الخادم أو في بناء الإنتاج.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
