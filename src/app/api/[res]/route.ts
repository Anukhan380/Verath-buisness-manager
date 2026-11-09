import { NextResponse } from "next/server";
import { guard, table, audit } from "@/lib/api";
import { notify } from "@/lib/notify";
import { fireTrigger } from "@/lib/engine";
import { RES, ResKey } from "@/lib/resources";
const ok = (r: string): r is ResKey => r in RES;
export async function GET(_: Request, ctx: { params: Promise<{ res: string }> }) {
  const params = await ctx.params;
  if (!ok(params.res)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return guard("VIEWER", async (c) => NextResponse.json(await table(params.res as ResKey).findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" }, take: 500 })));
}
export async function POST(req: Request, ctx: { params: Promise<{ res: string }> }) {
  const params = await ctx.params;
  if (!ok(params.res)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return guard("EMPLOYEE", async (c) => {
    const p = RES[params.res as ResKey].schema.safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const row = await table(params.res as ResKey).create({ data: { ...p.data, orgId: c.orgId } });
    await audit(c.orgId, c.userId, `${params.res}.created`, { id: row.id });
    if (params.res === "leads") { try { await notify(c.orgId, "new_lead", `New lead: ${row.name}`); await fireTrigger(c.orgId, "LEAD_CREATED", { lead: row }); } catch (e) { console.error(e); } }
    return NextResponse.json(row);
  });
}

export const maxDuration = 60;
