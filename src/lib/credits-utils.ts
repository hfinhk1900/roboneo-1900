import { getUserCreditsAction } from '@/actions/credits-actions';
import { creditsCache } from '@/lib/credits-cache';

/** Refresh credits from server and update local cache. */
export async function refreshCreditsSnapshot(): Promise<number | null> {
  try {
    const res = await getUserCreditsAction({});
    if (res?.data?.success) {
      const value = res.data.data?.credits ?? 0;
      creditsCache.set(value);
      return value;
    }
  } catch {}
  return null;
}

/** Clear local credits cache, used on logout. */
export function clearCreditsCache(): void {
  try {
    creditsCache.clear();
  } catch {}
}

/**
 * Spend credits on client side and keep UI in sync.
 * - If server returned remaining credits, use it as source of truth.
 * - Else, deduct by amount from local cache when available.
 * - Optionally fetch a fresh snapshot if cache is missing or invalid.
 */
export async function spendCredits(params: {
  remainingFromServer?: number;
  amount?: number; // credits to deduct when remainingFromServer not provided
  fetchFallback?: boolean; // fetch snapshot if cache missing
} = {}): Promise<void> {
  const { remainingFromServer, amount = 0, fetchFallback = true } = params;

  if (typeof remainingFromServer === 'number') {
    creditsCache.set(remainingFromServer);
    return;
  }

  const current = creditsCache.get();
  if (current !== null) {
    const next = Math.max(0, current - Math.max(0, amount));
    creditsCache.set(next);
    return;
  }

  if (fetchFallback) {
    await refreshCreditsSnapshot();
  }
}
