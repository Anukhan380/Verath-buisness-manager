"use client";
import { useEffect, useState } from "react";
import { Plus, X, Send, Pause, Play, Trash2 } from "lucide-react";
type Cat = { key: string; nick: string; emoji: string; hue: number; name: string; title: string; desc: string; tools: string[] };
type Emp = { id: string; catalogKey: string | null; name: string; title: string; instructions: string; tools: string[]; status: string };
type Msg = { role: string; content: string };
const av = (h: number) => `linear-gradient(135deg,hsl(${h} 85% 62%),hsl(${h + 45} 85% 45%))`;
const TL = (t: string) => t.replace(/_/g, " ");
export default function Workforce() {
  const [cat, setCat] = useState<Cat[]>([]), [emps, setEmps] = useState<Emp[]>([]), [ai, setAi] = useState(true), [sel, setSel] = useState<Emp | null>(null), [msgs, setMsgs] = useState<Msg[]>([]), [txt, setTxt] = useState(""), [note, setNote] = useState(""), [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const load = async () => { const r = await fetch("/api/workforce"); if (r.ok) { const d = await r.json(); setCat(d.catalog); setEmps(d.employees); setAi(d.aiConfigured); } setReady(true); };
  useEffect(() => { load(); }, []);
  const P = (e: Emp) => cat.find(c => c.key === e.catalogKey);
  const call = async (m: string, body?: object, q = "") => { const r = await fetch("/api/workforce" + q, { method: m, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) }); setNote(r.ok ? "" : (await r.json()).error ?? "Failed"); load(); };
  async function open(e: Emp) { setSel(e); setMsgs([]); const r = await fetch(`/api/workforce/${e.id}/chat`); if (r.ok) setMsgs(await r.json()); }
  async function send(ev: React.FormEvent) {
    ev.preventDefault(); if (!sel || !txt.trim()) return; setBusy(true); const m = txt; setTxt(""); setMsgs(x => [...x, { role: "user", content: m }]);
    const r = await fetch(`/api/workforce/${sel.id}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m }) }); const d = await r.json(); setBusy(false);
    if (!r.ok) { setNote(d.error ?? "Failed"); return; } setNote(d.actions.length ? "Tools used: " + d.actions.map((a: { tool: string }) => TL(a.tool)).join(", ") : "");
    setMsgs(x => [...x, { role: "assistant", content: d.reply }]);
  }
  const active = emps.filter(e => e.status === "ACTIVE").length, hired = new Set(emps.map(e => e.catalogKey));
  return (<div><h2>AI Workforce</h2>
    <div className="g4" style={{ marginTop: 0 }}>{[["Hired", emps.length], ["Active", active], ["Paused", emps.length - active], ["Marketplace", cat.length]].map(([l, v]) => <div key={l} className="gc metric"><div className="lab">{l}</div><b className="val">{v}</b></div>)}</div>
    {!ai && <p className="err">AI is not configured yet: set OPENAI_API_KEY (OpenRouter keys work too) so your employees can respond.</p>}
    {note && <p className="err">{note}</p>}
    <h3>Your team</h3>
    {!ready ? <div className="skel" /> : <div className="ecg">{emps.map(e => { const p = P(e); return <div key={e.id} className="gc hv ec"><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div className="av2" style={{ background: av(p?.hue ?? 260), fontSize: 22 }}>{p?.emoji ?? "🤖"}</div><div style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{p?.nick ?? e.name}</b><br /><small>{e.name}</small></div><span className={`pill ${e.status === "ACTIVE" ? "ok" : "wa"}`}><i className={`dot ${e.status === "ACTIVE" ? "ok" : "wa"}`} />{e.status === "ACTIVE" ? "Active" : "Paused"}</span></div>
      <div>{e.tools.map(t => <span key={t} className="chip">{TL(t)}</span>)}</div>
      <div className="row" style={{ margin: 0 }}><button onClick={() => open(e)}>Open workspace</button><span><button title={e.status === "ACTIVE" ? "Pause" : "Resume"} onClick={() => call("PATCH", { id: e.id, status: e.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{e.status === "ACTIVE" ? <Pause size={14} /> : <Play size={14} />}</button> <button title="Delete" onClick={() => call("DELETE", undefined, `?id=${e.id}`)}><Trash2 size={14} /></button></span></div></div>; })}
      {!emps.length && <div className="gc"><b>No one hired yet</b><p className="mu">Pick someone from the marketplace below. Every employee can only use the tools listed on their card.</p></div>}</div>}
    <h3>Marketplace</h3>
    <div className="ecg">{cat.map(c => <div key={c.key} className="gc hv ec"><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div className="av2" style={{ background: av(c.hue), fontSize: 22 }}>{c.emoji}</div><div style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{c.nick}</b><br /><small>{c.name}</small></div><span className="pill">{c.title}</span></div><p className="mu" style={{ margin: 0 }}>{c.desc}</p>
      <div>{c.tools.map(t => <span key={t} className="chip">{TL(t)}</span>)}</div><button disabled={hired.has(c.key)} onClick={() => call("POST", { catalogKey: c.key })}>{hired.has(c.key) ? "Hired ✓" : <><Plus size={14} style={{ verticalAlign: -2 }} /> Hire {c.nick}</>}</button></div>)}</div>
    {sel && <aside className="dr"><div className="row"><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div className="av2" style={{ background: av(P(sel)?.hue ?? 260), fontSize: 22 }}>{P(sel)?.emoji ?? "🤖"}</div><div><b style={{ fontSize: 17 }}>{P(sel)?.nick ?? sel.name}</b><br /><small>{sel.title}</small></div></div><button className="gh" onClick={() => setSel(null)} aria-label="Close"><X size={16} /></button></div>
      <h3>Responsibilities</h3><p className="mu" style={{ marginTop: 0 }}>{sel.instructions}</p><h3>Connected tools</h3><div>{sel.tools.map(t => <span key={t} className="chip">{TL(t)}</span>)}</div>
      <h3>Chat</h3><div className="chat">{msgs.map((m, i) => <div key={i} className={`bub ${m.role === "user" ? "u" : "a"}`}>{m.content}</div>)}{busy && <div className="bub a"><span className="typing"><span /><span /><span /></span></div>}{!msgs.length && !busy && <small>Say hi, or give {P(sel)?.nick ?? "them"} a task.</small>}</div>
      <form onSubmit={send} className="frm"><input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Give a task or ask a question" style={{ flex: 1, minWidth: 0 }} /><button disabled={busy} aria-label="Send"><Send size={16} /></button></form></aside>}
  </div>);
}
