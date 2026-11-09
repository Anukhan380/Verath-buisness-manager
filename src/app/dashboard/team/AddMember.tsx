"use client";
import { useState } from "react";
export default function AddMember() {
  const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget;
    const r = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
    if (r.ok) location.reload(); else setMsg((await r.json()).error ?? "Failed");
  }
  return <form onSubmit={go} className="frm"><input name="email" type="email" placeholder="Registered user email" required /><select name="role">{["ADMIN","MANAGER","EMPLOYEE","VIEWER"].map(r => <option key={r}>{r}</option>)}</select><button>Add to team</button>{msg && <span className="err">{msg}</span>}</form>;
}
