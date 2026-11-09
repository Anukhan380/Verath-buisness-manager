import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, audit } from "@/lib/api";
import { limitsFor } from "@/lib/usage";
import { CATALOG, TOOL_DEFS } from "@/lib/agents";
export async function GET() {
  return guard("VIEWER", async (c) => NextResponse.json({ catalog: CATALOG, employees: await db.aiEmployee.findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" } }), aiConfigured: !!process.env.OPENAI_API_KEY }));
}
const Hire = z.object({ catalogKey: z.string() });
const Custom = z.object({ name: z.string().min(2).max(80), title: z.string().min(2).max(80), instructions: z.string().min(5).max(4000), tools: z.array(z.string()).default([]) });
export async function POST(req: Request) {
  return guard("ADMIN", async (c) => {
    const b = await req.json().catch(() => null);
    const lim = await limitsFor(c.orgId);
    if (await db.aiEmployee.count({ where: { orgId: c.orgId } }) >= lim.employees) return NextResponse.json({ error: `Plan limit reached (${lim.employees} AI employees)` }, { status: 402 });
    const h = Hire.safeParse(b), cat = h.success ? CATALOG.find(x => x.key === h.data.catalogKey) : null;
    if (cat) {
      const e = await db.aiEmployee.create({ data: { orgId: c.orgId, catalogKey: cat.key, name: cat.name, title: cat.title, instructions: cat.ins, tools: cat.tools } });
      await audit(c.orgId, c.userId, "ai.hired", { id: e.id }); return NextResponse.json(e);
    }
    const p = Custom.safeParse(b); if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const e = await db.aiEmployee.create({ data: { ...p.data, tools: p.data.tools.filter(t => t in TOOL_DEFS), orgId: c.orgId } });
    await audit(c.orgId, c.userId, "ai.created_custom", { id: e.id }); return NextResponse.json(e);
  });
}
export async function PATCH(req: Request) {
  return guard("ADMIN", async (c) => {
    const p = z.object({ id: z.string(), status: z.enum(["ACTIVE","PAUSED"]) }).safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    await db.aiEmployee.updateMany({ where: { id: p.data.id, orgId: c.orgId }, data: { status: p.data.status } });
    await audit(c.orgId, c.userId, "ai.status", p.data); return NextResponse.json({ ok: true });
  });
}
export async function DELETE(req: Request) {
  return guard("ADMIN", async (c) => {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    await db.aiEmployee.deleteMany({ where: { id, orgId: c.orgId } });
    await audit(c.orgId, c.userId, "ai.deleted", { id }); return NextResponse.json({ ok: true });
  });
}

export const dynamic = "force-dynamic";
