import { NextResponse } from "next/server";
import { guard, table, audit } from "@/lib/api";
import { csvCell } from "@/lib/pure";
import { RES, ResKey } from "@/lib/resources";
const OK = ["leads", "transactions", "tasks"];
export async function GET(_: Request, ctx: { params: Promise<{ res: string }> }) {
  const params = await ctx.params;
  if (!OK.includes(params.res) || !(params.res in RES)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return guard("MANAGER", async (c) => {
    const rows = await table(params.res as ResKey).findMany({ where: { orgId: c.orgId }, orderBy: { createdAt: "desc" }, take: 5000 });
    const cols = rows.length ? Object.keys(rows[0]).filter(k => k !== "orgId") : ["id"];
    const csv = [cols.join(","), ...rows.map((r: Record<string, unknown>) => cols.map(k => csvCell(r[k])).join(","))].join("\n");
    await audit(c.orgId, c.userId, "export.csv", { res: params.res });
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${params.res}.csv"` } });
  });
}
