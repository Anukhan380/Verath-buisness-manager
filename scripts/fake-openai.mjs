// Local stand-in for the OpenAI API so the AI plumbing (tool calls, limits, delegation) can be tested without a key or cost.
// It does NOT test real model quality. Usage: node scripts/fake-openai.mjs  (port 4010), then set OPENAI_BASE_URL=http://localhost:4010/v1
import http from "node:http";
http.createServer((req, res) => {
  let b = ""; req.on("data", c => b += c); req.on("end", () => {
    const j = JSON.parse(b || "{}"), m = j.messages ?? [], last = m[m.length - 1], names = (j.tools ?? []).map(t => t.function.name);
    const call = (name, args) => ({ role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name, arguments: JSON.stringify(args) } }] });
    let msg; const txt = String(last?.content ?? "").toLowerCase();
    if (last?.role === "tool") msg = { role: "assistant", content: "TOOL_RESULT " + last.content };
    else if (txt.includes("create task") && names.includes("create_task")) msg = call("create_task", { title: "AI created task", priority: "HIGH" });
    else if (txt.includes("delegate") && names.includes("delegate_to_employee")) msg = call("delegate_to_employee", { employee_name: "Sales", task: "review leads" });
    else if (txt.includes("compare") && names.includes("compare_months")) msg = call("compare_months", {});
    else if (txt.includes("faq") && names.includes("search_knowledge")) msg = call("search_knowledge", { query: "refund policy" });
    else if (txt.includes("leads") && names.includes("get_business_summary")) msg = call("get_business_summary", {});
    else if (txt.includes("secret tool") ) msg = call("create_task", { title: "should be blocked" });
    else msg = { role: "assistant", content: "echo: " + txt.slice(0, 80) };
    res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ choices: [{ message: msg }] }));
  });
}).listen(4010, () => console.log("fake openai on 4010"));
