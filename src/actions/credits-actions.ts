'use server';

import { getDb } from '@/db';
import { creditsTransaction, user } from '@/db/schema';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/server';
import { eq, sql } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const actionClient = createSafeActionClient();

// Schema for credits operations
const creditsSchema = z.object({
  userId: z.string(),
  amount: z.number().int().min(1),
});

const updateCreditsSchema = z.object({
  userId: z.string(),
  credits: z.number().int().min(0),
});

// Get user credits
export const getUserCreditsAction = actionClient
  .schema(z.object({ userId: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    try {
      const session = await getSession();
      if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
      }

      const targetUserId = parsedInput.userId || session.user.id;

      // Admin can check any user's credits, regular users can only check their own
      if (targetUserId !== session.user.id && session.user.role !== 'admin') {
        return { success: false, error: 'Forbidden' };
      }

      const db = await getDb();
      const result = await db
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, targetUserId))
        .limit(1);

      if (!result.length) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: { credits: result[0].credits },
      };
    } catch (error) {
      console.error('Get user credits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get credits',
      };
    }
  });

// Deduct credits (for sticker generation)
export const deductCreditsAction = actionClient
  .schema(creditsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getSession();
      if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { userId, amount } = parsedInput;

      // Users can only deduct their own credits
      if (userId !== session.user.id) {
        return { success: false, error: 'Forbidden' };
      }

      const db = await getDb();

      // Atomic deduct: perform conditional update to prevent overdraft
      const updated = await db
        .update(user)
        .set({
          credits: sql`${user.credits} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(sql`${user.id} = ${userId} AND ${user.credits} >= ${amount}`)
        .returning({ credits: user.credits });

      if (!updated.length) {
        // Fetch current credits to return a friendly error payload
        const fallback = await db
          .select({ credits: user.credits })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        const currentCredits = fallback[0]?.credits ?? 0;
        return {
          success: false,
          error: 'Insufficient credits',
          data: { currentCredits, required: amount },
        };
      }

      // Log credits transaction (usage)
      try {
        const remaining = updated[0].credits;
        const before = remaining + amount;
        await db.insert(creditsTransaction).values({
          id: randomUUID(),
          user_id: userId,
          type: 'usage',
          amount: -amount,
          balance_before: before,
          balance_after: remaining,
          description: 'AI generation credit deduction',
          reference_id: undefined,
        });
      } catch (e) {
        console.warn('credits transaction log failed:', e);
      }

      return {
        success: true,
        data: {
          creditsDeducted: amount,
          remainingCredits: updated[0].credits,
        },
      };
    } catch (error) {
      console.error('Deduct credits error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to deduct credits',
      };
    }
  });

// Add credits (admin only)
export const addCreditsAction = actionClient
  .schema(creditsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getSession();
      if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
      }

      const { userId, amount } = parsedInput;

      const db = await getDb();
      const result = await db
        .update(user)
        .set({
          credits: sql`${user.credits} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({ credits: user.credits });

      if (!result.length) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: {
          creditsAdded: amount,
          totalCredits: result[0].credits,
        },
      };
    } catch (error) {
      console.error('Add credits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add credits',
      };
    }
  });

// Set credits (admin only)
export const setCreditsAction = actionClient
  .schema(updateCreditsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await getSession();
      if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
      }

      const { userId, credits } = parsedInput;

      const db = await getDb();
      const result = await db
        .update(user)
        .set({
          credits,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({ credits: user.credits });

      if (!result.length) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        data: { credits: result[0].credits },
      };
    } catch (error) {
      console.error('Set credits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set credits',
      };
    }
  });

// Check if user can generate sticker (helper function)
export const canGenerateStickerAction = actionClient
  .schema(z.object({ requiredCredits: z.number().int().min(1).default(10) }))
  .action(async ({ parsedInput }) => {
    try {
      const session = await getSession();
      if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
      }

      const { requiredCredits } = parsedInput;

      const db = await getDb();
      const result = await db
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!result.length) {
        return { success: false, error: 'User not found' };
      }

      const currentCredits = result[0].credits;
      const canGenerate = currentCredits >= requiredCredits;

      return {
        success: true,
        data: {
          canGenerate,
          currentCredits,
          requiredCredits,
          remainingAfter: canGenerate
            ? currentCredits - requiredCredits
            : currentCredits,
        },
      };
    } catch (error) {
      console.error('Can generate sticker error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to check credits',
      };
    }
  });
