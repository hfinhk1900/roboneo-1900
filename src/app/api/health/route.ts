import { getDb } from '@/db';
import { user } from '@/db/schema';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import { clearKey, getIdempotencyEntry, setPending } from '@/lib/idempotency';
import { checkRateLimit } from '@/lib/rate-limit';
import { type NextRequest, NextResponse } from 'next/server';

function present(name: string): boolean {
  return Boolean(process.env[name]);
}

function collectMissing(names: string[]) {
  return names.filter((n) => !present(n));
}

export async function GET(_req: NextRequest) {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // 1) Env readiness (non-throwing)
  const requiredEnv = [
    'URL_SIGNING_SECRET',
    'STORAGE_REGION',
    'STORAGE_ENDPOINT',
    'STORAGE_ACCESS_KEY_ID',
    'STORAGE_SECRET_ACCESS_KEY',
    'STORAGE_BUCKET_NAME',
  ];
  const missingRequired = collectMissing(requiredEnv);

  const upstashPresent =
    present('UPSTASH_REDIS_REST_URL') && present('UPSTASH_REDIS_REST_TOKEN');

  // 2) DB check
  let dbOk = false;
  let dbError: string | undefined;
  try {
    const db = await getDb();
    // Minimal query
    await db.select({ id: user.id }).from(user).limit(1);
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  // 3) Rate limit + Upstash connectivity (best-effort)
  let rlOk = false;
  try {
    const { generatePerUserPerMin } = getRateLimitConfig();
    const check = await checkRateLimit('health:rl', generatePerUserPerMin, 60);
    rlOk = !!check.allowed;
  } catch {
    rlOk = false;
  }

  // 4) Idempotency storage check (best-effort)
  let idemOk = false;
  const idemKey = 'health:idem';
  try {
    await setPending(idemKey, 5_000);
    const entry = await getIdempotencyEntry(idemKey);
    idemOk = !!entry;
  } catch {
    idemOk = false;
  } finally {
    try {
      await clearKey(idemKey);
    } catch {}
  }

  const result = {
    status:
      missingRequired.length > 0 || !dbOk
        ? 'error'
        : rlOk && idemOk
          ? 'ok'
          : 'degraded',
    node_env: nodeEnv,
    signing: { configured: present('URL_SIGNING_SECRET') },
    storage: {
      configured:
        present('STORAGE_REGION') &&
        present('STORAGE_ENDPOINT') &&
        present('STORAGE_ACCESS_KEY_ID') &&
        present('STORAGE_SECRET_ACCESS_KEY') &&
        present('STORAGE_BUCKET_NAME'),
      public_url_present: present('STORAGE_PUBLIC_URL'),
    },
    db: { ok: dbOk, error: dbError },
    upstash: {
      present: upstashPresent,
      rate_limit_ok: rlOk,
      idempotency_ok: idemOk,
    },
    rate_limits: getRateLimitConfig(),
    missing_required_env: missingRequired,
  } as const;

  return NextResponse.json(result, { status: 200 });
}
