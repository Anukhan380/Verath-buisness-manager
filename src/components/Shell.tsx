"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Brain, Bot, Workflow, Users, Wallet, FolderKanban, UserCog, BarChart3, BookOpen, Bell, Plug, Settings, Search, Sun, Moon, Menu, ChevronsLeft, ChevronsRight, Sparkles, LogOut, type LucideIcon } from "lucide-react";
import OrgSwitcher from "./OrgSwitcher";
type Item = [string, string, LucideIcon];
const NAV: [string, Item[]][] = [
  ["Command", [["Overview", "/dashboard", LayoutDashboard], ["AI Brain", "/dashboard/brain", Brain]]],
  ["Workforce", [["Workforce", "/dashboard/workforce", Bot], ["Automations", "/dashboard/automations", Workflow]]],
  ["Business", [["CRM", "/dashboard/crm", Users], ["Finance", "/dashboard/finance", Wallet], ["Projects", "/dashboard/projects", FolderKanban], ["Team", "/dashboard/team", UserCog]]],
  ["Insight", [["Analytics", "/dashboard/analytics", BarChart3], ["Knowledge", "/dashboard/knowledge", BookOpen], ["Notifications", "/dashboard/notifications", Bell]]],
  ["System", [["Integrations", "/dashboard/integrations", Plug], ["Settings", "/dashboard/settings", Settings]]],
];
export default function Shell({ user, org, role, children }: { user: string; org: string; role: string; children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const [col, setCol] = useState(false), [open, setOpen] = useState(false), [pal, setPal] = useState(false), [menu, setMenu] = useState(false), [unread, setUnread] = useState(0), [theme, setTheme] = useState("dark"), [q, setQ] = useState(""), [sel, setSel] = useState(0);
  useEffect(() => { setCol(localStorage.getItem("vbm-sb") === "1"); setTheme(document.documentElement.dataset.theme ?? "dark"); }, []);
  useEffect(() => { fetch("/api/notifications").then(r => r.ok ? r.json() : []).then((n: { read: boolean }[]) => setUnread(n.filter(x => !x.read).length)); setOpen(false); setMenu(false); }, [path]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal(p => !p); setQ(""); setSel(0); } if (e.key === "Escape") setPal(false); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  const flip = () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); document.documentElement.dataset.theme = t; localStorage.setItem("vbm-theme", t); };
  const out = async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; };
  const toggle = () => { setCol(!col); localStorage.setItem("vbm-sb", col ? "0" : "1"); };
  const items = [...NAV.flatMap(g => g[1]).map(([n, h]) => ({ n: "Go to " + n, run: () => router.push(h) })), { n: "Toggle light / dark theme", run: flip }, { n: "Ask the AI Business Brain", run: () => router.push("/dashboard/brain") }, { n: "Sign out", run: out }];
  const fl = items.filter(i => i.n.toLowerCase().includes(q.toLowerCase()));
  const pick = (i?: { run: () => void }) => { setPal(false); i?.run(); };
  return (<div className="app">
    <aside className={`sb ${col ? "c" : ""} ${open ? "o" : ""}`}>
      <div className="logo"><i className="lg" /><span>VERATH</span></div><OrgSwitcher name={org} />
      {NAV.map(([g, its]) => <div key={g}><div className="gl">{g}</div>{its.map(([n, h, Icon]) => <Link key={h} href={h} className={`ni ${(h === "/dashboard" ? path === h : path.startsWith(h)) ? "on" : ""}`} data-t={n}><Icon size={18} /><span>{n}</span></Link>)}</div>)}
      <button className="cb gh" onClick={toggle} aria-label="Collapse sidebar">{col ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}<span>Collapse</span></button>
    </aside>
    {open && <div className="scrim" onClick={() => setOpen(false)} />}
    <div className="mn">
      <header className="tb">
        <button className="gh ic mob" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
        <button className="gh srch" onClick={() => { setPal(true); setQ(""); setSel(0); }}><Search size={16} /><span>Search or jump to…</span><kbd>Ctrl K</kbd></button><div style={{ flex: 1 }} />
        <Link href="/dashboard/notifications" className="gh ic" aria-label="Notifications" style={{ border: "1px solid var(--bd)", borderRadius: 10 }}><Bell size={18} />{unread > 0 && <i className="badge">{unread}</i>}</Link>
        <button className="gh ic" onClick={flip} aria-label="Toggle theme">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="um"><button className="av" onClick={() => setMenu(!menu)} aria-label="Account">{user[0]}</button>{menu && <div className="pop"><b>{user}</b><small>{role} · {org}</small><button className="gh" onClick={out}><LogOut size={14} style={{ verticalAlign: -2 }} /> Sign out</button></div>}</div>
      </header>
      <main className="main">{children}</main>
    </div>
    {pal && <div className="pal" onClick={() => setPal(false)}><div onClick={e => e.stopPropagation()}><input autoFocus value={q} onChange={e => { setQ(e.target.value); setSel(0); }} placeholder="Type a page or action…" onKeyDown={e => { if (e.key === "ArrowDown") setSel(s => Math.min(s + 1, fl.length - 1)); if (e.key === "ArrowUp") setSel(s => Math.max(s - 1, 0)); if (e.key === "Enter") pick(fl[sel]); }} /><ul>{fl.map((i, k) => <li key={i.n} className={k === sel ? "s" : ""} onMouseEnter={() => setSel(k)} onClick={() => pick(i)}>{i.n}</li>)}{!fl.length && <li>No matches</li>}</ul></div></div>}
    {!path.startsWith("/dashboard/brain") && <Link className="fab" href="/dashboard/brain"><Sparkles size={16} /><span>Ask Brain</span></Link>}
  </div>);
}
