-- Verath Business Manager: database setup for Supabase.
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run. Run it ONCE on a new, empty project.
-- It creates all tables, then turns on row level security so Supabase's public API cannot read your data
-- (the app connects directly with the database owner role, so it is not affected).

CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "plan" "Plan" NOT NULL DEFAULT 'STARTER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Membership" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE'
);
CREATE UNIQUE INDEX ON "Membership" ("userId", "orgId");
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "AuditLog" ("orgId", "createdAt");
CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "Lead" ("orgId", "status");
CREATE TABLE "Transaction" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "Transaction" ("orgId", "createdAt");
CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "projectId" TEXT,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "due" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "Task" ("orgId", "status");
CREATE TABLE "AiEmployee" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "catalogKey" TEXT,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "tools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "AiEmployee" ("orgId");
CREATE TABLE "AgentMessage" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "AgentMessage" ("employeeId", "createdAt");
CREATE TABLE "Workflow" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "nodes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "Workflow" ("orgId", "trigger");
CREATE TABLE "WorkflowRun" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "log" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "cursor" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "WorkflowRun" ("orgId", "createdAt");
CREATE TABLE "BrainMessage" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "BrainMessage" ("orgId", "userId", "createdAt");
CREATE TABLE "KbDoc" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "KbDoc" ("orgId");
CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "Notification" ("orgId", "read", "createdAt");
CREATE TABLE "UsageEvent" (
  "id" TEXT PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON "UsageEvent" ("orgId", "kind", "createdAt");

do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop; end $$;
