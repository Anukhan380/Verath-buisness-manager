import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { runAgent } from "@/lib/agentRun";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  return guard("VIEWER", async (c) => NextResponse.json(await db.agentMessage.findMany({ where: { orgId: c.orgId, employeeId: params.id }, orderBy: { createdAt: "asc" }, take: 100 })));
}
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  return guard("EMPLOYEE", async (c) => {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI is not configured. Set OPENAI_API_KEY in your environment." }, { status: 503 });
    const p = z.object({ message: z.string().min(1).max(4000) }).safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const emp = await db.aiEmployee.findFirst({ where: { id: params.id, orgId: c.orgId } });
    if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (emp.status !== "ACTIVE") return NextResponse.json({ error: "This AI employee is paused" }, { status: 409 });
    try { return NextResponse.json(await runAgent(c.orgId, c.userId, emp, p.data.message, true)); } catch (e) { const m = (e as Error).message; if (m.startsWith("Monthly AI limit")) return NextResponse.json({ error: m }, { status: 429 }); console.error(e); return NextResponse.json({ error: "AI request failed" }, { status: 502 }); }
  });
}

export const maxDuration = 60;
