import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import FeatureUsageShare from '@/components/dashboard/feature-usage-share';
import LowCreditsUsers from '@/components/dashboard/low-credits-users';
import RecentCredits from '@/components/dashboard/recent-credits';
import RecentGenerations from '@/components/dashboard/recent-generations';
import { SectionCards } from '@/components/dashboard/section-cards';
import StorageUsageCard from '@/components/dashboard/storage-usage-card';
import { getDb } from '@/db';
import {
  aibgHistory,
  creditsTransaction,
  productshotHistory,
  profilePictureHistory,
  stickerHistory,
  user,
  watermarkHistory,
} from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
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
  let featureShare: {
    d7: Record<string, number>;
    d30: Record<string, number>;
    d90: Record<string, number>;
  } = { d7: {}, d30: {}, d90: {} };
  let recentGenerations: Array<{
    id: string;
    type: string;
    label: string;
    url?: string | null;
    userId: string;
    createdAt: Date;
  }> = [];
  let recentCredits: Array<{
    id: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
    userId: string;
  }> = [];
  let storageUsage: {
    totalCount: number;
    totalSize: number;
    d7Count: number;
    d7Size: number;
    d30Count: number;
    d30Size: number;
  } = {
    totalCount: 0,
    totalSize: 0,
    d7Count: 0,
    d7Size: 0,
    d30Count: 0,
    d30Size: 0,
  };
  let lowCredits: Array<{ id: string; email: string; credits: number }> = [];

  try {
    const db = await getDb();
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const usersCount = await db
        .select({ count: sql<number>`CAST(count(*) AS INT)` })
        .from(user);
      totalUsers = Number(usersCount?.[0]?.count ?? 0);
    } catch {}

    try {
      const users30d = await db
        .select({ count: sql<number>`CAST(count(*) AS INT)` })
        .from(user)
        .where(sql`${user.createdAt} >= ${d30.toISOString()}`);
      newUsers30d = Number(users30d?.[0]?.count ?? 0);
    } catch {}

    try {
      // credits used in last 7 days (usage is negative), present positive sum
      const used7d = await db
        .select({
          used: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${creditsTransaction.type} = 'usage' THEN -${creditsTransaction.amount} ELSE 0 END), 0) AS INT)`,
        })
        .from(creditsTransaction)
        .where(sql`${creditsTransaction.created_at} >= ${d7.toISOString()}`);
      creditsUsed7d = Number(used7d?.[0]?.used ?? 0);
    } catch {}

    try {
      // generations total in last 30 days — sum across feature tables
      const [cntAibg] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProduct] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntSticker] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntWatermark] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProfile] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d30.toISOString()}`);
      const nA = Number(cntAibg?.c ?? 0);
      const nP = Number(cntProduct?.c ?? 0);
      const nS = Number(cntSticker?.c ?? 0);
      const nW = Number(cntWatermark?.c ?? 0);
      const nR = Number(cntProfile?.c ?? 0);
      gens30d = nA + nP + nS + nW + nR;
    } catch {}

    try {
      // daily generation counts for chart (90d) — merge across feature tables
      const merge = new Map<string, number>();

      const dailyAibg = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${aibgHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${aibgHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${aibgHistory.createdAt})`);
      for (const r of dailyAibg as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyProduct = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${productshotHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${productshotHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${productshotHistory.createdAt})`);
      for (const r of dailyProduct as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailySticker = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${stickerHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${stickerHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${stickerHistory.createdAt})`);
      for (const r of dailySticker as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyWatermark = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${watermarkHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`);
      for (const r of dailyWatermark as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyProfile = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${profilePictureHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`);
      for (const r of dailyProfile as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const days = Array.from(merge.keys()).sort();
      chartPoints = days.map((day) => ({
        date: day,
        generations: merge.get(day) || 0,
      }));
    } catch {}

    // Feature usage share (counts per feature for 7/30/90 days)
    try {
      const [a7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d7.toISOString()}`);
      const [p7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d7.toISOString()}`);
      const [s7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d7.toISOString()}`);
      const [w7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d7.toISOString()}`);
      const [r7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d7.toISOString()}`);
      featureShare.d7 = {
        aibg: Number(a7?.c || 0),
        productshot: Number(p7?.c || 0),
        sticker: Number(s7?.c || 0),
        watermark: Number(w7?.c || 0),
        profile: Number(r7?.c || 0),
      };

      const [a30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d30.toISOString()}`);
      const [p30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d30.toISOString()}`);
      const [s30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d30.toISOString()}`);
      const [w30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d30.toISOString()}`);
      const [r30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d30.toISOString()}`);
      featureShare.d30 = {
        aibg: Number(a30?.c || 0),
        productshot: Number(p30?.c || 0),
        sticker: Number(s30?.c || 0),
        watermark: Number(w30?.c || 0),
        profile: Number(r30?.c || 0),
      };

      const [a90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d90.toISOString()}`);
      const [p90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d90.toISOString()}`);
      const [s90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d90.toISOString()}`);
      const [w90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d90.toISOString()}`);
      const [r90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d90.toISOString()}`);
      featureShare.d90 = {
        aibg: Number(a90?.c || 0),
        productshot: Number(p90?.c || 0),
        sticker: Number(s90?.c || 0),
        watermark: Number(w90?.c || 0),
        profile: Number(r90?.c || 0),
      };
    } catch {}

    // Recent generations (merge last records from all feature tables)
    try {
      const limit = 20;
      const a = await db
        .select({
          id: aibgHistory.id,
          url: aibgHistory.url,
          label: aibgHistory.style,
          userId: aibgHistory.userId,
          createdAt: aibgHistory.createdAt,
        })
        .from(aibgHistory)
        .orderBy(desc(aibgHistory.createdAt))
        .limit(limit);
      const p = await db
        .select({
          id: productshotHistory.id,
          url: productshotHistory.url,
          label: productshotHistory.scene,
          userId: productshotHistory.userId,
          createdAt: productshotHistory.createdAt,
        })
        .from(productshotHistory)
        .orderBy(desc(productshotHistory.createdAt))
        .limit(limit);
      const s = await db
        .select({
          id: stickerHistory.id,
          url: stickerHistory.url,
          label: stickerHistory.style,
          userId: stickerHistory.userId,
          createdAt: stickerHistory.createdAt,
        })
        .from(stickerHistory)
        .orderBy(desc(stickerHistory.createdAt))
        .limit(limit);
      const w = await db
        .select({
          id: watermarkHistory.id,
          url: watermarkHistory.processedImageUrl,
          label: watermarkHistory.method,
          userId: watermarkHistory.userId,
          createdAt: watermarkHistory.createdAt,
        })
        .from(watermarkHistory)
        .orderBy(desc(watermarkHistory.createdAt))
        .limit(limit);
      const r = await db
        .select({
          id: profilePictureHistory.id,
          url: profilePictureHistory.url,
          label: profilePictureHistory.style,
          userId: profilePictureHistory.userId,
          createdAt: profilePictureHistory.createdAt,
        })
        .from(profilePictureHistory)
        .orderBy(desc(profilePictureHistory.createdAt))
        .limit(limit);
      recentGenerations = [
        ...a.map((x) => ({ ...x, type: 'aibg' })),
        ...p.map((x) => ({ ...x, type: 'productshot' })),
        ...s.map((x) => ({ ...x, type: 'sticker' })),
        ...w.map((x) => ({ ...x, type: 'watermark' })),
        ...r.map((x) => ({ ...x, type: 'profile' })),
      ]
        .sort(
          (x, y) =>
            (y.createdAt?.getTime?.() || 0) - (x.createdAt?.getTime?.() || 0)
        )
        .slice(0, 10);
    } catch {}

    // Recent credits
    try {
      const rows = await db
        .select({
          id: creditsTransaction.id,
          type: creditsTransaction.type,
          amount: creditsTransaction.amount,
          balanceBefore: creditsTransaction.balance_before,
          balanceAfter: creditsTransaction.balance_after,
          createdAt: creditsTransaction.created_at,
          userId: creditsTransaction.user_id,
        })
        .from(creditsTransaction)
        .orderBy(desc(creditsTransaction.created_at))
        .limit(10);
      recentCredits = rows.map((r) => ({
        ...r,
        amount: Number(r.amount || 0),
        balanceBefore: Number(r.balanceBefore || 0),
        balanceAfter: Number(r.balanceAfter || 0),
      }));
    } catch {}

    // Storage usage
    try {
      const { assets } = await import('@/db/schema');
      const [{ c: totalCount = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets);
      const [{ s: totalSize = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets);

      const [{ c: d7Count = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d7.toISOString()}`);
      const [{ s: d7Size = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d7.toISOString()}`);

      const [{ c: d30Count = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d30.toISOString()}`);
      const [{ s: d30Size = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d30.toISOString()}`);

      storageUsage = {
        totalCount: Number(totalCount),
        totalSize: Number(totalSize),
        d7Count: Number(d7Count),
        d7Size: Number(d7Size),
        d30Count: Number(d30Count),
        d30Size: Number(d30Size),
      };
    } catch {}

    // Low credits users (<= 5, top 5)
    try {
      const threshold = 5;
      const rows = await db
        .select({ id: user.id, email: user.email, credits: user.credits })
        .from(user)
        .where(sql`${user.credits} <= ${threshold}`)
        .orderBy(sql`${user.credits} ASC`)
        .limit(5);
      lowCredits = rows.map((r) => ({
        id: r.id,
        email: r.email ?? '',
        credits: Number(r.credits || 0),
      }));
    } catch {}
  } catch (error) {
    // Gracefully degrade on any server/DB failure to keep the page renderable
    // Avoid logging the full error object to prevent noisy RSC console replays in dev
    console.warn(
      'Dashboard metrics unavailable (tables missing or DB offline).'
    );
    totalUsers = 0;
    newUsers30d = 0;
    creditsUsed7d = 0;
    gens30d = 0;
    chartPoints = [];
    featureShare = { d7: {}, d30: {}, d90: {} };
    recentGenerations = [];
    recentCredits = [];
    storageUsage = {
      totalCount: 0,
      totalSize: 0,
      d7Count: 0,
      d7Size: 0,
      d30Count: 0,
      d30Size: 0,
    };
    lowCredits = [];
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
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <FeatureUsageShare totals={featureShare} />
              <StorageUsageCard usage={storageUsage} />
            </div>
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <RecentGenerations items={recentGenerations} />
              <div className="grid grid-rows-2 gap-4">
                <RecentCredits items={recentCredits} />
                <LowCreditsUsers users={lowCredits} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
