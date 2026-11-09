import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { guard, audit } from "@/lib/api";
import { startRun, execute } from "@/lib/engine";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  return guard("MANAGER", async (c) => {
    const p = z.object({ action: z.enum(["run","approve","retry"]), runId: z.string().optional(), data: z.record(z.string(), z.any()).optional() }).safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if (p.data.action === "run") {
      const w = await db.workflow.findFirst({ where: { id: params.id, orgId: c.orgId } }); if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const id = await startRun(w, p.data.data ?? { test: true }); await audit(c.orgId, c.userId, "workflow.run", { id: w.id }); return NextResponse.json({ runId: id });
    }
    const r = await db.workflowRun.findFirst({ where: { id: p.data.runId ?? "", orgId: c.orgId } }); if (!r) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    if (p.data.action === "approve") {
      if (r.status !== "WAITING_APPROVAL") return NextResponse.json({ error: "Not waiting for approval" }, { status: 409 });
      await audit(c.orgId, c.userId, "workflow.approved", { runId: r.id }); await execute(r.id); return NextResponse.json({ ok: true });
    }
    if (r.status !== "FAILED") return NextResponse.json({ error: "Only failed runs can be retried" }, { status: 409 });
    // Retry resumes at the failed step, so completed steps are not repeated.
    const nr = await db.workflowRun.create({ data: { orgId: c.orgId, workflowId: r.workflowId, data: r.data as Prisma.InputJsonValue, log: r.log as Prisma.InputJsonValue, cursor: r.cursor } });
    await execute(nr.id); await audit(c.orgId, c.userId, "workflow.retry", { runId: r.id }); return NextResponse.json({ runId: nr.id });
  });
}

export const maxDuration = 60;
