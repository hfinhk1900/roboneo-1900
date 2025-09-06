import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DataTable } from '@/components/dashboard/data-table';
import { SectionCards } from '@/components/dashboard/section-cards';
import { getTranslations } from 'next-intl/server';
import { getDb } from '@/db';
import { aibgHistory, ailogHistory, creditsTransaction, user } from '@/db/schema';
import { and, eq, gte, ilike, sql } from 'drizzle-orm';
import data from './data.json';

/**
 * Dashboard page
 *
 * NOTICE: This is a demo page for the dashboard, no real data is used,
 * we will show real data in the future
 */
export default async function DashboardPage() {
  const t = await getTranslations();

  // Gather metrics (RSC)
  const db = await getDb();
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [{ count: totalUsers } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user);

  const [{ count: newUsers30d } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(sql`${user.createdAt} >= ${d30}`);

  // credits used in last 7 days (usage is negative), present positive sum
  const [{ used: creditsUsed7d } = { used: 0 }] = await db
    .select({ used: sql<number>`COALESCE(SUM(CASE WHEN ${creditsTransaction.type} = 'usage' THEN -${creditsTransaction.amount} ELSE 0 END), 0)` })
    .from(creditsTransaction)
    .where(sql`${creditsTransaction.created_at} >= ${d7}`);

  // generations total in last 30 days
  const [{ gens: gens30d } = { gens: 0 }] = await db
    .select({ gens: sql<number>`count(*)` })
    .from(ailogHistory)
    .where(sql`${ailogHistory.created_at} >= ${d30} AND ${ailogHistory.status} = 'success'`);

  // daily generation counts for chart (30d)
  const daily = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${ailogHistory.created_at}), 'YYYY-MM-DD')`,
      cnt: sql<number>`count(*)`,
    })
    .from(ailogHistory)
    .where(sql`${ailogHistory.created_at} >= ${d30} AND ${ailogHistory.status} = 'success'`)
    .groupBy(sql`date_trunc('day', ${ailogHistory.created_at})`)
    .orderBy(sql`date_trunc('day', ${ailogHistory.created_at})`);

  const chartPoints = daily.map((r) => ({ date: r.day, desktop: r.cnt, mobile: 0 }));

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
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </>
  );
}
