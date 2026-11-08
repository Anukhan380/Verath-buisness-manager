# EASIEST WAY (no terminal, no Node.js needed)
1. **Supabase:** create a project. SQL Editor > New query > paste the whole `supabase-setup.sql` file > Run. (Creates every table and locks the public API.) Then click Connect and copy the *Transaction pooler* string (this is DATABASE_URL) and the *Direct connection* or *Session pooler* string (DIRECT_URL). Put your database password in place of [YOUR-PASSWORD].
2. **GitHub:** create a PRIVATE repository. Add file > Upload files. The project has 74 files, under GitHub's 100-files-per-upload limit, so one upload is enough (open the `vbm` folder, press Ctrl+A, drag everything into the browser). Upload the CONTENTS of the `vbm` folder (so `package.json` sits at the top of the repository).
3. **Vercel:** Add New > Project > import the repository > Environment Variables: DATABASE_URL, DIRECT_URL, AUTH_SECRET (32+ random characters), CRON_SECRET (32+ random characters), OPENAI_API_KEY (your OpenRouter key), OPENAI_BASE_URL (https://openrouter.ai/api/v1), OPENAI_MODEL (a tool-capable model) > Deploy. Do not use Vercel's Supabase integration; paste the strings yourself.
4. Open your site, go to /register and create your business.

The longer guide below adds local testing with `npm run smoke` and `npm run deep`.

---
# Deploy guide: GitHub -> Supabase -> Vercel
Do these in order. Total time: roughly 30-60 minutes.

## 1. Test locally first (recommended)
1. Install Node.js 20.9 or newer. In this folder: `npm install`
2. Copy `.env.example` to `.env`. Fill DATABASE_URL and DIRECT_URL (from step 3), AUTH_SECRET (run `openssl rand -base64 32`), OPENAI_API_KEY (optional, enables AI), CRON_SECRET (any long random string).
3. `npx prisma db push` (creates all tables), then `npm run dev`
4. In a second terminal run `npm test` (unit tests), `npm run smoke` and `npm run deep` (about 90 end-to-end checks: roles, every module, workflows, plan limits, multi-organization isolation).
5. To test AI features without a key or cost, start the stand-in first: `node scripts/fake-openai.mjs`, and set `OPENAI_BASE_URL=http://localhost:4010/v1` and `OPENAI_API_KEY=test` in `.env`. This checks the tool-calling plumbing only, not real AI quality. For the real thing, use your real OpenAI key and leave OPENAI_BASE_URL unset.
The tests create test organizations. Run them on a scratch database, or delete the test data afterwards. Run `npm run smoke` and `npm run deep` at least a minute apart (login rate limit).

## 2. GitHub
Create a PRIVATE repo, then: `git init && git add . && git commit -m "Verath Business Manager" && git branch -M main && git remote add origin <your-repo-url> && git push -u origin main`. `.env` is git-ignored: never commit secrets.

## 3. Supabase (database)
1. New project. Settings -> Database -> Connection string.
2. DATABASE_URL = the **Transaction pooler** string (port 6543). Use it exactly as given (no extra parameters).
3. DIRECT_URL = the **Direct / Session** string (port 5432).
4. From your computer with those values in `.env`: `npx prisma db push`
5. **Important security step.** Supabase exposes tables over its public API. This app talks to the database directly, so lock the public API out. In Supabase -> SQL Editor run:
```sql
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop; end $$;
```
With row level security on and no policies, the public API can read nothing. The app is unaffected because it connects with the database owner role.

## 4. Vercel
1. Import the GitHub repo. Framework: Next.js (auto).
2. Environment variables: DATABASE_URL, DIRECT_URL, AUTH_SECRET, CRON_SECRET, and optionally OPENAI_API_KEY and OPENAI_MODEL.
3. Deploy. Open the site, go to /register, create your organization.
4. Daily automations run through Vercel Cron (see vercel.json); it needs CRON_SECRET set. Cron availability depends on your Vercel plan.
5. Run `BASE_URL=https://your-site.vercel.app npm run smoke` once against production, then delete the test organizations.

## What was tested before delivery
On a real PostgreSQL database with Next.js 16, React 19, Prisma 6 and zod 4: production build, type-check, 3 unit tests, 24 smoke checks and 67 deep checks (all passing). The AI checks used the local stand-in, so the tool-calling logic is verified but not real OpenAI output. NOT tested: a real OpenAI key, Supabase specifics (SSL, pooler), Vercel runtime and cron, clicking through the UI in a browser, and foreign-key behavior (my test tables were created without foreign keys; `prisma db push` adds them).

## Interface
Dark and light themes (toggle top-right, remembered), collapsible sidebar, Ctrl/Cmd+K command search, drag-and-drop CRM board, animated charts that respect reduced-motion settings. AI employees have nicknames and avatars: Atlas, Ace, Nova, Kai, Penny, Orbit, Echo, Hana (you can say "ask Ace to follow up" to the Brain).

## Known limitations
The workflow builder is a vertical step flow with animated connectors, not yet a free zoom/pan canvas. No demo-data mode.
No real integrations (email, WhatsApp, payments), no billing, keyword-only knowledge search, in-memory rate limiting (best effort on serverless), linear workflow builder, no password reset or email verification yet, no UI for creating custom AI employees.
