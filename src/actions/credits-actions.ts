'use server';

import { getDb } from '@/db';
import { user } from '@/db/schema';
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

      // Check current credits first
      const currentUser = await db
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!currentUser.length) {
        return { success: false, error: 'User not found' };
      }

      const currentCredits = currentUser[0].credits;
      if (currentCredits < amount) {
        return {
          success: false,
          error: 'Insufficient credits',
          data: { currentCredits, required: amount },
        };
      }

      // Deduct credits
      const result = await db
        .update(user)
        .set({
          credits: sql`${user.credits} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({ credits: user.credits });

      return {
        success: true,
        data: {
          creditsDeducted: amount,
          remainingCredits: result[0].credits,
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
