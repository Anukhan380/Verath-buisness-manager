import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
export default async function L({ children }: { children: React.ReactNode }) {
  const s = await getSession(); if (!s) redirect("/login");
  const m = await db.membership.findUnique({ where: { userId_orgId: { userId: s.userId, orgId: s.orgId } }, include: { user: true, org: true } });
  if (!m) redirect("/login");
  return <Shell user={m.user.name} org={m.org.name} role={m.role}>{children}</Shell>;
}
