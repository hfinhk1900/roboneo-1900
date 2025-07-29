'use server';

import { getDb } from '@/db';
import { user } from '@/db/schema';
import { getSession } from '@/lib/server';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { createCustomerPortal } from '@/payment';
import type { CreatePortalParams } from '@/payment/types';
import { eq } from 'drizzle-orm';
import { getLocale } from 'next-intl/server';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { payment } from '@/db/schema';

// Create a safe action client
const actionClient = createSafeActionClient();

// Portal schema for validation
const portalSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),
  returnUrl: z
    .string()
    .url({ message: 'Return URL must be a valid URL' })
    .optional(),
});

/**
 * Create a customer portal session
 */
export const createPortalAction = actionClient
  .schema(portalSchema)
  .action(async ({ parsedInput }) => {
    const { userId, returnUrl } = parsedInput;

    // Get the current user session for authorization
    const session = await getSession();
    if (!session) {
      console.warn(
        `unauthorized request to create portal session for user ${userId}`
      );
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Only allow users to create their own portal session
    if (session.user.id !== userId) {
      console.warn(
        `current user ${session.user.id} is not authorized to create portal session for user ${userId}`
      );
      return {
        success: false,
        error: 'Not authorized to do this action',
      };
    }

    try {
      // Get the current locale from the request
      const locale = await getLocale();

      // Get the user's customer ID from the database
      const db = await getDb();
      const customerResult = await db
        .select({ customerId: user.customerId })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      console.log(`查询用户 ${session.user.id} 的客户ID结果:`, customerResult);

      if (customerResult.length <= 0 || !customerResult[0].customerId) {
        console.error(`未找到用户 ${session.user.id} 的客户ID`);

        // 检查用户是否有任何支付记录
        const paymentResults = await db
          .select()
          .from(payment)
          .where(eq(payment.userId, session.user.id))
          .limit(1);

        console.log(`用户 ${session.user.id} 的支付记录:`, paymentResults);

        if (paymentResults.length > 0) {
          // 用户有支付记录但没有客户ID，尝试更新用户的客户ID
          const stripeCustomerId = paymentResults[0].customerId;
          console.log(`从支付记录中找到客户ID: ${stripeCustomerId}，尝试更新用户记录`);

          if (stripeCustomerId) {
            await db.update(user)
              .set({ customerId: stripeCustomerId })
              .where(eq(user.id, session.user.id));

            console.log(`已更新用户 ${session.user.id} 的客户ID为 ${stripeCustomerId}`);

            // 使用找到的客户ID继续创建门户
            const returnUrlWithLocale =
              returnUrl || getUrlWithLocale('/settings/billing', locale);
            const params: CreatePortalParams = {
              customerId: stripeCustomerId,
              returnUrl: returnUrlWithLocale,
              locale,
            };

            console.log(`使用从支付记录中找到的客户ID创建客户门户:`, params);
            const result = await createCustomerPortal(params);
            return {
              success: true,
              data: result,
            };
          }
        }

        return {
          success: false,
          error: '未找到用户的客户ID，请先订阅或进行付款',
        };
      }

      // Create the portal session with localized URL if no custom return URL is provided
      const returnUrlWithLocale =
        returnUrl || getUrlWithLocale('/settings/billing', locale);
      const params: CreatePortalParams = {
        customerId: customerResult[0].customerId,
        returnUrl: returnUrlWithLocale,
        locale,
      };

      console.log(`创建客户门户的参数:`, params);
      const result = await createCustomerPortal(params);
      console.log('创建客户门户的结果:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('create customer portal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Something went wrong',
      };
    }
  });
