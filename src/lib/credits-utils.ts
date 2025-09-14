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

