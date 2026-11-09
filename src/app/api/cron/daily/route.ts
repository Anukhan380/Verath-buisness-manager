import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startRun } from "@/lib/engine";
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const wfs = await db.workflow.findMany({ where: { trigger: "DAILY", active: true } }); let failed = 0;
  for (const w of wfs) { try { await startRun(w, { date: new Date().toISOString().slice(0, 10) }); } catch { failed++; } }
  return NextResponse.json({ ran: wfs.length, failed });
}

export const maxDuration = 60;
