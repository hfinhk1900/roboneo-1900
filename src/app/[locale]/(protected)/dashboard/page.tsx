import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SectionCards } from '@/components/dashboard/section-cards';
import { getTranslations } from 'next-intl/server';
import { getDb } from '@/db';
import { ailogHistory, creditsTransaction, user } from '@/db/schema';
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
      // generations total in last 30 days
      const gens = await db
        .select({ gens: sql<number>`count(*)` })
        .from(ailogHistory)
        .where(
          sql`${ailogHistory.created_at} >= ${d30.toISOString()} AND ${ailogHistory.status} = 'success'`
        );
      gens30d = gens?.[0]?.gens ?? 0;
    } catch {}

    try {
      // daily generation counts for chart (90d to support filters)
      const daily = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${ailogHistory.created_at}), 'YYYY-MM-DD')`,
          cnt: sql<number>`count(*)`,
        })
        .from(ailogHistory)
        .where(
          sql`${ailogHistory.created_at} >= ${d90.toISOString()} AND ${ailogHistory.status} = 'success'`
        )
        .groupBy(sql`date_trunc('day', ${ailogHistory.created_at})`)
        .orderBy(sql`date_trunc('day', ${ailogHistory.created_at})`);

      chartPoints = daily.map((r) => ({ date: r.day, generations: r.cnt }));
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
