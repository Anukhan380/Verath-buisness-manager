"use client";
import { useEffect, useState } from "react";
export default function CountUp({ value }: { value: number }) {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, t0 = 0; const step = (t: number) => { if (!t0) t0 = t; const p = Math.min(1, (t - t0) / 900); setV(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    setV(0); raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{v.toLocaleString("en-US")}</>;
}
