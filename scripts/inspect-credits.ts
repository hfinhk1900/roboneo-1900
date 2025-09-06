import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import postgres from 'postgres';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
const needsSSL = process.env.DATABASE_SSL === 'true' || /neon\.tech/i.test(DATABASE_URL);
const sql = postgres(DATABASE_URL, { ssl: needsSSL ? 'require' : undefined, prepare: false });

async function main() {
  const cols = await sql<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'credits_transaction' ORDER BY ordinal_position;
  `;
  console.log('credits_transaction columns:', cols.map(c => c.column_name).join(', '));
  const has = (c: string) => cols.some(x => x.column_name === c);

  const baseCols = ['id','user_id','type','amount','balance_before','balance_after','created_at'].filter(has);
  const selectList = baseCols.join(', ');
  const rows = await sql.unsafe<any[]>(
    `SELECT ${selectList} FROM credits_transaction WHERE ${has('created_at') ? `created_at >= NOW() - INTERVAL '14 days'` : 'TRUE'} ORDER BY ${has('created_at') ? 'created_at' : 'id'} DESC LIMIT 50;`
  );
  console.log('Recent credits_transaction (last 14 days):', rows.length);
  for (const r of rows) {
    const created = r.created_at || '';
    const type = (r.type || '').toString().padEnd(8);
    const amount = String(r.amount ?? '').padStart(4);
    const before = r.balance_before ?? '';
    const after = r.balance_after ?? '';
    const uid = r.user_id || '';
    console.log(`${created}  ${type}  ${amount}  ${before} -> ${after}  user=${uid}`);
  }
  await sql.end({ timeout: 1 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
