'use server';

import { getDb } from '@/db';
import { payment, user } from '@/db/schema';
import { findPlanByPriceId } from '@/lib/price-plan';
import { asc, desc, ilike, inArray, or, sql } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create a safe action client
const actionClient = createSafeActionClient();

// Define the schema for getUsers parameters
const getUsersSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
  sorting: z
    .array(
      z.object({
        id: z.string(),
        desc: z.boolean(),
      })
    )
    .optional()
    .default([]),
});

// Define sort field mapping
const sortFieldMap = {
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  role: user.role,
  banned: user.banned,
  customerId: user.customerId,
  banReason: user.banReason,
  banExpires: user.banExpires,
} as const;

// Create a safe action for getting users
export const getUsersAction = actionClient
  .schema(getUsersSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { pageIndex, pageSize, search, sorting } = parsedInput;

      const where = search
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined;

      const offset = pageIndex * pageSize;

      // Get the sort configuration
      const sortConfig = sorting[0];
      const sortField = sortConfig?.id
        ? sortFieldMap[sortConfig.id as keyof typeof sortFieldMap]
        : user.createdAt;
      const sortDirection = sortConfig?.desc ? desc : asc;

      const db = await getDb();
      let [items, [{ count }]] = await Promise.all([
        db
          .select()
          .from(user)
          .where(where)
          .orderBy(sortDirection(sortField))
          .limit(pageSize)
          .offset(offset),
        db.select({ count: sql`count(*)` }).from(user).where(where),
      ]);

      const userIds = items.map((item) => item.id).filter(Boolean);
      const subscriptionPlanByUser = new Map<string, any>();

      if (userIds.length > 0) {
        const paymentRecords = await db
          .select()
          .from(payment)
          .where(inArray(payment.userId, userIds))
          .orderBy(desc(payment.createdAt));

        for (const record of paymentRecords) {
          if (subscriptionPlanByUser.has(record.userId)) {
            continue;
          }

          const planConfig = findPlanByPriceId(record.priceId ?? '');

          subscriptionPlanByUser.set(record.userId, {
            planId: planConfig?.id ?? null,
            planName: planConfig?.name ?? null,
            priceId: record.priceId ?? null,
            status: record.status ?? null,
            interval: record.interval ?? null,
            type: record.type ?? null,
            periodStart: record.periodStart
              ? record.periodStart.toISOString()
              : null,
            periodEnd: record.periodEnd ? record.periodEnd.toISOString() : null,
            cancelAtPeriodEnd: record.cancelAtPeriodEnd ?? null,
            updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
            customerId: record.customerId ?? null,
          });
        }
      }

      // hide user data in demo website
      if (process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true') {
        items = items.map((item) => ({
          ...item,
          name: 'Demo User',
          email: 'example@mksaas.com',
          customerId: 'cus_abcdef123456',
        }));
      }

      const itemsWithPlan = items.map((item) => ({
        ...item,
        subscriptionPlan: subscriptionPlanByUser.get(item.id) ?? null,
      }));

      return {
        success: true,
        data: {
          items: itemsWithPlan,
          total: Number(count),
        },
      };
    } catch (error) {
      console.error('get users error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  });
