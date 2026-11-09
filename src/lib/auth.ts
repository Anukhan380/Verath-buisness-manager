import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { db } from "./db";
const key = () => { const s = process.env.AUTH_SECRET; if (!s || s.length < 16) throw new Error("AUTH_SECRET missing/too short"); return new TextEncoder().encode(s); };
export type Session = { userId: string; orgId: string };
export async function createSession(s: Session) {
  const t = await new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
  (await cookies()).set("vbm", t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
}
export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get("vbm")?.value; if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key()); const s = { userId: String(payload.userId), orgId: String(payload.orgId) };
    return (await db.membership.findUnique({ where: { userId_orgId: { userId: s.userId, orgId: s.orgId } } })) ? s : null; // revoked members lose access immediately
  } catch { return null; }
}
const rank: Record<Role, number> = { VIEWER: 0, EMPLOYEE: 1, MANAGER: 2, ADMIN: 3, OWNER: 4 };
/** Server-side authorization: verifies live membership in DB, never trusts the cookie's role. */
export async function requireRole(min: Role) {
  const s = await getSession(); if (!s) throw new Response("Unauthorized", { status: 401 });
  const m = await db.membership.findUnique({ where: { userId_orgId: { userId: s.userId, orgId: s.orgId } } });
  if (!m || rank[m.role] < rank[min]) throw new Response("Forbidden", { status: 403 });
  return { ...s, role: m.role };
}
