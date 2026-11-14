# دليل نشر منصة هاكاثون الهمك على GitHub وVercel وNeon

هذا المشروع مجهّز ليعمل بهذه المعمارية:

- **Frontend:** React + Vite، تُبنى ملفاتها إلى `public/` وتُقدّم عبر Vercel CDN.
- **Backend:** Express، يعمل كـ Vercel Function من خلال `server.ts` في جذر المستودع.
- **Database:** PostgreSQL على Neon. يستخدم التطبيق اتصال Neon المجمّع `DATABASE_URL`، ويستخدم Drizzle Kit اتصالاً مباشراً `DATABASE_URL_UNPOOLED` عند إنشاء/تحديث الجداول.
- **ORM:** Drizzle ORM.

لا يحتاج المشروع إلى خادم Express دائم التشغيل أو إلى تشغيل جهازك بعد النشر.

## 1. ما الذي تم تجهيزه داخل المشروع؟

- `server.ts`: نقطة تشغيل Express التي يتعرف عليها Vercel. لا تستدعي `app.listen()`.
- `vercel.json`: يحدد أمر البناء ومنطقة تشغيل الدوال وإعادة توجيه مسارات React إلى `index.html`.
- `scripts/prepare-vercel.mjs`: ينسخ ناتج Vite إلى مجلد `public` الذي يقدمه Vercel.
- `package.json`: يحتوي أمر `vercel:build` ويحدد Node.js 24.
- `artifacts/hmk-hackathon/vite.config.ts`: لم يعد يتطلب متغيري `PORT` و`BASE_PATH` وقت البناء.
- `lib/db/src/index.ts`: يستخدم Pool صغيراً مع وقت خمول محدود لتقليل الاتصالات غير الضرورية.
- `lib/db/drizzle.config.ts`: يفضّل `DATABASE_URL_UNPOOLED` لعمليات Drizzle، ويقبل `DATABASE_URL` كبديل.
- `.env.example`: أسماء المتغيرات المطلوبة دون أي أسرار حقيقية.

## 2. رفع المشروع إلى GitHub

### الطريقة الموصى بها: GitHub Desktop

1. نزّل ملف ZIP النهائي وفك ضغطه إلى مجلد واضح، مثلاً `hmk-hackathon`.
2. ثبّت GitHub Desktop وسجّل الدخول بحساب GitHub.
3. من **File → Add Local Repository** اختر مجلد `hmk-hackathon`.
4. إذا لم يكن المجلد Repository بعد، اختر إنشاء Repository له، واجعل اسم الفرع `main`.
5. راجع قائمة الملفات قبل النشر. يجب ألا يظهر أي ملف `.env` حقيقي أو كلمة مرور أو رابط قاعدة بيانات. ملف `.env.example` آمن لأنه يحتوي قيماً توضيحية فقط.
6. اضغط **Commit to main** مع رسالة مثل `Prepare HMK Hackathon for Vercel`.
7. اضغط **Publish repository**، ويفضّل جعل المستودع **Private**.

### بديل باستخدام PowerShell أو Git Bash

أنشئ مستودعاً فارغاً في GitHub باسم `hmk-hackathon`، ولا تضف README أو License من GitHub لأن المشروع يحتوي ملفاتهما. ثم افتح Terminal داخل المجلد المستخرج ونفّذ بعد استبدال USERNAME باسم حسابك:

```bash
git init
git add .
git status
git commit -m "Prepare HMK Hackathon for Vercel"
git branch -M main
git remote add origin https://github.com/USERNAME/hmk-hackathon.git
git push -u origin main
```

إذا طلب GitHub تسجيل الدخول، أكمل المصادقة عبر المتصفح. لا تضع Token داخل الأوامر أو ملفات المشروع.

## 3. إنشاء PostgreSQL على Neon

