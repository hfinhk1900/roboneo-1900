type Entry =
  | { status: 'pending' }
  | { status: 'success'; response: any };

const memStore = new Map<string, { value: Entry; expiresAt: number }>();
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function memCleanup(now = Date.now()) {
  for (const [k, v] of memStore.entries()) {
    if (v.expiresAt <= now) memStore.delete(k);
  }
}

export function makeIdempotencyKey(route: string, userId: string, key: string) {
  return `${route}::${userId}::${key}`;
}

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function upstashPipeline(commands: string[][]): Promise<any[] | null> {
  try {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Upstash REST pipeline expects a top-level JSON array of commands
      body: JSON.stringify(commands),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function getIdempotencyEntry(
  key: string
): Promise<Entry | undefined> {
  if (hasUpstash()) {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(
      key
    )}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        cache: 'no-store',
      });
      if (!res.ok) return undefined;
      const data = await res.json().catch(() => null);
      const val = data?.result as string | null;
      if (!val) return undefined;
      return JSON.parse(val) as Entry;
    } catch {
      return undefined;
    }
  }
  memCleanup();
  return memStore.get(key)?.value;
}

export async function setPending(key: string, ttlMs = DEFAULT_TTL_MS) {
  if (hasUpstash()) {
    const ttlSec = Math.ceil(ttlMs / 1000);
    const entry: Entry = { status: 'pending' };
    await upstashPipeline([
      ['SET', key, JSON.stringify(entry), 'EX', String(ttlSec), 'NX'],
    ]);
    return;
  }
  memCleanup();
  memStore.set(key, { value: { status: 'pending' }, expiresAt: Date.now() + ttlMs });
}

export async function setSuccess(
  key: string,
  response: any,
  ttlMs = DEFAULT_TTL_MS
) {
  if (hasUpstash()) {
    const ttlSec = Math.ceil(ttlMs / 1000);
    const entry: Entry = { status: 'success', response };
    await upstashPipeline([
      ['SET', key, JSON.stringify(entry), 'EX', String(ttlSec)],
    ]);
    return;
  }
  memCleanup();
  memStore.set(key, {
    value: { status: 'success', response },
    expiresAt: Date.now() + ttlMs,
  });
}

export async function clearKey(key: string) {
  if (hasUpstash()) {
    await upstashPipeline([['DEL', key]]);
    return;
  }
  memStore.delete(key);
}
