"use client";
import { useState } from "react";
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { location.href = "/dashboard"; return; }
      const d = await r.json().catch(() => null);
      setErr(d?.error ?? `Server error (${r.status}). Open /api/health on this site to see what is wrong.`);
    } catch { setErr("Could not reach the server. Check your connection."); }
    setBusy(false);
  }
  return (<form onSubmit={submit} className="card">
    <h1>VERATH BUSINESS MANAGER</h1>
    {mode === "register" && <><input name="name" placeholder="Your name" required /><input name="orgName" placeholder="Business name" required /></>}
    <input name="email" type="email" placeholder="Email" required />
    <input name="password" type="password" placeholder="Password (10+ chars)" required />
    {err && <p className="err">{err}</p>}
    <button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create organization"}</button>
    <a href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "New business? Register" : "Have an account? Sign in"}</a>
  </form>);
}
