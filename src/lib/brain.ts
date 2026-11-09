import { db } from "./db";
import { runAgent } from "./agentRun";
import { CATALOG } from "./agents";
export const BRAIN_TOOLS = ["get_business_summary","list_leads","list_overdue_tasks","create_task","search_knowledge","compare_months","list_ai_employees","delegate_to_employee"];
export const brainEmp = () => ({ id: "brain", name: "AI Business Brain", title: "Central business intelligence", tools: BRAIN_TOOLS,
  instructions: `Today is ${new Date().toISOString().slice(0, 10)}. You help the business owner understand and run the business using ONLY data from tools. For questions about performance or decline, call compare_months and get_business_summary, then explain findings, separate facts from estimates, state what data is missing, and give practical recommendations. To have a specialist do work, call list_ai_employees then delegate_to_employee, and report what the specialist actually returned. Never invent numbers. Transaction and lead dates reflect when they were recorded in this system.` });
const defs: Record<string, object> = {
  compare_months: { description: "Revenue, expenses, new leads and won leads for the last 3 months.", parameters: { type: "object", properties: {} } },
  list_ai_employees: { description: "List hired AI employees and their status.", parameters: { type: "object", properties: {} } },
  delegate_to_employee: { description: "Give a task to an active AI employee by name or nickname (Atlas, Ace, Nova, Kai, Penny, Orbit, Echo, Hana) and return their result. Records a task for tracking.", parameters: { type: "object", properties: { employee_name: { type: "string" }, task: { type: "string" } }, required: ["employee_name", "task"] } },
};
export function brainExtra(orgId: string, userId: string, history: { role: string; content: string }[]) {
  return { defs, history, run: async (name: string, a: Record<string, string>): Promise<unknown> => {
    if (name === "compare_months") {
      const out = [];
      for (let k = 0; k < 3; k++) {
        const d = new Date(); const from = new Date(d.getFullYear(), d.getMonth() - k, 1), to = new Date(d.getFullYear(), d.getMonth() - k + 1, 1), w = { orgId, createdAt: { gte: from, lt: to } };
        const [inc, exp, leads, won] = await Promise.all([db.transaction.aggregate({ where: { ...w, type: "INCOME" }, _sum: { amount: true } }), db.transaction.aggregate({ where: { ...w, type: "EXPENSE" }, _sum: { amount: true } }), db.lead.count({ where: w }), db.lead.count({ where: { ...w, status: "WON" } })]);
        out.push({ month: from.toISOString().slice(0, 7), revenue: inc._sum.amount ?? 0, expenses: exp._sum.amount ?? 0, newLeads: leads, wonLeads: won });
      }
      return out;
    }
    if (name === "list_ai_employees") return db.aiEmployee.findMany({ where: { orgId }, select: { name: true, title: true, status: true } });
    if (name === "delegate_to_employee") {
      const q = String(a.employee_name), cat = CATALOG.find(c => c.nick.toLowerCase() === q.toLowerCase());
      const e = await db.aiEmployee.findFirst({ where: { orgId, status: "ACTIVE", OR: [{ name: { contains: q, mode: "insensitive" } }, ...(cat ? [{ catalogKey: cat.key }] : [])] } });
      if (!e) return { error: "No active AI employee with that name. Hire or resume one first." };
      const r = await runAgent(orgId, userId, e, String(a.task), false);
      const t = await db.task.create({ data: { orgId, title: `Delegated to ${e.name}: ${String(a.task).slice(0, 150)}`, status: "DONE" } });
      await db.auditLog.create({ data: { orgId, actorId: userId, action: "brain.delegated", meta: { employee: e.name, taskId: t.id } } });
      return { employee: e.name, result: r.reply, toolsUsed: r.actions };
    }
    return { error: "Unknown tool" };
  } };
}
