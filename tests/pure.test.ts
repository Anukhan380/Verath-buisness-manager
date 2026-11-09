import test from "node:test";
import assert from "node:assert/strict";
import { tpl, cond, csvCell } from "../src/lib/pure";
test("template fills nested values and blanks missing ones", () => {
  assert.equal(tpl("Hi {{lead.name}} ({{lead.x}})", { lead: { name: "Ali" } }), "Hi Ali ()");
});
test("conditions", () => {
  const c = { lead: { value: 500, name: "Big Corp" } };
  assert.equal(cond({ field: "lead.value", op: "gt", value: "100" }, c), true);
  assert.equal(cond({ field: "lead.value", op: "lt", value: "100" }, c), false);
  assert.equal(cond({ field: "lead.name", op: "contains", value: "corp" }, c), true);
  assert.equal(cond({ field: "lead.name", op: "eq", value: "Big Corp" }, c), true);
  assert.throws(() => cond({ field: "a", op: "bad", value: "1" }, {}));
});
test("csv escapes quotes and neutralizes formula injection", () => {
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell("=SUM(A1)"), `"'=SUM(A1)"`);
  assert.equal(csvCell(null), '""');
});
