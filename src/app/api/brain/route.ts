import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { runAgent } from "@/lib/agentRun";
import { brainEmp, brainExtra } from "@/lib/brain";
export async function GET() {
  return guard("VIEWER", async (c) => NextResponse.json(await db.brainMessage.findMany({ where: { orgId: c.orgId, userId: c.userId }, orderBy: { createdAt: "asc" }, take: 60 })));
}
export async function POST(req: Request) {
  return guard("EMPLOYEE", async (c) => {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI is not configured. Set OPENAI_API_KEY in your environment." }, { status: 503 });
    const p = z.object({ message: z.string().min(1).max(4000) }).safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const past = (await db.brainMessage.findMany({ where: { orgId: c.orgId, userId: c.userId }, orderBy: { createdAt: "desc" }, take: 10 })).reverse().map(m => ({ role: m.role, content: m.content }));
    try {
      const r = await runAgent(c.orgId, c.userId, brainEmp(), p.data.message, false, brainExtra(c.orgId, c.userId, past));
      await db.brainMessage.createMany({ data: [{ orgId: c.orgId, userId: c.userId, role: "user", content: p.data.message }, { orgId: c.orgId, userId: c.userId, role: "assistant", content: r.reply }] });
      return NextResponse.json(r);
    } catch (e) { const m = (e as Error).message; if (m.startsWith("Monthly AI limit")) return NextResponse.json({ error: m }, { status: 429 }); console.error(e); return NextResponse.json({ error: "AI request failed" }, { status: 502 }); }
     if (m.startsWith("AI provider error")) return NextResponse.json({ error: m }, { status: 502 });
  });
}

export const dynamic = "force-dynamic";

export const maxDuration = 60;
