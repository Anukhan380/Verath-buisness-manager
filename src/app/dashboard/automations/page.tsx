"use client";
import { useEffect, useState } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
const TYPES = ["CONDITION","CREATE_TASK","AI_EMPLOYEE","NOTIFY","APPROVAL"];
export default function Automations() {
  const [wfs, setWfs] = useState<any[]>([]), [runs, setRuns] = useState<any[]>([]), [emps, setEmps] = useState<any[]>([]), [nodes, setNodes] = useState<any[]>([]), [name, setName] = useState(""), [trigger, setTrigger] = useState("MANUAL"), [note, setNote] = useState("");
  const load = async () => { const [a, b] = await Promise.all([fetch("/api/workflows"), fetch("/api/workforce")]); if (a.ok) { const d = await a.json(); setWfs(d.workflows); setRuns(d.runs); } if (b.ok) setEmps((await b.json()).employees); };
  useEffect(() => { load(); }, []);
  const post = async (url: string, m: string, body?: object) => { const r = await fetch(url, { method: m, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) }); const d = await r.json().catch(() => ({})); setNote(r.ok ? "" : d.error ?? "Failed"); load(); return r.ok; };
  const add = (type: string) => setNodes(n => [...n, type === "CONDITION" ? { type, field: "lead.value", op: "gt", value: "0" } : type === "CREATE_TASK" ? { type, title: "Follow up with {{lead.name}}", priority: "MEDIUM" } : type === "AI_EMPLOYEE" ? { type, employeeId: emps[0]?.id ?? "", prompt: "" } : type === "NOTIFY" ? { type, message: "" } : { type }]);
  const set = (i: number, k: string, v: string) => setNodes(n => n.map((x, j) => j === i ? { ...x, [k]: v } : x));
  async function save() { if (await post("/api/workflows", "POST", { name, trigger, nodes })) { setNodes([]); setName(""); } }
  return (<div><h2>Automations</h2>{note && <p className="err">{note}</p>}
    <h3>Build a workflow</h3>
    <div className="frm"><input value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name" /><select value={trigger} onChange={e => setTrigger(e.target.value)}><option>MANUAL</option><option>LEAD_CREATED</option><option>DAILY</option></select></div>
    <div className="k"><b>Trigger: {trigger}</b>{nodes.map((n, i) => <div key={i}><div className="conn" /><div className="k node" data-t={n.type}><div className="row"><b>{n.type}</b><button onClick={() => setNodes(x => x.filter((_, j) => j !== i))}>✕</button></div>
      {n.type === "CONDITION" && <div className="frm"><input value={n.field} onChange={e => set(i, "field", e.target.value)} /><select value={n.op} onChange={e => set(i, "op", e.target.value)}>{["eq","gt","lt","contains"].map(o => <option key={o}>{o}</option>)}</select><input value={n.value} onChange={e => set(i, "value", e.target.value)} /></div>}
      {n.type === "CREATE_TASK" && <input value={n.title} onChange={e => set(i, "title", e.target.value)} style={{ width: "100%" }} />}
      {n.type === "AI_EMPLOYEE" && <div className="frm"><select value={n.employeeId} onChange={e => set(i, "employeeId", e.target.value)}>{emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><input value={n.prompt} onChange={e => set(i, "prompt", e.target.value)} placeholder="Instruction (use {{lead.name}})" style={{ flex: 1 }} /></div>}
      {n.type === "NOTIFY" && <input value={n.message} onChange={e => set(i, "message", e.target.value)} placeholder="Message" style={{ width: "100%" }} />}
    </div></div>)}
      <div className="frm" style={{ marginTop: 8 }}>{TYPES.map(t => <button key={t} onClick={() => add(t)}>+ {t}</button>)}</div></div>
    <button onClick={save} disabled={!name || !nodes.length}>Save workflow</button>
    <h3>Workflows</h3>{wfs.map(w => <div key={w.id} className="k row"><span><b>{w.name}</b> <small>· {w.trigger} · {(w.nodes as any[]).length} steps · {w.active ? "ACTIVE" : "inactive"}</small></span><span><button onClick={() => post(`/api/workflows/${w.id}`, "POST", { action: "run", data: { test: true, lead: { name: "Test Lead", value: 100 } } })}>Test run</button> <button onClick={() => post("/api/workflows", "PATCH", { id: w.id, active: !w.active })}>{w.active ? "Deactivate" : "Activate"}</button> <button onClick={() => post(`/api/workflows?id=${w.id}`, "DELETE")}>✕</button></span></div>)}
    {!wfs.length && <p>No workflows yet.</p>}
    <h3>Execution history</h3>{runs.map(r => <div key={r.id} className="k"><div className="row"><b className={r.status === "FAILED" ? "err" : ""}>{r.status}</b><span><small>{new Date(r.createdAt).toLocaleString()}</small> {r.status === "WAITING_APPROVAL" && <button onClick={() => post(`/api/workflows/${r.workflowId}`, "POST", { action: "approve", runId: r.id })}>Approve</button>} {r.status === "FAILED" && <button onClick={() => post(`/api/workflows/${r.workflowId}`, "POST", { action: "retry", runId: r.id })}>Retry</button>}</span></div>{(r.log as any[]).map((l, i) => <div key={i}><small>{l.ok ? "✓" : "✗"} {l.type}: {l.note}</small></div>)}</div>)}
  </div>);
}
