import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
const S = z.object({ email: z.string().email(), password: z.string().min(1) });
import { limited } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited("auth:" + (req.headers.get("x-forwarded-for") ?? "local"), 20)) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  const p = S.safeParse(await req.json().catch(() => null));
  const bad = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!p.success) return bad;
  const u = await db.user.findUnique({ where: { email: p.data.email.toLowerCase() }, include: { memberships: true } });
  if (!u || !(await bcrypt.compare(p.data.password, u.passwordHash)) || !u.memberships[0]) return bad;
  await createSession({ userId: u.id, orgId: u.memberships[0].orgId });
  await db.auditLog.create({ data: { orgId: u.memberships[0].orgId, actorId: u.id, action: "auth.login" } });
  return NextResponse.json({ ok: true });
}
