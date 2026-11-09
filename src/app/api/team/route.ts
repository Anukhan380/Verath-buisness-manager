import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, audit } from "@/lib/api";
const S = z.object({ email: z.string().email(), role: z.enum(["ADMIN","MANAGER","EMPLOYEE","VIEWER"]) });
// Adds an EXISTING registered user to the org (email invites arrive with the email integration).
export async function POST(req: Request) {
  return guard("ADMIN", async (c) => {
    const p = S.safeParse(await req.json().catch(() => null));
    if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const u = await db.user.findUnique({ where: { email: p.data.email.toLowerCase() } });
    if (!u) return NextResponse.json({ error: "No registered user with that email yet" }, { status: 404 });
    const ex = await db.membership.findUnique({ where: { userId_orgId: { userId: u.id, orgId: c.orgId } } });
    if (ex?.role === "OWNER") return NextResponse.json({ error: "The owner's role cannot be changed" }, { status: 403 });
    if ((p.data.role === "ADMIN" || ex?.role === "ADMIN") && c.role !== "OWNER") return NextResponse.json({ error: "Only the owner can grant or change Admin" }, { status: 403 });
    await db.membership.upsert({ where: { userId_orgId: { userId: u.id, orgId: c.orgId } }, update: { role: p.data.role }, create: { userId: u.id, orgId: c.orgId, role: p.data.role } });
    await audit(c.orgId, c.userId, "team.member_set", { email: p.data.email, role: p.data.role });
    return NextResponse.json({ ok: true });
  });
}
