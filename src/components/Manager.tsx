"use client";
import { useEffect, useState } from "react";
type F = { k: string; label: string; type?: string; opts?: string[] };
type Row = Record<string, string | number | null> & { id: string };
export default function Manager({ res, fields, titleKey, statusKey }: { res: string; fields: F[]; titleKey: string; statusKey?: string }) {
  const [rows, setRows] = useState<Row[]>([]); const [err, setErr] = useState("");
  const load = async () => { const r = await fetch(`/api/${res}`); if (r.ok) setRows(await r.json()); else setErr("Could not load"); };
  useEffect(() => { load(); }, []); // eslint-disable-line
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget;
    const body = Object.fromEntries(Object.entries(Object.fromEntries(new FormData(f))).filter(([, v]) => v !== ""));
    const r = await fetch(`/api/${res}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { f.reset(); setErr(""); load(); } else setErr((await r.json()).error ?? "Failed");
  }
  const patch = async (id: string, d: object) => { await fetch(`/api/${res}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); load(); };
  const del = async (id: string) => { const r = await fetch(`/api/${res}/${id}`, { method: "DELETE" }); if (!r.ok) setErr("Not allowed or failed"); load(); };
  const st = fields.find(f => f.k === statusKey);
  return (<div>
    <form onSubmit={add} className="frm">{fields.map(f => f.opts
      ? <select key={f.k} name={f.k}>{f.opts.map(o => <option key={o}>{o}</option>)}</select>
      : f.type === "textarea" ? <textarea key={f.k} name={f.k} placeholder={f.label} rows={3} style={{ width: "100%" }} required />
      : <input key={f.k} name={f.k} type={f.type ?? "text"} step="any" placeholder={f.label} required={f.k === titleKey || f.k === "amount"} />)}<button>Add</button></form>
    {err && <p className="err">{err}</p>}
    {rows.map(r => <div key={r.id} className="k row"><span><b>{r[titleKey]}</b> {fields.filter(f => f.k !== titleKey && f.k !== statusKey && r[f.k]).map(f => <small key={f.k}> · {r[f.k]}</small>)}</span>
      <span>{st && <select value={String(r[statusKey!])} onChange={e => patch(r.id, { [statusKey!]: e.target.value })}>{st.opts!.map(o => <option key={o}>{o}</option>)}</select>} <button onClick={() => del(r.id)}>✕</button></span></div>)}
    {!rows.length && <p>Nothing here yet.</p>}
  </div>);
}
