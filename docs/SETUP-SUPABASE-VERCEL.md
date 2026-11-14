# Setup: Supabase + Vercel (≈10 minutes)

The site is one Vercel project: the React form (static) plus an Express API that runs as a
Vercel serverless function at `/api/*`. All data lives in your Supabase Postgres database.
The browser never talks to Supabase directly — only the server does — so participant data
stays private.

## Why the form showed "closed" before
Vercel never deployed the API, so `/api/registration-config` returned the site's 404 page.
The frontend couldn't read the registration status and fell back to "closed".
The build now writes Vercel's Build Output format itself (`.vercel/output`), so the API is
always deployed as a function.

---

## 1. Create the tables in Supabase
1. Open your project at <https://supabase.com/dashboard> (region **Frankfurt / eu-central-1**
   is best — it matches the Vercel region `fra1`).
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/setup.sql` from this repo, copy **all** of it, paste, press **Run**.
4. The result table at the bottom should list 11 tables, all with `rowsecurity = true`.

> Run it once. Running it again on the same project fails harmlessly (tables already exist).

## 2. Copy the connection string ("link" the project)
1. In Supabase, click **Connect** (top of the project dashboard).
2. Choose **Connection string** → type **URI** → **Transaction pooler** (port **6543**).
3. Copy it and replace `[YOUR-PASSWORD]` with your database password
   (forgot it? **Project Settings → Database → Reset database password**).
   If the password has special characters like `@ # / ?`, URL-encode them or reset to a
   password with letters and digits only.

It looks like:
```
postgresql://postgres.abcdefghijklm:YOURPASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

Do **not** use Supabase's "Vercel integration" button — it adds many variables this project
doesn't use. Only the four below are needed.

## 3. Add environment variables in Vercel
Vercel → your project → **Settings → Environment Variables**. Add for **Production** (and
Preview if you use preview deployments):

| Name | Value |
|---|---|
| `DATABASE_URL` | the Transaction-pooler string from step 2 |
| `ADMIN_PASSWORD` | a long password for organizers |
| `SESSION_SECRET` | random string: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |

Remove old Neon variables (`DATABASE_URL_UNPOOLED` etc.) if they are still there.

Also check **Settings → General → Build & Development Settings**:
- Framework Preset: **Other**
- Build / Output / Install command overrides: **off** (vercel.json sets them)
- Node.js version: **22.x** or **24.x**

## 4. Deploy
Commit and push to GitHub — Vercel deploys automatically. (Changing env vars needs a new
deployment: **Deployments → … → Redeploy**.)

## 5. Check it works
- `https://hamak-hackathon-form.vercel.app/api/registration-config` → JSON like
  `{"deadline":"…","open":true,"mode":"AUTO","closedMessage":""}`
- `https://hamak-hackathon-form.vercel.app/api/healthz` → `{"status":"ok"}`
- Home page shows **التسجيل مفتوح الآن** and the "ابدأ التسجيل" button.
- `/admin-hmk` → log in with `ADMIN_PASSWORD`.

If `/api/...` returns an error 500: open Vercel → **Logs**. The usual cause is a missing env
variable or a wrong database password.

---

## Using the admin dashboard (`/admin-hmk`)
| Tab | What it does |
|---|---|
| نظرة عامة | Counters + latest registrations |
| التسجيلات / المشاركون المنفردون | Search, filter, details, delete |
| **التحليلات** (new) | Daily signups, cumulative growth, splits (team/individual, internal/external, idea), team sizes, colleges, years, courses, project types, team needs, individual roles, external organizations |
| **التحكم بالتسجيل** (new) | Open/close the form, edit the deadline, custom closed message |
| Excel / CSV (header) | Full export |

**Registration modes**
- **تلقائي حسب الموعد (AUTO)**: open until the deadline, then closes by itself.
- **مفتوح يدوياً (OPEN)**: stays open even after the deadline.
- **مغلق يدوياً (CLOSED)**: closed immediately for everyone.

Changes apply instantly: the server checks the setting on every submission, and open
pages refresh their status every minute. The header chip always shows the live status.

## Security notes
- All tables have Row Level Security enabled with no policies, and grants are revoked from
  Supabase's `anon`/`authenticated` roles: the public Supabase API key cannot read anything.
- Never put `DATABASE_URL` or the `service_role` key in frontend code.
- Supabase backups: Free plan has none you can restore yourself — export Excel regularly,
  or use the Pro plan for daily backups.

## Local development
```sh
pnpm install
cp .env.example .env   # fill in values, then export them in your shell
pnpm --filter @workspace/db run push        # only if you change lib/db/src/schema
pnpm run vercel:build                        # same build Vercel runs
```
