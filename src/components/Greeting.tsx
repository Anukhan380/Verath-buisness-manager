"use client";
import { useEffect, useState } from "react";
export default function Greeting({ name }: { name: string }) {
  const [g, setG] = useState("Welcome back"), [d, setD] = useState("");
  useEffect(() => { const h = new Date().getHours(); setG(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"); setD(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })); }, []);
  return <div><small>{d || "\u00a0"}</small><h2 className="hero">{`${g}, ${name}.`}</h2><p className="mu" style={{ margin: 0 }}>Here&apos;s what&apos;s happening across your business today.</p></div>;
}
