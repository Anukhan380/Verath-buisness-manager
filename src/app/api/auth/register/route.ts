import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
const S = z.object({ name: z.string().min(2).max(80), email: z.string().email().max(160), password: z.string().min(10).max(128), orgName: z.string().min(2).max(80) });
import { limited } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited("auth:" + (req.headers.get("x-forwarded-for") ?? "local"), 20)) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  const p = S.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, orgName, password } = p.data, email = p.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const r = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 12) } });
    const org = await tx.organization.create({ data: { name: orgName, slug } });
    await tx.membership.create({ data: { userId: user.id, orgId: org.id, role: "OWNER" } });
    await tx.auditLog.create({ data: { orgId: org.id, actorId: user.id, action: "org.created" } });
    return { user, org };
  });
  await createSession({ userId: r.user.id, orgId: r.org.id });
  return NextResponse.json({ ok: true });
}
