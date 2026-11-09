import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getSession(); if (!s) return new Response("Unauthorized", { status: 401 });
  const ms = await db.membership.findMany({ where: { userId: s.userId }, include: { org: true } });
  return NextResponse.json({ current: s.orgId, orgs: ms.map(m => ({ id: m.orgId, name: m.org.name, role: m.role })) });
}
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return new Response("Unauthorized", { status: 401 });
  const p = z.object({ orgId: z.string() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const m = await db.membership.findUnique({ where: { userId_orgId: { userId: s.userId, orgId: p.data.orgId } } });
  if (!m) return NextResponse.json({ error: "Not a member of that organization" }, { status: 403 });
  await createSession({ userId: s.userId, orgId: m.orgId });
  return NextResponse.json({ ok: true });
}
