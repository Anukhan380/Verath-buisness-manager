"use client";
import { useState } from "react";
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) location.href = "/dashboard"; else setErr((await r.json()).error ?? "Failed");
  }
  return (<form onSubmit={submit} className="card">
    <h1>VERATH BUSINESS MANAGER</h1>
    {mode === "register" && <><input name="name" placeholder="Your name" required /><input name="orgName" placeholder="Business name" required /></>}
    <input name="email" type="email" placeholder="Email" required />
    <input name="password" type="password" placeholder="Password (10+ chars)" required />
    {err && <p className="err">{err}</p>}
    <button>{mode === "login" ? "Sign in" : "Create organization"}</button>
    <a href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "New business? Register" : "Have an account? Sign in"}</a>
  </form>);
}
