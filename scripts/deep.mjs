// Deeper end-to-end checks: roles, modules, AI tools, limits, workflows. Needs the app running (and scripts/fake-openai.mjs + OPENAI_BASE_URL for the AI checks).
const BASE = process.env.BASE_URL ?? "http://localhost:3000"; let fails = 0, n = 0;
const T = (name, c, x = "") => { n++; console.log(`${c ? "PASS" : "FAIL"}  ${name} ${c ? "" : "-> " + String(x).slice(0, 200)}`); if (!c) fails++; };
function client() { let cookie = ""; const f = async (path, o = {}) => {
  const r = await fetch(BASE + path, { method: o.method ?? "GET", headers: { "Content-Type": "application/json", cookie: f.cookie ?? cookie }, body: o.body ? JSON.stringify(o.body) : undefined, redirect: "manual" });
  const sc = r.headers.getSetCookie?.() ?? []; if (sc.length) cookie = sc.map(c => c.split(";")[0]).join("; ");
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {} return { status: r.status, j, t }; }; f.setCookie = c => { f.cookie = c; }; return f; }
const id = Math.random().toString(36).slice(2, 7);
const mk = async tag => { const c = client(); c.email = `${tag}-${id}@t.dev`; const r = await c("/api/auth/register", { method: "POST", body: { name: tag, email: c.email, password: "correct-horse-1", orgName: "Org " + tag } }); if (r.status !== 200) console.log("register failed", tag, r.status); return c; };
const A = await mk("owner"), orgA = (await A("/api/auth/switch")).j.current;
const join = async (tag, role) => { const c = await mk(tag); const r = await A("/api/team", { method: "POST", body: { email: c.email, role } }); const s = await c("/api/auth/switch", { method: "POST", body: { orgId: orgA } }); T(`${tag} joins org as ${role}`, r.status === 200 && s.status === 200, r.status + "/" + s.status); return c; };
const V = await join("viewer", "VIEWER"), E = await join("employee", "EMPLOYEE"), M = await join("manager", "MANAGER"), F = await join("admin", "ADMIN");
const orgs = await V("/api/auth/switch"); T("user belongs to 2 orgs and can list them", orgs.j.orgs.length === 2 && orgs.j.current === orgA);
// roles
const l1 = (await A("/api/leads", { method: "POST", body: { name: "Role Lead", value: 100 } })).j;
T("viewer can read", (await V("/api/leads")).status === 200); T("viewer cannot create", (await V("/api/leads", { method: "POST", body: { name: "x" } })).status === 403);
T("viewer cannot edit", (await V(`/api/leads/${l1.id}`, { method: "PATCH", body: { name: "x" } })).status === 403);
const l2 = (await E("/api/leads", { method: "POST", body: { name: "Emp Lead", value: 50 } })).j; T("employee can create", !!l2?.id);
T("employee can edit (status persists)", (await E(`/api/leads/${l2.id}`, { method: "PATCH", body: { status: "QUALIFIED" } })).status === 200 && (await E("/api/leads")).j.find(x => x.id === l2.id).status === "QUALIFIED");
T("PATCH does not reset other fields", (await E("/api/leads")).j.find(x => x.id === l2.id).value === 50);
T("employee cannot delete", (await E(`/api/leads/${l2.id}`, { method: "DELETE" })).status === 403);
T("manager can delete", (await M(`/api/leads/${l2.id}`, { method: "DELETE" })).status === 200 && !(await M("/api/leads")).j.some(x => x.id === l2.id));
T("employee cannot create workflow", (await E("/api/workflows", { method: "POST", body: { name: "nope", trigger: "MANUAL", nodes: [{ type: "APPROVAL" }] } })).status === 403);
T("viewer cannot hire AI", (await V("/api/workforce", { method: "POST", body: { catalogKey: "sales" } })).status === 403);
T("manager cannot hire AI (admin only)", (await M("/api/workforce", { method: "POST", body: { catalogKey: "sales" } })).status === 403);
T("admin can hire AI", (await F("/api/workforce", { method: "POST", body: { catalogKey: "sales" } })).status === 200);
T("admin cannot grant ADMIN", (await F("/api/team", { method: "POST", body: { email: V.email, role: "ADMIN" } })).status === 403);
T("admin cannot change the owner", (await F("/api/team", { method: "POST", body: { email: A.email, role: "VIEWER" } })).status === 403);
T("owner cannot be demoted even by owner", (await A("/api/team", { method: "POST", body: { email: A.email, role: "VIEWER" } })).status === 403);
T("viewer cannot export", (await V("/api/export/leads")).status === 403);
T("tampered cookie rejected", await (async () => { const x = client(); x.setCookie("vbm=garbage"); return (await x("/api/leads")).status === 401; })());
T("dashboard redirects when signed out", (await client()("/dashboard")).status >= 300);
// finance + dashboard
await A("/api/transactions", { method: "POST", body: { type: "INCOME", category: "Sales", amount: 1000 } }); await A("/api/transactions", { method: "POST", body: { type: "EXPENSE", category: "Rent", amount: 400 } });
const yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const proj = (await A("/api/projects", { method: "POST", body: { name: "Proj" } })).j; T("project saved", !!proj?.id);
const tk = (await A("/api/tasks", { method: "POST", body: { title: "Late task", due: yday } })).j;
const dash = async () => (await A("/dashboard")).t; let h = await dash();
T("dashboard net profit = 600 from DB", /data-metric="net"[\s\S]*?<b class="val">600</.test(h));
T("dashboard shows 1 overdue task", /data-metric="overdue"[^>]*>1</.test(h));
await A(`/api/tasks/${tk.id}`, { method: "PATCH", body: { status: "DONE" } }); h = await dash(); T("completing the task clears overdue", /data-metric="overdue"[^>]*>0</.test(h));
for (const p of ["crm", "finance", "projects", "team", "workforce", "automations", "brain", "knowledge", "notifications", "analytics", "integrations", "settings"]) { const r = await A("/dashboard/" + p); if (r.status !== 200) T("page /dashboard/" + p, false, r.status); } T("all 12 dashboard pages render (200)", true);
T("analytics page shows data", (await A("/dashboard/analytics")).t.includes("Revenue"));
await A("/api/leads", { method: "POST", body: { name: "=1+1", value: 1 } }); const csv = await A("/api/export/leads"); T("CSV export neutralizes formulas", csv.t.includes(`"'=1+1"`) && csv.t.startsWith("id,"));
T("duplicate email rejected", (await client()("/api/auth/register", { method: "POST", body: { name: "dup", email: A.email, password: "correct-horse-1", orgName: "Dup" } })).status === 409);
// notifications
const nt = (await A("/api/notifications")).j; T("notifications exist for new leads", nt.some(x => x.type === "new_lead"));
await A("/api/notifications", { method: "PATCH" }); T("mark all read works", (await A("/api/notifications")).j.every(x => x.read));
// knowledge + AI
await A("/api/kb", { method: "POST", body: { title: "Refund policy", content: "Refunds within 14 days of purchase." } });
const emps = (await A("/api/workforce")).j.employees; const sales = emps.find(e => e.catalogKey === "sales");
await A("/api/workforce", { method: "POST", body: { catalogKey: "research" } }); await A("/api/workforce", { method: "POST", body: { catalogKey: "support" } });
T("4th AI employee blocked by Starter plan limit", (await A("/api/workforce", { method: "POST", body: { catalogKey: "ops" } })).status === 402);
const all = (await A("/api/workforce")).j.employees; const research = all.find(e => e.catalogKey === "research"), support = all.find(e => e.catalogKey === "support");
const chat = (e, m, who = A) => who(`/api/workforce/${e.id}/chat`, { method: "POST", body: { message: m } });
const leadCount = (await A("/api/leads")).j.length; let r = await chat(sales, "how many leads do I have?");
T("AI used get_business_summary tool", r.j?.actions?.[0]?.tool === "get_business_summary", JSON.stringify(r.j)); T("AI tool returned the real lead count", new RegExp(`"leads":${leadCount}[,}]`).test(r.j?.reply ?? ""), r.j?.reply);
r = await chat(sales, "please create task now"); T("AI create_task really created a task in DB", (await A("/api/tasks")).j.some(t => t.title === "AI created task") && r.j?.actions?.[0]?.ok === true);
T("AI action appears in audit log on dashboard", (await dash()).includes("ai.task_created"));
r = await chat(research, "secret tool"); T("AI cannot use a tool it was not given", !(await A("/api/tasks")).j.some(t => t.title === "should be blocked") && /not permitted/i.test(r.j?.reply ?? ""), r.j?.reply);
r = await chat(support, "what does the faq say?"); T("support agent retrieves knowledge base content", /Refunds within 14 days/.test(r.j?.reply ?? ""), r.j?.reply);
T("chat history saved", (await A(`/api/workforce/${sales.id}/chat`)).j.length >= 4);
T("viewer cannot chat with AI", (await chat(sales, "hi", V)).status === 403);
await A("/api/workforce", { method: "PATCH", body: { id: sales.id, status: "PAUSED" } }); T("paused AI employee refuses work (409)", (await chat(sales, "hi")).status === 409);
await A("/api/workforce", { method: "PATCH", body: { id: sales.id, status: "ACTIVE" } });
let b = await A("/api/brain", { method: "POST", body: { message: "compare months" } }); T("Brain compare_months tool returns monthly data", /"revenue":1000/.test(b.j?.reply ?? ""), b.j?.reply);
b = await A("/api/brain", { method: "POST", body: { message: "delegate this" } });
T("Brain delegated to Sales agent and reported result", /AI Sales Agent/.test(b.j?.reply ?? "") && /get_business_summary/.test(b.j?.reply ?? ""), b.j?.reply); T("delegation recorded a tracking task", (await A("/api/tasks")).j.some(t => t.title.startsWith("Delegated to AI Sales Agent")));
T("Brain history persisted", (await A("/api/brain")).j.length >= 4); T("another org cannot read Brain history", ((await (await mk("spy"))("/api/brain")).j ?? []).length === 0);
// workflows
const wf = async (name, trigger, nodes, active = false) => { const w = (await A("/api/workflows", { method: "POST", body: { name, trigger, nodes } })).j; if (active) await A("/api/workflows", { method: "PATCH", body: { id: w.id, active: true } }); return w; };
const tasks = async () => (await A("/api/tasks")).j.map(t => t.title); const runs = async () => (await A("/api/workflows")).j.runs;
const big = await wf("big leads", "LEAD_CREATED", [{ type: "CONDITION", field: "lead.value", op: "gt", value: "1000" }, { type: "CREATE_TASK", title: "Big lead {{lead.name}}" }, { type: "NOTIFY", message: "Whale {{lead.name}}" }], true);
await A("/api/leads", { method: "POST", body: { name: "Whale", value: 5000 } }); await A("/api/leads", { method: "POST", body: { name: "Tiny", value: 10 } });
let ts = await tasks(); T("LEAD_CREATED trigger fired for big lead with templated title", ts.includes("Big lead Whale")); T("condition blocked the small lead", !ts.includes("Big lead Tiny"));
T("NOTIFY step created a notification", (await A("/api/notifications")).j.some(x => x.type === "workflow_notify" && x.message === "Whale Whale"));
await A("/api/workflows", { method: "PATCH", body: { id: big.id, active: false } }); await A("/api/leads", { method: "POST", body: { name: "Whale2", value: 9000 } }); T("deactivated workflow does not fire", !(await tasks()).includes("Big lead Whale2"));
const ai = await wf("ai step", "MANUAL", [{ type: "AI_EMPLOYEE", employeeId: sales.id, prompt: "please create task now" }]);
await A(`/api/workflows/${ai.id}`, { method: "POST", body: { action: "run" } }); let rr = (await runs()).find(x => x.workflowId === ai.id);
T("workflow AI step ran the agent with tools", rr.status === "SUCCESS" && /TOOL_RESULT/.test(JSON.stringify(rr.log)), JSON.stringify(rr)); 
const rt = await wf("retry", "MANUAL", [{ type: "CREATE_TASK", title: "Once only" }, { type: "AI_EMPLOYEE", employeeId: research.id, prompt: "hello" }]);
await A("/api/workforce", { method: "PATCH", body: { id: research.id, status: "PAUSED" } }); await A(`/api/workflows/${rt.id}`, { method: "POST", body: { action: "run" } });
rr = (await runs()).find(x => x.workflowId === rt.id); T("run fails when AI employee paused (FAILED, error stored)", rr.status === "FAILED" && /paused/.test(rr.error ?? ""));
T("failure produced a notification", (await A("/api/notifications")).j.some(x => x.type === "workflow_failed"));
await A("/api/workforce", { method: "PATCH", body: { id: research.id, status: "ACTIVE" } }); await A(`/api/workflows/${rt.id}`, { method: "POST", body: { action: "retry", runId: rr.id } });
T("retry succeeds", (await runs()).filter(x => x.workflowId === rt.id).some(x => x.status === "SUCCESS")); T("retry resumed at failed step (no duplicate task)", (await tasks()).filter(t => t === "Once only").length === 1);
T("cannot retry a successful run", (await A(`/api/workflows/${rt.id}`, { method: "POST", body: { action: "retry", runId: (await runs()).find(x => x.workflowId === rt.id && x.status === "SUCCESS").id } })).status === 409);
const daily = await wf("daily", "DAILY", [{ type: "CREATE_TASK", title: "Daily job" }], true);
T("cron rejects missing secret", (await client()("/api/cron/daily")).status === 401);
const cr = await fetch(BASE + "/api/cron/daily", { headers: { authorization: "Bearer " + (process.env.CRON_SECRET ?? "cron-secret-xyz") } }); T("cron with secret runs DAILY workflows", cr.status === 200 && (await tasks()).includes("Daily job"));
T("invalid workflow definition rejected", (await A("/api/workflows", { method: "POST", body: { name: "bad", trigger: "MANUAL", nodes: [{ type: "HACK" }] } })).status === 400);
// plan limit on AI + auth
const u = (await A("/api/usage")).j; T("usage counts AI calls", u.aiUsed > 5 && u.plan === "STARTER", JSON.stringify(u));
let hit = 0; for (let i = 0; i < 260 && !hit; i++) { const x = await A("/api/brain", { method: "POST", body: { message: "hi" } }); if (x.status === 429) hit = i; }
T("AI stops at the monthly plan limit with a clear message", hit > 0 && /Monthly AI limit/.test((await A("/api/brain", { method: "POST", body: { message: "hi" } })).j?.error ?? ""), "hit=" + hit);
const lg = client(); T("wrong password rejected", (await lg("/api/auth/login", { method: "POST", body: { email: A.email, password: "wrong-password" } })).status === 401);
T("correct password logs in", (await lg("/api/auth/login", { method: "POST", body: { email: A.email, password: "correct-horse-1" } })).status === 200 && (await lg("/api/leads")).status === 200);
await lg("/api/auth/logout", { method: "POST" }); T("logout ends the session", (await lg("/api/leads")).status === 401);
let rl = 0; for (let i = 0; i < 30 && !rl; i++) if ((await client()("/api/auth/login", { method: "POST", body: { email: "x@y.z", password: "p" } })).status === 429) rl = i; T("login rate limit kicks in", rl > 0);
console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
