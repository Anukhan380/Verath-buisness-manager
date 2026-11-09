import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATALOG } from "@/lib/agents";
import CountUp from "@/components/CountUp";
import Greeting from "@/components/Greeting";
import { Spark, Bars, Ring } from "@/components/charts";
const STAGES: [string, string][] = [["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["NEGOTIATION", "Negotiation"], ["PROPOSAL", "Proposal"], ["WON", "Won"], ["LOST", "Lost"]];
const ago = (d: Date) => { const m = Math.round((Date.now() - d.getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const trend = (cur: number, prev: number) => prev > 0 ? Math.round((cur - prev) / prev * 100) : null;
const runCls: Record<string, string> = { SUCCESS: "ok", FAILED: "er", WAITING_APPROVAL: "wa", RUNNING: "" };
export default async function Dashboard() {
  const s = await getSession(); if (!s) redirect("/login");
  const m = await db.membership.findUnique({ where: { userId_orgId: { userId: s.userId, orgId: s.orgId } }, include: { user: true } }); if (!m) redirect("/login");
  const o = { orgId: m.orgId }, now = new Date(), start = new Date(now.getFullYear(), now.getMonth() - 5, 1), today = now.toISOString().slice(0, 10);
  const [txs, leads, inc, exp, pending, due, projects, members, emps, failed, activeWf, runs, events, aiActs, upcoming] = await Promise.all([
    db.transaction.findMany({ where: { ...o, createdAt: { gte: start } }, select: { type: true, amount: true, createdAt: true } }),
    db.lead.findMany({ where: o, select: { id: true, name: true, status: true, value: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1000 }),
    db.transaction.aggregate({ where: { ...o, type: "INCOME" }, _sum: { amount: true } }), db.transaction.aggregate({ where: { ...o, type: "EXPENSE" }, _sum: { amount: true } }),
    db.task.count({ where: { ...o, status: { not: "DONE" } } }), db.task.count({ where: { ...o, status: { not: "DONE" }, due: { lt: today } } }),
    db.project.count({ where: { ...o, status: "ACTIVE" } }), db.membership.count({ where: o }), db.aiEmployee.findMany({ where: o, orderBy: { createdAt: "asc" } }),
    db.workflowRun.count({ where: { ...o, status: "FAILED" } }), db.workflow.count({ where: { ...o, active: true } }),
    db.workflowRun.findMany({ where: o, orderBy: { createdAt: "desc" }, take: 3, include: { workflow: { select: { name: true } } } }),
    db.auditLog.findMany({ where: o, orderBy: { createdAt: "desc" }, take: 8 }),
    db.auditLog.count({ where: { ...o, OR: [{ action: { startsWith: "ai." } }, { action: { startsWith: "brain." } }] } }),
    db.task.findMany({ where: { ...o, status: { not: "DONE" } }, orderBy: { due: "asc" }, take: 5 }),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => ({ m: key(new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)), inc: 0, exp: 0, leads: 0 }));
  for (const t of txs) { const r = months.find(x => x.m === key(t.createdAt)); if (r) { if (t.type === "INCOME") r.inc += t.amount; else r.exp += t.amount; } }
  for (const l of leads) { const r = months.find(x => x.m === key(l.createdAt)); if (r) r.leads++; }
  const revenue = inc._sum.amount ?? 0, expenses = exp._sum.amount ?? 0, net = revenue - expenses, won = leads.filter(l => l.status === "WON").length, conv = leads.length ? Math.round(won / leads.length * 100) : 0;
  const cur = months[5], prev = months[4], sp = (f: (r: typeof cur) => number) => months.map(f);
  const M: { k: string; label: string; v: number; suf?: string; series?: number[]; tr?: number | null; good?: boolean; sub: React.ReactNode }[] = [
    { k: "revenue", label: "Revenue", v: revenue, series: sp(r => r.inc), tr: trend(cur.inc, prev.inc), good: true, sub: "all time" },
    { k: "expenses", label: "Expenses", v: expenses, series: sp(r => r.exp), tr: trend(cur.exp, prev.exp), good: false, sub: "all time" },
    { k: "net", label: "Net profit", v: net, series: sp(r => r.inc - r.exp), sub: net >= 0 ? "profitable" : "running at a loss" },
    { k: "leads", label: "Leads", v: leads.length, series: sp(r => r.leads), tr: trend(cur.leads, prev.leads), good: true, sub: `${won} won` },
    { k: "conversion", label: "Conversion", v: conv, suf: "%", sub: "won ÷ all leads" },
    { k: "projects", label: "Active projects", v: projects, sub: "in progress" },
    { k: "pending", label: "Pending tasks", v: pending, sub: <span><em data-metric="overdue">{due}</em> overdue</span> },
    { k: "team", label: "Team members", v: members, sub: `${emps.length} AI employees` },
  ];
  const persona = (e: { catalogKey: string | null }) => CATALOG.find(c => c.key === e.catalogKey);
  const stageMax = Math.max(1, ...STAGES.map(([k]) => leads.filter(l => l.status === k).length));
  const checks: [string, boolean][] = [["No overdue tasks", due === 0], ["Profit is positive", net > 0], ["Conversion at least 20%", conv >= 20], ["AI employees hired", emps.length > 0], ["Automations active", activeWf > 0], ["No failed automation runs", failed === 0]];
  const health = Math.round(checks.filter(c => c[1]).length / checks.length * 100);
  const empty = !leads.length && !txs.length && !pending;
  return (<div>
    <Greeting name={m.user.name} />
    <div className="gc hero-c" style={{ marginTop: 16 }}><div className="row" style={{ margin: 0 }}><div><small style={{ display: "flex", gap: 6, alignItems: "center" }}><Sparkles size={14} /> Business overview · computed from your stored data</small>
      <p style={{ margin: "6px 0 0", maxWidth: 780, fontSize: 15 }}>{empty ? "Your workspace is empty. Add your first lead or record income to see live insights here." : `You have ${leads.length} lead${leads.length === 1 ? "" : "s"} (${won} won), ${pending} open task${pending === 1 ? "" : "s"} (${due} overdue), net profit of ${net.toLocaleString("en-US")}, and ${emps.length} AI employee${emps.length === 1 ? "" : "s"} on the team.`}</p></div>
      <Link href="/dashboard/brain" className="gh" style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--bd)", color: "var(--tx)", textDecoration: "none", whiteSpace: "nowrap" }}>Ask the Brain <ArrowRight size={14} style={{ verticalAlign: -2 }} /></Link></div></div>
    {empty && <div className="gc" style={{ marginTop: 14 }}><b>Get started in 3 steps</b><div className="g3" style={{ margin: "12px 0 0" }}>{[["1 · Add your first lead", "/dashboard/crm"], ["2 · Record income or expenses", "/dashboard/finance"], ["3 · Hire an AI employee", "/dashboard/workforce"]].map(([t, h]) => <Link key={h} href={h} className="k hv" style={{ textDecoration: "none", color: "var(--tx)" }}>{t}</Link>)}</div></div>}
    <div className="g4">{M.map(x => <div key={x.k} className="gc metric hv" data-metric={x.k}>
      <div className="lab"><span>{x.label}</span>{x.tr != null && <span className={`tr ${(x.tr >= 0) === x.good ? "up" : "dn"}`}>{x.tr >= 0 ? "+" : ""}{x.tr}% vs last month</span>}</div>
      <b className="val"><CountUp value={x.v} />{x.suf}</b><div className="sub"><span>{x.sub}</span>{x.series && <Spark data={x.series} id={`sp-${x.k}`} color={x.k === "expenses" ? "#f43f5e" : "#6366f1"} />}</div></div>)}</div>
    <div className="g2"><div className="gc"><div className="row"><b>Revenue vs expenses</b><small><span className="dot" style={{ background: "#6366f1" }} />Revenue <span className="dot" style={{ background: "#f43f5e", marginLeft: 8 }} />Expenses · last 6 months</small></div><Bars rows={months} /></div>
      <div className="gc"><b>Sales pipeline</b><div style={{ marginTop: 10 }}>{STAGES.map(([k, l]) => { const c = leads.filter(x => x.status === k); return <div key={k} style={{ marginBottom: 9 }}><div className="row" style={{ marginBottom: 3 }}><small>{l}</small><small>{c.length} · {c.reduce((a, b) => a + b.value, 0).toLocaleString("en-US")}</small></div><div className="hb" style={{ width: `${Math.max(3, c.length / stageMax * 100)}%`, opacity: k === "LOST" ? .5 : 1 }} /></div>; })}</div></div></div>
    <div className="g3">
      <div className="gc"><div className="row"><b>Recent leads</b><Link href="/dashboard/crm"><small>View all</small></Link></div>{leads.slice(0, 5).map(l => <div key={l.id} className="li"><span>{l.name}</span><span className="pill">{l.status.toLowerCase()} · {l.value.toLocaleString("en-US")}</span></div>)}{!leads.length && <small>No leads yet.</small>}</div>
      <div className="gc"><div className="row"><b>Upcoming tasks</b><Link href="/dashboard/projects"><small>View all</small></Link></div>{upcoming.map(t => <div key={t.id} className="li"><span><i className={`dot ${t.due && t.due < today ? "er" : t.priority === "HIGH" ? "wa" : ""}`} />{t.title}</span><small>{t.due ?? "no date"}</small></div>)}{!upcoming.length && <small>Nothing pending. 🎉</small>}</div>
      <div className="gc"><b>Activity</b><div style={{ marginTop: 10 }}>{events.map(e => <div key={e.id} className="tl"><code>{e.action}</code> <small>{ago(e.createdAt)}</small></div>)}{!events.length && <small>No activity yet.</small>}</div></div>
    </div>
    <div className="g3">
      <div className="gc"><div className="row"><b>AI workforce</b><Link href="/dashboard/workforce"><small>Manage</small></Link></div><small>{emps.filter(e => e.status === "ACTIVE").length} of {emps.length} active · {aiActs} AI actions logged · {failed} failed runs</small><div style={{ marginTop: 8 }}>{emps.slice(0, 5).map(e => { const p = persona(e); return <div key={e.id} className="li"><span style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="av2" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15, background: `linear-gradient(135deg,hsl(${p?.hue ?? 260} 80% 60%),hsl(${(p?.hue ?? 260) + 40} 80% 45%))` }}>{p?.emoji ?? "🤖"}</span>{p?.nick ?? e.name}</span><span className={`pill ${e.status === "ACTIVE" ? "ok" : "wa"}`}>{e.status.toLowerCase()}</span></div>; })}{!emps.length && <small>No AI employees hired yet.</small>}</div></div>
      <div className="gc"><div className="row"><b>Automations</b><Link href="/dashboard/automations"><small>Open</small></Link></div><small>{activeWf} active workflow{activeWf === 1 ? "" : "s"}</small>{runs.map(r => <div key={r.id} className="li"><span>{r.workflow.name}</span><span className={`pill ${runCls[r.status] ?? ""}`}>{r.status.toLowerCase().replace("_", " ")}</span></div>)}{!runs.length && <div><small>No runs yet.</small></div>}</div>
      <div className="gc"><b>Business health</b><div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}><Ring pct={health} /><div style={{ fontSize: 12 }}>{checks.map(([t, ok]) => <div key={t}><i className={`dot ${ok ? "ok" : "wa"}`} />{t}</div>)}</div></div><small>Rule-based checks on your data, not an AI prediction.</small></div>
    </div></div>);
}
