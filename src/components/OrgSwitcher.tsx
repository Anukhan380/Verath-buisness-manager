"use client";
import { useEffect, useState } from "react";
export default function OrgSwitcher({ name }: { name: string }) {
  const [d, setD] = useState<{ current: string; orgs: { id: string; name: string; role: string }[] } | null>(null);
  useEffect(() => { fetch("/api/auth/switch").then(r => r.ok ? r.json() : null).then(setD); }, []);
  async function go(orgId: string) { await fetch("/api/auth/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId }) }); location.href = "/dashboard"; }
  return <div className="ws">{d && d.orgs.length > 1 ? <select value={d.current} onChange={e => go(e.target.value)}>{d.orgs.map(o => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}</select> : name}</div>;
}
