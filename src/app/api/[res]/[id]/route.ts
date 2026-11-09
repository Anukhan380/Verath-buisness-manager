import { NextResponse } from "next/server";
import { guard, table, audit } from "@/lib/api";
import { RES, ResKey } from "@/lib/resources";
type P = { params: Promise<{ res: string; id: string }> };
const ok = (r: string): r is ResKey => r in RES;
export async function PATCH(req: Request, ctx: P) {
  const params = await ctx.params;
  if (!ok(params.res)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return guard("EMPLOYEE", async (c) => {
    const p = RES[params.res as ResKey].schema.partial().safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const r = await table(params.res as ResKey).updateMany({ where: { id: params.id, orgId: c.orgId }, data: p.data });
    if (!r.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await audit(c.orgId, c.userId, `${params.res}.updated`, { id: params.id });
    return NextResponse.json({ ok: true });
  });
}
export async function DELETE(_: Request, ctx: P) {
  const params = await ctx.params;
  if (!ok(params.res)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return guard("MANAGER", async (c) => {
    const r = await table(params.res as ResKey).deleteMany({ where: { id: params.id, orgId: c.orgId } });
    if (!r.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await audit(c.orgId, c.userId, `${params.res}.deleted`, { id: params.id });
    return NextResponse.json({ ok: true });
  });
}
