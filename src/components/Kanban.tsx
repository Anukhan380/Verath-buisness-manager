"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
type L = { id: string; name: string; status: string; value: number; source: string | null };
const ST: [string, string, string][] = [["NEW", "New", "#64748b"], ["CONTACTED", "Contacted", "#38bdf8"], ["QUALIFIED", "Qualified", "#6366f1"], ["NEGOTIATION", "Negotiation", "#f59e0b"], ["PROPOSAL", "Proposal", "#a78bfa"], ["WON", "Won", "#10b981"], ["LOST", "Lost", "#f43f5e"]];
export default function Kanban() {
  const [ls, setLs] = useState<L[]>([]), [err, setErr] = useState(""), [over, setOver] = useState(""), [busy, setBusy] = useState(true);
  const load = async () => { const r = await fetch("/api/leads"); if (r.ok) setLs(await r.json()); else setErr("Could not load leads"); setBusy(false); };
  useEffect(() => { load(); }, []);
  const send = (id: string, body: object, m = "PATCH") => fetch(`/api/leads/${id}`, { method: m, headers: { "Content-Type": "application/json" }, body: m === "PATCH" ? JSON.stringify(body) : undefined });
  async function move(id: string, status: string) { setLs(x => x.map(l => l.id === id ? { ...l, status } : l)); const r = await send(id, { status }); if (!r.ok) { setErr((await r.json()).error ?? "Not allowed"); load(); } else setErr(""); }
  async function del(id: string) { const r = await send(id, {}, "DELETE"); if (!r.ok) setErr("Only Managers and above can delete leads"); else setErr(""); load(); }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget, b = Object.fromEntries(Object.entries(Object.fromEntries(new FormData(f))).filter(([, v]) => v !== ""));
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); if (r.ok) { f.reset(); setErr(""); load(); } else setErr((await r.json()).error ?? "Failed");
  }
  return (<div><h2>CRM pipeline</h2>
    <form onSubmit={add} className="frm"><input name="name" placeholder="Lead name" required /><input name="source" placeholder="Source" /><input name="value" type="number" step="any" placeholder="Deal value" /><button><Plus size={14} style={{ verticalAlign: -2 }} /> Add lead</button></form>
    {err && <p className="err">{err}</p>}
    {busy ? <div className="skel" style={{ height: 300 }} /> : <div className="kb">{ST.map(([k, l, c]) => { const col = ls.filter(x => x.status === k); return (
      <div key={k} className={`col ${over === k ? "over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(k); }} onDragLeave={() => setOver("")} onDrop={e => { e.preventDefault(); setOver(""); const id = e.dataTransfer.getData("id"); if (id) move(id, k); }}>
        <h4><span><i className="dot" style={{ background: c }} />{l} · {col.length}</span><span>{col.reduce((a, b) => a + b.value, 0).toLocaleString("en-US")}</span></h4>
        {col.map(x => <div key={x.id} className="k lc" draggable onDragStart={e => e.dataTransfer.setData("id", x.id)}><div className="row" style={{ margin: 0 }}><b>{x.name}</b><button className="gh" style={{ padding: "2px 6px" }} onClick={() => del(x.id)} aria-label="Delete"><X size={12} /></button></div><small>{x.source ?? "no source"} · {x.value.toLocaleString("en-US")}</small>
          <select value={x.status} onChange={e => move(x.id, e.target.value)}>{ST.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>)}
        {!col.length && <small style={{ display: "block", textAlign: "center", padding: 18 }}>Drop leads here</small>}</div>); })}</div>}
    <p><small>Drag cards between stages, or use the dropdown on touch screens.</small></p></div>);
}
