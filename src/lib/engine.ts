import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { tpl, cond } from "./pure";
import { notify } from "./notify";
import { runAgent } from "./agentRun";
/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = Record<string, any> & { type: string };
type Entry = { step: number; type: string; ok: boolean; note: string };
export async function execute(runId: string) {
  const run = await db.workflowRun.findUnique({ where: { id: runId }, include: { workflow: true } });
  if (!run) return;
  const nodes = run.workflow.nodes as Node[], log = run.log as Entry[], ctx = run.data as any, org = run.orgId;
  await db.workflowRun.update({ where: { id: runId }, data: { status: "RUNNING" } });
  let i = run.cursor;
  try {
    for (; i < nodes.length; i++) {
      const n = nodes[i]; let note = "";
      if (n.type === "CONDITION") {
        if (!cond(n as unknown as { field: string; op: string; value: string }, ctx)) { log.push({ step: i, type: n.type, ok: true, note: "Condition not met, workflow stopped" }); await db.workflowRun.update({ where: { id: runId }, data: { status: "SUCCESS", log, cursor: i } }); return; }
        note = "Condition met";
      } else if (n.type === "CREATE_TASK") {
        const t = await db.task.create({ data: { orgId: org, title: tpl(n.title, ctx).slice(0, 200) || "Untitled", priority: n.priority ?? "MEDIUM" } }); note = `Task created (${t.id})`;
      } else if (n.type === "AI_EMPLOYEE") {
        const e = await db.aiEmployee.findFirst({ where: { id: n.employeeId, orgId: org, status: "ACTIVE" } });
        if (!e) throw new Error("AI employee missing or paused");
        const r = await runAgent(org, "system:workflow", e, tpl(n.prompt, ctx), false); note = `${e.name}: ${r.reply.slice(0, 400)}`;
      } else if (n.type === "NOTIFY") {
        await db.auditLog.create({ data: { orgId: org, actorId: "system:workflow", action: "workflow.notify", meta: { message: tpl(n.message, ctx) } } }); await notify(org, "workflow_notify", tpl(n.message, ctx)); note = "Notification created";
      } else if (n.type === "APPROVAL") {
        log.push({ step: i, type: n.type, ok: true, note: "Waiting for human approval" });
        await db.workflowRun.update({ where: { id: runId }, data: { status: "WAITING_APPROVAL", log, cursor: i + 1 } });
        await notify(org, "approval_needed", `Workflow "${run.workflow.name}" is waiting for approval`); return;
      } else throw new Error(`Unknown node type ${n.type}`);
      log.push({ step: i, type: n.type, ok: true, note });
    }
    await db.workflowRun.update({ where: { id: runId }, data: { status: "SUCCESS", log, cursor: i } });
  } catch (e) {
    log.push({ step: i, type: nodes[i]?.type ?? "?", ok: false, note: (e as Error).message });
    await db.workflowRun.update({ where: { id: runId }, data: { status: "FAILED", log, cursor: i, error: (e as Error).message } });
    await notify(org, "workflow_failed", `Workflow "${run.workflow.name}" failed: ${(e as Error).message}`);
  }
}
export async function startRun(wf: { id: string; orgId: string }, data: Prisma.InputJsonValue) {
  const run = await db.workflowRun.create({ data: { orgId: wf.orgId, workflowId: wf.id, data } });
  await execute(run.id); return run.id;
}
export async function fireTrigger(orgId: string, trigger: string, data: Prisma.InputJsonValue) {
  const wfs = await db.workflow.findMany({ where: { orgId, trigger, active: true } });
  for (const w of wfs) await startRun(w, data);
}
