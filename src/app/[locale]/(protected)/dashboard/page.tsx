import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SectionCards } from '@/components/dashboard/section-cards';
import { getTranslations } from 'next-intl/server';
import { getDb } from '@/db';
import {
  aibgHistory,
  productshotHistory,
  stickerHistory,
  watermarkHistory,
  profilePictureHistory,
  creditsTransaction,
  user,
} from '@/db/schema';
import { sql } from 'drizzle-orm';
// Removed demo table data as it is unrelated to dashboard metrics

/**
 * Dashboard page
 *
 * NOTICE: This is a demo page for the dashboard, no real data is used,
 * we will show real data in the future
 */
export default async function DashboardPage() {
  const t = await getTranslations();

  // Gather metrics (RSC)
  let totalUsers = 0;
  let newUsers30d = 0;
  let creditsUsed7d = 0;
  let gens30d = 0;
  let chartPoints: Array<{ date: string; generations: number }> = [];

  try {
    const db = await getDb();
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const usersCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(user);
      totalUsers = usersCount?.[0]?.count ?? 0;
    } catch {}

    try {
      const users30d = await db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(sql`${user.createdAt} >= ${d30.toISOString()}`);
      newUsers30d = users30d?.[0]?.count ?? 0;
    } catch {}

    try {
      // credits used in last 7 days (usage is negative), present positive sum
      const used7d = await db
        .select({
          used: sql<number>`COALESCE(SUM(CASE WHEN ${creditsTransaction.type} = 'usage' THEN -${creditsTransaction.amount} ELSE 0 END), 0)`,
        })
        .from(creditsTransaction)
        .where(sql`${creditsTransaction.created_at} >= ${d7.toISOString()}`);
      creditsUsed7d = used7d?.[0]?.used ?? 0;
    } catch {}

    try {
      // generations total in last 30 days — sum across feature tables
      const [cntAibg] = await db
        .select({ c: sql<number>`count(*)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProduct] = await db
        .select({ c: sql<number>`count(*)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntSticker] = await db
        .select({ c: sql<number>`count(*)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntWatermark] = await db
        .select({ c: sql<number>`count(*)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProfile] = await db
        .select({ c: sql<number>`count(*)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d30.toISOString()}`);
      gens30d =
        (cntAibg?.c ?? 0) +
        (cntProduct?.c ?? 0) +
        (cntSticker?.c ?? 0) +
        (cntWatermark?.c ?? 0) +
        (cntProfile?.c ?? 0);
    } catch {}

    try {
      // daily generation counts for chart (90d) — merge across feature tables
      const merge = new Map<string, number>();

      const dailyAibg = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${aibgHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${aibgHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${aibgHistory.createdAt})`);
      for (const r of dailyAibg as any) merge.set(r.day, (merge.get(r.day) || 0) + (r.cnt || 0));

      const dailyProduct = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${productshotHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${productshotHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${productshotHistory.createdAt})`);
      for (const r of dailyProduct as any) merge.set(r.day, (merge.get(r.day) || 0) + (r.cnt || 0));

      const dailySticker = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${stickerHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${stickerHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${stickerHistory.createdAt})`);
      for (const r of dailySticker as any) merge.set(r.day, (merge.get(r.day) || 0) + (r.cnt || 0));

      const dailyWatermark = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${watermarkHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`);
      for (const r of dailyWatermark as any) merge.set(r.day, (merge.get(r.day) || 0) + (r.cnt || 0));

      const dailyProfile = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${profilePictureHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`);
      for (const r of dailyProfile as any) merge.set(r.day, (merge.get(r.day) || 0) + (r.cnt || 0));

      const days = Array.from(merge.keys()).sort();
      chartPoints = days.map((day) => ({ date: day, generations: merge.get(day) || 0 }));
    } catch {}
  } catch (error) {
    // Gracefully degrade on any server/DB failure to keep the page renderable
    // Avoid logging the full error object to prevent noisy RSC console replays in dev
    console.warn('Dashboard metrics unavailable (tables missing or DB offline).');
    totalUsers = 0;
    newUsers30d = 0;
    creditsUsed7d = 0;
    gens30d = 0;
    chartPoints = [];
  }

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards
              totalUsers={totalUsers}
              newUsers30d={newUsers30d}
              creditsUsed7d={creditsUsed7d}
              gens30d={gens30d}
            />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive data={chartPoints} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
