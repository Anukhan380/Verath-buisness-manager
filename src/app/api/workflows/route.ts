import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, audit } from "@/lib/api";
const s = z.string().max(500);
const Node = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CONDITION"), field: s.min(1), op: z.enum(["eq","gt","lt","contains"]), value: s }),
  z.object({ type: z.literal("CREATE_TASK"), title: s.min(1), priority: z.enum(["LOW","MEDIUM","HIGH"]).default("MEDIUM") }),
  z.object({ type: z.literal("AI_EMPLOYEE"), employeeId: s.min(1), prompt: z.string().min(1).max(2000) }),
  z.object({ type: z.literal("NOTIFY"), message: s.min(1) }),
  z.object({ type: z.literal("APPROVAL") }),
]);
const W = z.object({ name: z.string().min(2).max(100), trigger: z.enum(["MANUAL","LEAD_CREATED","DAILY"]), nodes: z.array(Node).min(1).max(20) });
export async function GET() {
  return guard("VIEWER", async (c) => NextResponse.json({ workflows: await db.workflow.findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" } }), runs: await db.workflowRun.findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" }, take: 30 }) }));
}
export async function POST(req: Request) {
  return guard("MANAGER", async (c) => {
    const p = W.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: "Invalid workflow" }, { status: 400 });
    const w = await db.workflow.create({ data: { ...p.data, orgId: c.orgId } }); await audit(c.orgId, c.userId, "workflow.created", { id: w.id }); return NextResponse.json(w);
  });
}
export async function PATCH(req: Request) {
  return guard("MANAGER", async (c) => {
    const p = z.object({ id: z.string(), active: z.boolean() }).safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    await db.workflow.updateMany({ where: { id: p.data.id, orgId: c.orgId }, data: { active: p.data.active } }); await audit(c.orgId, c.userId, "workflow.active", p.data); return NextResponse.json({ ok: true });
  });
}
export async function DELETE(req: Request) {
  return guard("MANAGER", async (c) => { const id = new URL(req.url).searchParams.get("id") ?? ""; await db.workflow.deleteMany({ where: { id, orgId: c.orgId } }); await audit(c.orgId, c.userId, "workflow.deleted", { id }); return NextResponse.json({ ok: true }); });
}

export const dynamic = "force-dynamic";
