type CheckResult = { allowed: true } | { allowed: false; retryAfter: number };

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

const memCounters = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<CheckResult> {
  const now = Date.now();
  if (hasUpstash()) {
    // Fixed window: INCR and set EXPIRE NX
    try {
      const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        // Use INCR and set/refresh EXPIRE (no NX for broad compatibility)
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(windowSec)],
        ]),
        cache: 'no-store',
      });
      const data = await resp.json().catch(() => null);
      const current = Number(data?.[0]?.result ?? 0);
      if (!Number.isFinite(current)) throw new Error('bad incr result');
      if (current > max) {
        return { allowed: false, retryAfter: windowSec };
      }
      return { allowed: true };
    } catch {
      // fallthrough to memory
    }
  }

  const rec = memCounters.get(key);
  if (!rec || now >= rec.resetAt) {
    memCounters.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true };
  }
  if (rec.count >= max) {
    const retry = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
    return { allowed: false, retryAfter: retry };
  }
  rec.count += 1;
  return { allowed: true };
}
