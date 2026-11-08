# Verath Business Manager
See DEPLOY.md to run and deploy. Phases 1-7 included.
1. `cp .env.example .env` and set DATABASE_URL + AUTH_SECRET
2. `npm install && npx prisma migrate dev --name init`
3. `npm run dev` → /register creates an organization + OWNER
## Included
Org registration, login/logout, multi-tenant schema (User, Organization, Membership+Role, AuditLog), server-side role check (`requireRole`), audit log, org-scoped dashboard.
## Phase 2 added
Leads (CRM), transactions (finance), projects, tasks, team (add existing users), live dashboard stats; generic org-scoped API with role checks (view=VIEWER, write=EMPLOYEE, delete=MANAGER, team=ADMIN). Run `npx prisma migrate dev --name phase2`.
## Not yet
Rate limiting, Tailwind design system, CRM/Sales/Finance/Projects, AI Workforce, automations, Brain, KB, integrations, billing. Not yet tested against a live database.

## Phase 3 added
AI Workforce: 8 built-in AI employees, hire/pause/delete, custom employees (API), chat with real tool calls (business summary, leads, overdue tasks, create task). Needs OPENAI_API_KEY. Run: npx prisma migrate dev --name phase3

## Phase 4 added
Automation engine: workflow builder (trigger + ordered step cards), node types Condition/Create task/AI employee/Notify/Approval, server-side execution, run history with per-step log, approve and retry, test runs. Triggers: MANUAL, LEAD_CREATED, DAILY (Vercel cron, needs CRON_SECRET). Run: npx prisma migrate dev --name phase4

## Phase 5 added
AI Business Brain: central chat (/dashboard/brain, floating Ask Brain button) with tools: business summary, leads, overdue tasks, create task, 3-month comparison, list AI employees, delegate to an AI employee (records a task, audit logged). Run: npx prisma migrate dev --name phase5

## Phase 6 added
Knowledge base (pasted text + keyword search tool), notification center (new lead, workflow failed/approval/notify), honest integrations page, 6-month analytics + CSV export, usage tracking + plan limits (AI calls, AI employees). Run: npx prisma migrate dev --name phase6
