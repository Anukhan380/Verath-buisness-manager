import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function Analytics() {
  const s = await getSession(); if (!s) redirect("/login");
  const rows = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(), from = new Date(d.getFullYear(), d.getMonth() - k, 1), to = new Date(d.getFullYear(), d.getMonth() - k + 1, 1), w = { orgId: s.orgId, createdAt: { gte: from, lt: to } };
    const [i, e, l, won] = await Promise.all([db.transaction.aggregate({ where: { ...w, type: "INCOME" }, _sum: { amount: true } }), db.transaction.aggregate({ where: { ...w, type: "EXPENSE" }, _sum: { amount: true } }), db.lead.count({ where: w }), db.lead.count({ where: { ...w, status: "WON" } })]);
    rows.push({ m: from.toISOString().slice(0, 7), inc: i._sum.amount ?? 0, exp: e._sum.amount ?? 0, leads: l, won });
  }
  const max = Math.max(1, ...rows.map(r => Math.max(r.inc, r.exp)));
  return <><h2>Analytics</h2><p><small>Based on the date records were entered. Last 6 months.</small></p>
    {rows.map(r => <div key={r.m} className="k" style={{ marginBottom: 6 }}><div className="row"><b>{r.m}</b><small>{r.leads} leads · {r.won} won</small></div>
      <div style={{ background: "#3b6cf6", height: 8, width: `${r.inc / max * 100}%` }} /> <small>Revenue {r.inc}</small>
      <div style={{ background: "#d6455d", height: 8, width: `${r.exp / max * 100}%` }} /> <small>Expenses {r.exp}</small></div>)}
    <h3>Export (Manager+)</h3><p><a href="/api/export/leads">Leads CSV</a> · <a href="/api/export/transactions">Transactions CSV</a> · <a href="/api/export/tasks">Tasks CSV</a></p></>;
}
