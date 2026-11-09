import { z } from "zod";
const opt = z.string().max(300).optional().nullable();
export const RES = {
  leads: { model: "lead", schema: z.object({ name: z.string().min(1).max(120), email: opt, phone: opt, source: opt, status: z.enum(["NEW","CONTACTED","QUALIFIED","NEGOTIATION","PROPOSAL","WON","LOST"]).optional(), value: z.coerce.number().min(0).optional() }) },
  transactions: { model: "transaction", schema: z.object({ type: z.enum(["INCOME","EXPENSE"]), category: z.string().min(1).max(80), amount: z.coerce.number().positive(), note: opt }) },
  projects: { model: "project", schema: z.object({ name: z.string().min(1).max(120), description: opt, status: z.enum(["ACTIVE","ON_HOLD","DONE"]).optional() }) },
  kb: { model: "kbDoc", schema: z.object({ title: z.string().min(1).max(160), content: z.string().min(1).max(20000) }) },
  tasks: { model: "task", schema: z.object({ title: z.string().min(1).max(200), status: z.enum(["TODO","DOING","DONE"]).optional(), priority: z.enum(["LOW","MEDIUM","HIGH"]).optional(), due: opt, projectId: opt }) },
} as const;
export type ResKey = keyof typeof RES;
