"use client";
import { useEffect, useState } from "react";
type N = { id: string; type: string; message: string; read: boolean; createdAt: string };
export default function Notifications() {
  const [n, setN] = useState<N[]>([]);
  const load = () => fetch("/api/notifications").then(r => r.ok ? r.json() : []).then(setN);
  useEffect(() => { load(); }, []);
  return <div><h2>Notifications</h2><button onClick={() => fetch("/api/notifications", { method: "PATCH" }).then(load)}>Mark all read</button>{n.map(x => <div key={x.id} className="k" style={{ marginTop: 6, opacity: x.read ? 0.6 : 1 }}><small>{x.type} · {new Date(x.createdAt).toLocaleString()}</small><br />{x.message}</div>)}{!n.length && <p>No notifications yet.</p>}</div>;
}