1. افتح [Neon](https://neon.com/) وأنشئ حساباً أو سجّل الدخول.
2. أنشئ Project جديداً باسم `hmk-hackathon-prod`.
3. اختر منطقة PostgreSQL في Frankfurt / `eu-central-1` إن كانت متاحة في خيارات مشروعك.
4. افتح **Connect** واختر Branch وDatabase وRole الصحيحين.
5. فعّل **Connection pooling** وانسخ رابط الاتصال المجمّع. يجب أن يظهر `-pooler` في اسم المضيف. هذا هو `DATABASE_URL` للتطبيق.
6. أوقف خيار pooling مؤقتاً أو اختر Direct connection وانسخ رابط الاتصال المباشر. هذا هو `DATABASE_URL_UNPOOLED` لعمليات Drizzle.
7. احتفظ بالرابطين في مدير كلمات مرور أو ملف محلي غير مضاف إلى Git. لا ترسلهما في محادثة أو بريد عام.

للتطبيقات ذات الوظائف القصيرة والمتعددة، توصي Neon بالاتصال المجمّع. وتوصي باستخدام الاتصال المباشر لأدوات تغييرات المخطط التي قد لا تتوافق مع PgBouncer transaction pooling.

## 4. إنشاء جداول قاعدة البيانات لأول مرة

يجب إنشاء الجداول قبل تشغيل التطبيق. نفّذ الخطوة من جهازك بعد تثبيت Node.js 24 وpnpm 10 أو من بيئة Terminal موثوقة.

```bash
pnpm install --frozen-lockfile
```

### Windows PowerShell

```powershell
$env:DATABASE_URL_UNPOOLED = "PASTE_DIRECT_NEON_CONNECTION_STRING_HERE"
pnpm --filter @workspace/db run push
Remove-Item Env:DATABASE_URL_UNPOOLED
```

### macOS / Linux / Git Bash

```bash
DATABASE_URL_UNPOOLED="PASTE_DIRECT_NEON_CONNECTION_STRING_HERE" pnpm --filter @workspace/db run push
```

استبدل النص الوهمي برابط Neon المباشر. لا تضع الرابط داخل الملف أو ترفعه إلى GitHub.

يجب أن تنتهي العملية دون أخطاء. أنشأ Drizzle Kit الجداول المعرفة في `lib/db/src/schema`، ومنها جداول التسجيل والمشاركين والفرق والأفكار والجلسات وحدود الطلبات.

**تنبيه:** هذا الأمر ينشئ/يحدّث مخطط الجداول فقط. لا ينقل بيانات قديمة من Replit. إن كان لديك تسجيلات محفوظة في قاعدة Replit وتريد الاحتفاظ بها، يجب تصديرها واستيرادها إلى Neon قبل فتح التسجيل العام. لا تنفذ أي أوامر حذف أو إعادة إنشاء على قاعدة تحتوي بيانات تريد الاحتفاظ بها.

## 5. إنشاء مشروع Vercel وربطه بـ GitHub

1. افتح [Vercel New Project](https://vercel.com/new).
2. اختر **Import Git Repository**.
3. اختر مستودع `hmk-hackathon` الذي رفعته إلى GitHub.
4. إذا طلب Vercel السماح بالوصول إلى المستودع، وافق على المستودع المطلوب فقط.
5. استخدم الإعدادات التالية:

| الإعداد | القيمة |
|---|---|
| Root Directory | `./` (جذر المستودع) |
| Framework Preset | Express إن اكتشفه تلقائياً؛ لا تختَر Vite وحده لأن الخادم جزء من التطبيق |
| Install Command | `pnpm install --frozen-lockfile` أو الاكتشاف التلقائي لـ pnpm |
| Build Command | `pnpm run vercel:build` |
| Output Directory | اتركه فارغاً / غير محدد |
| Node.js Version | 24.x |

لا تجعل Root Directory هو `artifacts/hmk-hackathon`؛ سيؤدي ذلك إلى فقدان الحزم المشتركة والـ Backend.

ملحوظة: `vercel.json` يضع أمر البناء تلقائياً. إذا ظهر في لوحة Vercel إعداد Build Command مختلف، تأكد من أنه `pnpm run vercel:build`.

## 6. إضافة Environment Variables في Vercel

من مشروع Vercel افتح **Settings → Environment Variables**، وأضف المتغيرات التالية إلى **Production** على الأقل:

| الاسم | القيمة |
|---|---|
| `DATABASE_URL` | رابط Neon المجمّع الذي يحتوي `-pooler` |
| `DATABASE_URL_UNPOOLED` | رابط Neon المباشر دون `-pooler` |
| `ADMIN_PASSWORD` | كلمة مرور قوية وفريدة للمنظمين |
| `SESSION_SECRET` | قيمة عشوائية طويلة تم توليدها محلياً |

لتوليد `SESSION_SECRET` باستخدام Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

انسخ الناتج مباشرة إلى Vercel Environment Variables. لا تضع علامات اقتباس إضافية حول القيم في لوحة Vercel. لا تنشئ متغيراً باسم `VITE_ADMIN_PASSWORD` أو أي متغير يبدأ بـ `VITE_` للأسرار؛ متغيرات Vite العامة تُضمّن في ملفات المتصفح.

Vercel يضبط `NODE_ENV=production` لبيئة Production. لا حاجة لإضافة `PORT` أو `BASE_PATH` في الإنتاج.

بعد إضافة المتغيرات، أعد Deployment كي تصبح متاحة للوظيفة.

## 7. منطقة تشغيل Backend

تم ضبط `regions: ["fra1"]` في `vercel.json` لتشغيل Express Function في Frankfurt. أبقِ قاعدة Neon في Frankfurt / `eu-central-1` إن أمكن، لأن تشغيل Function قريباً من قاعدة البيانات يقلل زمن اتصال كل طلب. ملفات الواجهة الثابتة تبقى موزعة عالمياً عبر Vercel CDN.

إذا اخترت منطقة قاعدة بيانات مختلفة، غيّر منطقة Function من `vercel.json` أو من **Settings → Functions → Function Region**، ثم أعد النشر.

## 8. تنفيذ Deployment

بعد التأكد من إعداد المتغيرات وقاعدة البيانات، اضغط **Deploy**. يجب أن ينفّذ البناء الخطوات التالية:

1. تثبيت حزم pnpm من `pnpm-lock.yaml`.
2. تشغيل TypeScript typecheck.
3. بناء واجهة Vite.
4. نسخ محتويات `artifacts/hmk-hackathon/dist/public` إلى `public/`.
5. اكتشاف `server.ts` وتشغيل Express كـ Vercel Function.
6. تقديم ملفات `public/` من CDN وتوجيه `/api/...` إلى Express.

إذا فشل البناء، افتح **Deployments → deployment → Build Logs**، وانسخ رسالة الخطأ الحقيقية فقط دون إظهار أي Environment Variables أو Secrets.

## 9. اختبار النشر

استبدل `YOUR-DOMAIN` بعنوان Vercel الذي يظهر بعد النشر، ثم اختبر:

| الرابط | المتوقع |
|---|---|
| `https://YOUR-DOMAIN/` | الصفحة الرئيسية |
| `https://YOUR-DOMAIN/register` | استمارة التسجيل حتى عند فتح الرابط مباشرة أو تحديث الصفحة |
| `https://YOUR-DOMAIN/admin-hmk` | شاشة دخول المنظمين فقط |
| `https://YOUR-DOMAIN/api/healthz` | JSON يحتوي `status: ok` |
| `https://YOUR-DOMAIN/api/registration-config` | إعدادات فتح/إغلاق التسجيل والموعد النهائي |

بعد الاختبارات العامة:

1. افتح لوحة الإدارة وسجّل الدخول بكلمة المرور التي أعددتها.
2. تأكد من أن الجلسة تستمر عند التنقل بين صفحات الإدارة.
3. جرّب تسجيل طلب اختباري باستخدام بيانات غير حقيقية.
4. تأكد من ظهوره في لوحة الإدارة.
5. اختبر تصدير XLSX وCSV.
6. احذف طلب الاختبار من لوحة الإدارة.
7. افتح سجل Neon وتأكد أن التسجيل الاختباري وسجلاته التابعة حُذفت.

لا تشارك الموقع مع الطلاب قبل اجتياز هذه الاختبارات.

## 10. طريقة التحديث بعد النشر

بعد ربط GitHub بـ Vercel، كل تحديث إلى فرع `main` يؤدي إلى Deployment إنتاجي جديد تلقائياً.

سير العمل المعتاد:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Vercel ينفذ البناء والنشر. لا تشغّل خادم Node محلياً ولا تترك جهازك مفتوحاً بعد النشر.

أي تعديل على تعريفات Drizzle يحتاج إلى مراجعة مخطط البيانات ثم تطبيق التحديث يدوياً عبر `push` أو Migrations باستخدام اتصال مباشر. لا تشغّل أوامر مخطط قاعدة البيانات تلقائياً أثناء كل Deployment.

## 11. النسخ الاحتياطي وحماية البيانات

- راجع خطة Neon ونافذة النسخ الاحتياطي/الاسترجاع المتاحة لحسابك قبل فتح التسجيل. لا تفترض أن خطة مجانية توفر فترة احتفاظ أو Point-in-time recovery غير مذكورة في لوحة الحساب.
- احتفظ بنسخة تصدير آمنة دورياً، لكن لا تضعها في مستودع GitHub.
- لا تستخدم قاعدة Production لاختبار التسجيل والحذف.
- احصر صلاحية لوحة الإدارة بمن يحتاجها فقط.
- إذا تسرب `DATABASE_URL` أو `SESSION_SECRET` أو `ADMIN_PASSWORD`، أعد توليد السر المتأثر من الخدمة المعنية ثم حدّث Vercel وأعد النشر.

## 12. حدود ما تم التحقق منه

تم تجهيز ملفات المشروع وإعدادات Vercel في هذه الحزمة. لم يتم إنشاء حساب Neon أو مستودع GitHub أو مشروع Vercel نيابةً عنك، ولم يتم تشغيل Deployment فعلي؛ فهذه الخطوات تتطلب تسجيل الدخول إلى حساباتك وإضافة بيانات الاتصال السرية. كما أن بناء المشروع واختبارات TypeScript لم تُنفّذ في بيئة العمل الحالية لعدم توفر pnpm/الوصول إلى سجل الحزم. نفّذها عبر `pnpm run vercel:build` بعد تثبيت الحزم، وراجع Build Logs قبل اعتبار الموقع جاهزاً.

## مراجع رسمية

- [Express on Vercel](https://vercel.com/kb/guide/ship-an-express-app-on-vercel)
- [Vercel Project Configuration](https://vercel.com/docs/project-configuration)
- [Vercel Regions](https://vercel.com/docs/regions)
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon Vercel Integration](https://neon.com/docs/guides/vercel-managed-integration)
