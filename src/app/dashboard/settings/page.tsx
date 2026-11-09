"use client";
import { useEffect, useState } from "react";
export default function Settings() {
  const [u, setU] = useState<{ plan: string; ai: number; employees: number; aiUsed: number; employeesUsed: number } | null>(null);
  useEffect(() => { fetch("/api/usage").then(r => r.ok ? r.json() : null).then(setU); }, []);
  return <div><h2>Plan and usage</h2>{u ? <div className="grid"><div className="k"><small>Plan</small><b>{u.plan}</b></div><div className="k"><small>AI calls this month</small><b>{u.aiUsed} / {u.ai}</b></div><div className="k"><small>AI employees</small><b>{u.employeesUsed} / {u.employees}</b></div></div> : <p>Loading…</p>}<p><small>Limits are enforced on the server. Payment processing is not connected; plans change only by database update until a billing provider is added.</small></p></div>;
}
