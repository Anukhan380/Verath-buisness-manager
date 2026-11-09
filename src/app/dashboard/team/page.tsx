import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AddMember from "./AddMember";
export default async function Team() {
  const s = await getSession(); if (!s) redirect("/login");
  const ms = await db.membership.findMany({ where: { orgId: s.orgId }, include: { user: true } });
  return <><h2>Team</h2><AddMember />{ms.map(m => <div key={m.id} className="k row"><span><b>{m.user.name}</b> · {m.user.email}</span><span>{m.role}</span></div>)}</>;
}
