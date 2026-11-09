import { db } from "./db";
export const PLAN_LIMITS = { STARTER: { ai: 200, employees: 3 }, PROFESSIONAL: { ai: 2000, employees: 10 }, ENTERPRISE: { ai: 20000, employees: 50 } } as const;
export async function limitsFor(orgId: string) {
  const o = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  return { plan: o?.plan ?? "STARTER", ...PLAN_LIMITS[(o?.plan ?? "STARTER") as keyof typeof PLAN_LIMITS] };
}
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
export const aiUsed = (orgId: string) => db.usageEvent.count({ where: { orgId, kind: "ai_call", createdAt: { gte: monthStart() } } });
export async function recordAi(orgId: string) {
  const [lim, used] = await Promise.all([limitsFor(orgId), aiUsed(orgId)]);
  if (used >= lim.ai) throw new Error(`Monthly AI limit reached (${lim.ai}) on the ${lim.plan} plan`);
  await db.usageEvent.create({ data: { orgId, kind: "ai_call" } });
}
