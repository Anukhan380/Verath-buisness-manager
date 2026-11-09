/* eslint-disable @typescript-eslint/no-explicit-any */
export const get = (o: any, p: string) => p.split(".").reduce((x: any, k) => x?.[k], o);
export const tpl = (s: string, ctx: any) => String(s ?? "").replace(/\{\{([\w.]+)\}\}/g, (_, p) => String(get(ctx, p) ?? ""));
export function cond(n: { field: string; op: string; value: string }, ctx: any) {
  const v = get(ctx, n.field), t = n.value;
  if (n.op === "eq") return String(v) === String(t);
  if (n.op === "gt") return Number(v) > Number(t);
  if (n.op === "lt") return Number(v) < Number(t);
  if (n.op === "contains") return String(v ?? "").toLowerCase().includes(String(t).toLowerCase());
  throw new Error("Unknown operator");
}
export const csvCell = (v: unknown) => { let s = v instanceof Date ? v.toISOString() : String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
