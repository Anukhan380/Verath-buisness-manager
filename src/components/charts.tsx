export function Spark({ data, id, color = "#6366f1" }: { data: number[]; id: string; color?: string }) {
  const w = 110, h = 34, max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => [i * (w / Math.max(1, data.length - 1)), h - 4 - ((v - min) / r) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".4" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} /><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}
export function Bars({ rows }: { rows: { m: string; inc: number; exp: number }[] }) {
  const W = 620, H = 230, pad = 28, max = Math.max(1, ...rows.flatMap(r => [r.inc, r.exp])), bw = (W - pad * 2) / rows.length;
  return <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Revenue and expenses by month"><defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
    {[0, 1, 2, 3].map(i => <line key={i} x1={pad} x2={W - pad} y1={20 + i * 48} y2={20 + i * 48} stroke="currentColor" opacity=".1" />)}
    {rows.map((r, i) => { const x = pad + i * bw, hi = (r.inc / max) * 150, he = (r.exp / max) * 150; return <g key={r.m}><rect className="bar" style={{ animationDelay: `${i * 80}ms` }} x={x + bw * .17} y={170 - hi} width={bw * .28} height={hi} rx="5" fill="url(#gi)" /><rect className="bar" style={{ animationDelay: `${i * 80 + 40}ms` }} x={x + bw * .5} y={170 - he} width={bw * .28} height={he} rx="5" fill="#f43f5e" opacity=".8" /><text x={x + bw / 2} y={200} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".6">{r.m.slice(5)}/{r.m.slice(2, 4)}</text></g>; })}</svg>;
}
export function Ring({ pct }: { pct: number }) {
  const c = 2 * Math.PI * 38;
  return <svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" opacity=".12" strokeWidth="9" /><circle cx="48" cy="48" r="38" fill="none" stroke="url(#rg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 48 48)" /><defs><linearGradient id="rg"><stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs><text x="48" y="54" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{pct}%</text></svg>;
}
