import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import postgres from 'postgres';

// Load env in priority: .env.local > .env > .env.production
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please populate it in .env.local');
  process.exit(1);
}

const needsSSL =
  process.env.DATABASE_SSL === 'true' || /neon\.tech/i.test(DATABASE_URL);

const sql = postgres(DATABASE_URL, {
  ssl: needsSSL ? 'require' : undefined,
  prepare: false,
});

async function countAll(table: string) {
  try {
    const rows = await sql.unsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM ${table};`
    );
    return Number(rows?.[0]?.count ?? 0);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function countSince(table: string, days: number) {
  try {
    const rows = await sql.unsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM ${table} WHERE created_at >= NOW() - INTERVAL '${days} days';`
    );
    return Number(rows?.[0]?.count ?? 0);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function creditsUsed7d() {
  try {
    const rows = await sql<{ used: string }[]>`
      SELECT COALESCE(SUM(CASE WHEN type = 'usage' THEN -amount ELSE 0 END), 0)::text AS used
      FROM credits_transaction
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `;
    return Number(rows?.[0]?.used ?? 0);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function dailyCounts(table: string, days: number) {
  try {
    const rows = await sql.unsafe<{ day: string; cnt: string }[]>(
      `SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::text AS cnt
       FROM ${table}
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY DATE_TRUNC('day', created_at);`
    );
    return rows.map((r) => ({ day: r.day, cnt: Number(r.cnt) }));
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || '(not set)';
  console.log('Admin email:', adminEmail);
  console.log('SSL enforced:', needsSSL);

  // Totals and windows used by dashboard
  const totalUsers = await countAll('"user"');
  const newUsers30d = await countSince('"user"', 30);
  const used7d = await creditsUsed7d();

  const histTables = [
    'aibg_history',
    'productshot_history',
    'sticker_history',
    'watermark_history',
    'profile_picture_history',
  ];

  const gens30dResults = await Promise.all(
    histTables.map((t) => countSince(t, 30))
  );
  // Narrow to numeric results before summing to satisfy strict type checks during CI builds
  const gens30dNumbers = gens30dResults.filter(
    (v): v is number => typeof v === 'number'
  );
  const gens30d = gens30dNumbers.reduce((sum, v) => sum + v, 0);

  console.log('--- Dashboard metrics (expected) ---');
  console.log('Total Users:', totalUsers);
  console.log('New Users (30d):', newUsers30d);
  console.log('Credits Used (7d):', used7d);
  console.log('Generations (30d):', gens30d);
  histTables.forEach((t, i) => {
    const v = gens30dResults[i];
    console.log(`  - ${t}:`, v);
  });

  // Daily chart merge preview (last 90d)
  const merge = new Map<string, number>();
  for (const t of histTables) {
    const res = await dailyCounts(t, 90);
    if (Array.isArray(res)) {
      for (const r of res) {
        merge.set(r.day, (merge.get(r.day) || 0) + r.cnt);
      }
      console.log(`Daily rows from ${t}:`, res.length);
    } else {
      console.log(`Daily rows from ${t}:`, res);
    }
  }
  const days = Array.from(merge.keys()).sort();
  const preview = days.slice(-10).map((d) => ({ date: d, generations: merge.get(d) || 0 }));
  console.log('--- Chart preview (last 10 days with data) ---');
  for (const p of preview) console.log(p.date, p.generations);

  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
