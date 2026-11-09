import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
export async function GET() { return guard("VIEWER", async (c) => NextResponse.json(await db.notification.findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" }, take: 50 }))); }
export async function PATCH() { return guard("VIEWER", async (c) => { await db.notification.updateMany({ where: { orgId: c.orgId, read: false }, data: { read: true } }); return NextResponse.json({ ok: true }); }); }

export const dynamic = "force-dynamic";
