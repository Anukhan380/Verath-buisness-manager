"use client";
import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, XCircle } from "lucide-react";
type M = { role: string; content: string };
type Act = { tool: string; ok: boolean };
type Emp = { id: string; catalogKey: string | null; status: string };
type Cat = { key: string; nick: string; emoji: string };
const IDEAS = ["Analyze my business performance.", "Find problems in my sales pipeline.", "Prepare my daily business report.", "Ask my sales agent to follow up with leads."];
const TOOL: Record<string, string> = { get_business_summary: "Business summary", list_leads: "Leads", list_overdue_tasks: "Overdue tasks", create_task: "Created a task", compare_months: "Month comparison", search_knowledge: "Knowledge base", list_ai_employees: "AI employees", delegate_to_employee: "Delegated to an AI employee" };
function Typed({ text, animate }: { text: string; animate: boolean }) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => { if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; } let i = 0; const id = setInterval(() => { i += Math.max(2, Math.ceil(text.length / 80)); setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(id); }, 16); return () => clearInterval(id); }, [text, animate]);
  return <>{text.slice(0, n)}</>;
}
export default function Brain() {
  const [msgs, setMsgs] = useState<M[]>([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false), [note, setNote] = useState(""), [acts, setActs] = useState<Act[]>([]), [fresh, setFresh] = useState(-1), [team, setTeam] = useState<{ n: string; e: string }[]>([]), end = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/brain").then(r => r.ok ? r.json() : []).then(setMsgs); fetch("/api/workforce").then(r => r.ok ? r.json() : null).then((d: { catalog: Cat[]; employees: Emp[] } | null) => d && setTeam(d.employees.filter(e => e.status === "ACTIVE").map(e => { const c = d.catalog.find(x => x.key === e.catalogKey); return { n: c?.nick ?? "Custom", e: c?.emoji ?? "🤖" }; }))); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  async function send(m: string) {
    if (!m.trim() || busy) return; setBusy(true); setTxt(""); setNote(""); setActs([]); setMsgs(x => [...x, { role: "user", content: m }]);
    const r = await fetch("/api/brain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m }) }); const d = await r.json(); setBusy(false);
    if (!r.ok) { setNote(d.error ?? "Failed"); return; }
    setActs(d.actions ?? []); setMsgs(x => { setFresh(x.length); return [...x, { role: "assistant", content: d.reply }]; });
  }
  return (<div style={{ maxWidth: 900, margin: "0 auto" }}>
    <div className="gc hero-c"><div style={{ display: "flex", gap: 14, alignItems: "center" }}><div className="orb" /><div><h2 style={{ margin: 0 }}>AI Business Brain</h2><small><i className="dot ok" />Online · answers from your live business data</small></div></div>
      <div style={{ marginTop: 12 }}>{["Leads", "Finance", "Tasks", "Knowledge base", "Workforce"].map(c => <span key={c} className="chip">{c}</span>)}{team.length > 0 && <span style={{ marginLeft: 8 }}><small>Connected: </small>{team.map(t => <span key={t.n} className="chip">{t.e} {t.n}</span>)}</span>}</div></div>
    {!msgs.length && <div className="sug">{IDEAS.map(i => <button key={i} onClick={() => send(i)}>{i}</button>)}</div>}
    <div className="chat">{msgs.map((m, i) => <div key={i} className={`bub ${m.role === "user" ? "u" : "a"}`}>{m.role === "assistant" ? <Typed text={m.content} animate={i === fresh} /> : m.content}</div>)}
      {busy && <div className="bub a"><span className="typing"><span /><span /><span /></span> <small>Thinking and checking your data…</small></div>}
      {acts.length > 0 && <div className="k">{acts.map((a, i) => <span key={i} className={`pill ${a.ok ? "ok" : "er"}`} style={{ marginRight: 6 }}>{a.ok ? <CheckCircle2 size={11} style={{ verticalAlign: -1 }} /> : <XCircle size={11} style={{ verticalAlign: -1 }} />} {TOOL[a.tool] ?? a.tool}</span>)}<div><small>Tools actually executed for this answer.</small></div></div>}
      {note && <p className="err">{note}</p>}<div ref={end} /></div>
    <form onSubmit={e => { e.preventDefault(); send(txt); }} className="frm" style={{ position: "sticky", bottom: 14 }}><input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Ask anything about your business…" style={{ flex: 1, minWidth: 0, padding: 14, background: "var(--sf)" }} /><button disabled={busy} aria-label="Send"><Send size={16} /></button></form>
    <small>The reply appears progressively; the model returns the complete answer first.</small></div>);
}
