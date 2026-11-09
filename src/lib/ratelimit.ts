// In-memory limiter: protects a single server instance. On serverless it is best-effort; use Upstash/Redis for strict limits.
const hits = new Map<string, { n: number; t: number }>();
export function limited(key: string, max = 10, windowMs = 60000) {
  const now = Date.now(), h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return false; }
  h.n++; return h.n > max;
}
