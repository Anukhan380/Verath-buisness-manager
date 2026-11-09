import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api";
import { limitsFor, aiUsed } from "@/lib/usage";
export async function GET() {
  return guard("VIEWER", async (c) => NextResponse.json({ ...(await limitsFor(c.orgId)), aiUsed: await aiUsed(c.orgId), employeesUsed: await db.aiEmployee.count({ where: { orgId: c.orgId } }) }));
}

export const dynamic = "force-dynamic";
