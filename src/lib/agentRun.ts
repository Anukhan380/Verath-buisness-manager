import { db } from "./db";
import { recordAi } from "./usage";
import { TOOL_DEFS, runTool } from "./agents";
type Msg = { role: string; content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[]; tool_call_id?: string };
const RULES = "Rules: never invent business figures; use tools for data; say clearly what is missing; never claim an action happened unless a tool result confirms it; you cannot send emails or messages or access banks.";
async function llm(messages: Msg[], tools: object[]) {
  const r = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", messages, ...(tools.length ? { tools } : {}) }) });
  if (!r.ok) throw new Error(`AI provider error ${r.status}`);
  return (await r.json()).choices[0].message as Msg;
}
export async function runAgent(orgId: string, actorId: string, emp: { id: string; name: string; title: string; instructions: string; tools: string[] }, message: string, save: boolean, extra?: { defs: Record<string, object>; run: (n: string, a: Record<string, string>) => Promise<unknown>; history?: { role: string; content: string }[] }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("AI is not configured (OPENAI_API_KEY missing)");
  await recordAi(orgId);
  const hist = save ? await db.agentMessage.findMany({ where: { employeeId: emp.id }, orderBy: { createdAt: "desc" }, take: 12 }) : [];
  const msgs: Msg[] = [{ role: "system", content: `You are ${emp.name}, ${emp.title}. ${emp.instructions}\n${RULES}` }, ...(extra?.history ?? []), ...hist.reverse().map(m => ({ role: m.role, content: m.content })), { role: "user", content: message }];
  const defs: Record<string, object> = { ...TOOL_DEFS, ...(extra?.defs ?? {}) };
  const tools = emp.tools.filter(t => t in defs).map(t => ({ type: "function", function: { name: t, ...defs[t] } }));
  const actions: { tool: string; ok: boolean }[] = [];
  let out = await llm(msgs, tools);
  for (let i = 0; i < 4 && out.tool_calls?.length; i++) {
    msgs.push(out);
    for (const tc of out.tool_calls) {
      let res: unknown, ok = true;
      try { const args = JSON.parse(tc.function.arguments || "{}"); res = !emp.tools.includes(tc.function.name) ? { error: "Tool not permitted" } : extra && tc.function.name in extra.defs ? await extra.run(tc.function.name, args) : await runTool(orgId, actorId, tc.function.name, args); } catch { res = { error: "Tool failed" }; ok = false; }
      actions.push({ tool: tc.function.name, ok }); msgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(res) });
    }
    out = await llm(msgs, tools);
  }
  const reply = out.content ?? "(no reply)";
  if (save) await db.agentMessage.createMany({ data: [{ orgId, employeeId: emp.id, role: "user", content: message }, { orgId, employeeId: emp.id, role: "assistant", content: reply }] });
  return { reply, actions };
}
