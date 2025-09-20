import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { ailogHistory } from '@/db/schema';

export async function logAIOperation(params: {
  userId: string;
  operation: 'aibg' | 'productshot' | 'sticker' | 'bgremove' | string;
  mode?: string | null;
  creditsUsed: number;
  status: 'success' | 'failed' | 'processing';
  errorMessage?: string;
}) {
  try {
    const db = await getDb();
    await db.insert(ailogHistory).values({
      id: randomUUID(),
      user_id: params.userId,
      operation: params.operation,
      mode: params.mode ?? null,
      credits_used: params.creditsUsed,
      status: params.status,
      error_message: params.errorMessage,
    } as any);
  } catch (e) {
    console.warn('logAIOperation failed:', e);
  }
}
