"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { creditsCache } from '@/lib/credits-cache';
import { getUserCreditsAction } from '@/actions/credits-actions';

export interface UseCreditsResult {
  credits: number | null;
  loading: boolean;
  /** Force refresh from server (ignores cache TTL) */
  refresh: () => Promise<void>;
  /** Set new credits value locally and notify listeners */
  set: (v: number) => void;
}

interface UseCreditsOptions {
  /**
   * Whether the hook should actively fetch credits.
   * Useful to disable when the user is not authenticated.
   */
  enabled?: boolean;
  /**
   * Automatically refresh when window gains focus / tab becomes visible.
   * Defaults to true.
   */
  refreshOnFocus?: boolean;
}

/**
 * Shared credits hook that centralizes fetching, caching and broadcasting
 * - reads from creditsCache first for instant UI
 * - provides refresh() to fetch DB snapshot via safe-action
 * - auto-refresh on window focus / tab visibility
 */
export function useCredits(options: UseCreditsOptions = {}): UseCreditsResult {
  const { enabled = true, refreshOnFocus = true } = options;
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const mountedRef = useRef(false);

  const set = useCallback((v: number) => {
    creditsCache.set(v);
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      setLoading(true);
      const res = await getUserCreditsAction({});
      if (res?.data?.success) {
        const value = res.data.data?.credits ?? 0;
        creditsCache.set(value);
      }
    } catch (e) {
      // ignore (unauthorized or network) – UI will keep current cache
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    mountedRef.current = true;

    // 1) read from cache for instant paint
    const cached = creditsCache.get();
    if (cached !== null) {
      setCredits(cached);
      setLoading(false);
    }

    // 2) subscribe to cache updates
    const unsubscribe = creditsCache.addListener(() => {
      const v = creditsCache.get();
      if (v !== null) {
        setCredits(v);
        setLoading(false);
      }
    });

    // 3) if no cache, fetch server snapshot
    if (cached === null) {
      // schedule next tick to avoid blocking hydration
      const id = window.requestIdleCallback
        ? window.requestIdleCallback(() => void refresh())
        : window.setTimeout(() => void refresh(), 0);
      return () => {
        if ((window as any).cancelIdleCallback && typeof id === "number") {
          (window as any).cancelIdleCallback(id);
        } else {
          window.clearTimeout(id as any);
        }
        unsubscribe?.();
      };
    }

    return unsubscribe;
  }, [refresh]);

  // Refresh on focus/visibility to keep cross-tab in sync
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return;
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, refreshOnFocus, refresh]);

  return { credits, loading, refresh, set };
}
