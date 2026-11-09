import { db } from "./db";
export const CATALOG = [
  { key: "manager", nick: "Atlas", emoji: "🧭", hue: 245, name: "AI Business Manager", title: "Management", desc: "Reviews business health and recommends actions.", tools: ["get_business_summary","list_leads","list_overdue_tasks","create_task"], ins: "Monitor activity, analyze performance, identify problems and recommend improvements." },
  { key: "sales", nick: "Ace", emoji: "🚀", hue: 215, name: "AI Sales Agent", title: "Sales", desc: "Organizes leads and suggests next best actions.", tools: ["list_leads","get_business_summary","create_task"], ins: "Analyze leads and the pipeline, categorize prospects, suggest follow-ups. Draft messages only; never claim to have sent anything." },
  { key: "marketing", nick: "Nova", emoji: "🎨", hue: 320, name: "AI Marketing Manager", title: "Marketing", desc: "Campaign ideas and content plans.", tools: ["get_business_summary","create_task"], ins: "Create marketing strategies and content calendars. Never claim content was published." },
  { key: "support", nick: "Kai", emoji: "🎧", hue: 170, name: "AI Support Agent", title: "Customer Support", desc: "Drafts replies and categorizes requests.", tools: ["search_knowledge","create_task"], ins: "Draft customer replies using search_knowledge for approved information. Without a knowledge base, say you lack approved FAQs rather than inventing policy." },
  { key: "finance", nick: "Penny", emoji: "🪙", hue: 40, name: "AI Finance Assistant", title: "Finance", desc: "Summarizes recorded transactions.", tools: ["get_business_summary","create_task"], ins: "Summarize only manually recorded transactions. You have no bank access; never imply you do." },
  { key: "ops", nick: "Orbit", emoji: "⚙️", hue: 265, name: "AI Operations Manager", title: "Operations", desc: "Finds bottlenecks and overdue work.", tools: ["list_overdue_tasks","get_business_summary","create_task"], ins: "Track deadlines, find bottlenecks and recommend process improvements." },
  { key: "research", nick: "Echo", emoji: "🔭", hue: 190, name: "AI Research Analyst", title: "Research", desc: "Analyzes information you supply.", tools: ["get_business_summary","search_knowledge"], ins: "Analyze information the user supplies. You have no web access yet; say so if asked to browse." },
  { key: "hr", nick: "Hana", emoji: "🌸", hue: 345, name: "AI HR Assistant", title: "Administration", desc: "Job descriptions and onboarding checklists.", tools: ["create_task"], ins: "Draft job descriptions and onboarding checklists. Employment decisions stay with humans." },
];
export const TOOL_DEFS: Record<string, object> = {
  get_business_summary: { description: "Counts of leads/tasks plus recorded revenue and expenses.", parameters: { type: "object", properties: {} } },
  list_leads: { description: "List leads, optionally by status.", parameters: { type: "object", properties: { status: { type: "string" } } } },
  list_overdue_tasks: { description: "List open tasks past their due date.", parameters: { type: "object", properties: {} } },
  search_knowledge: { description: "Search the business knowledge base (policies, FAQs, product info).", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  create_task: { description: "Create a task (internal, reversible).", parameters: { type: "object", properties: { title: { type: "string" }, due: { type: "string", description: "YYYY-MM-DD" }, priority: { type: "string", enum: ["LOW","MEDIUM","HIGH"] } }, required: ["title"] } },
};
export async function runTool(orgId: string, actorId: string, name: string, a: Record<string, string>) {
  const today = new Date().toISOString().slice(0, 10);
  if (name === "get_business_summary") {
    const [leads, won, open, overdue, inc, exp] = await Promise.all([db.lead.count({ where: { orgId } }), db.lead.count({ where: { orgId, status: "WON" } }), db.task.count({ where: { orgId, status: { not: "DONE" } } }), db.task.count({ where: { orgId, status: { not: "DONE" }, due: { lt: today } } }), db.transaction.aggregate({ where: { orgId, type: "INCOME" }, _sum: { amount: true } }), db.transaction.aggregate({ where: { orgId, type: "EXPENSE" }, _sum: { amount: true } })]);
    return { leads, won, openTasks: open, overdueTasks: overdue, revenue: inc._sum.amount ?? 0, expenses: exp._sum.amount ?? 0 };
  }
  if (name === "list_leads") return db.lead.findMany({ where: { orgId, ...(a.status ? { status: a.status } : {}) }, select: { name: true, status: true, source: true, value: true }, take: 50 });
  if (name === "list_overdue_tasks") return db.task.findMany({ where: { orgId, status: { not: "DONE" }, due: { lt: today } }, select: { title: true, due: true, priority: true }, take: 50 });
  if (name === "search_knowledge") {
    const terms = String(a.query ?? "").split(/\s+/).filter(w => w.length > 2).slice(0, 6);
    if (!terms.length) return { results: [] };
    const docs = await db.kbDoc.findMany({ where: { orgId, OR: terms.flatMap(t => [{ title: { contains: t, mode: "insensitive" as const } }, { content: { contains: t, mode: "insensitive" as const } }]) }, take: 5 });
    return { results: docs.map(d => ({ title: d.title, excerpt: d.content.slice(0, 800) })), note: docs.length ? "Keyword match, verify relevance" : "No matching documents" };
  }
  if (name === "create_task") {
    const t = await db.task.create({ data: { orgId, title: String(a.title).slice(0, 200), due: a.due ?? null, priority: ["LOW","MEDIUM","HIGH"].includes(a.priority) ? a.priority : "MEDIUM" } });
    await db.auditLog.create({ data: { orgId, actorId, action: "ai.task_created", meta: { id: t.id } } });
    return { created: true, id: t.id };
  }
  return { error: "Unknown tool" };
}
