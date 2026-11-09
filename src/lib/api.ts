import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { requireRole } from "./auth";
import { db } from "./db";
import { RES, ResKey } from "./resources";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const table = (k: ResKey): any => (db as any)[RES[k].model];
export async function guard(min: Role, fn: (c: { userId: string; orgId: string; role: Role }) => Promise<Response>) {
  try { return await fn(await requireRole(min)); } catch (e) { if (e instanceof Response) return e; console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
export const audit = (orgId: string, actorId: string, action: string, meta?: Prisma.InputJsonValue) => db.auditLog.create({ data: { orgId, actorId, action, meta } });
