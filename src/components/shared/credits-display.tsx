'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCredits } from '@/hooks/use-credits';
import { CoinsIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CreditsDisplayProps {
  className?: string;
  /**
   * Cost per operation (e.g., 10 for ProductShot)
   * When provided, shows "Costs X credits • Y remaining"
   */
  cost?: number;
  /**
   * Action label for the cost display (e.g., "Generate", "Create")
   */
  actionLabel?: string;
}

export function CreditsDisplay({
  className = '',
  cost,
  actionLabel = 'Generate',
}: CreditsDisplayProps) {
  const currentUser = useCurrentUser();
  const { credits, loading, refresh } = useCredits({
    enabled: Boolean(currentUser),
    refreshOnFocus: Boolean(currentUser),
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // ensure latest after mount
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => void refresh())
      : window.setTimeout(() => void refresh(), 0);
    return () => {
      if ((window as any).cancelIdleCallback && typeof id === 'number') {
        (window as any).cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as any);
      }
    };
  }, [refresh]);

  // 在客户端挂载前始终显示 loading 状态，避免 hydration 不匹配
  if (!mounted) {
    return (
      <span className={`text-sm text-muted-foreground ${className || ''}`}>
        <CoinsIcon className="h-4 w-4 mr-1 inline" />
        Loading...
      </span>
    );
  }

  // 客户端挂载后检查用户登录状态
  if (!currentUser) {
    // 返回空的 span 而不是 null，保持布局一致性
    return (
      <span className={`text-sm text-muted-foreground ${className || ''}`} />
    );
  }

  if (loading) {
    return (
      <span className={`text-sm text-muted-foreground ${className || ''}`}>
        <CoinsIcon className="h-4 w-4 mr-1 inline" />
        Loading...
      </span>
    );
  }

  // Calculate remaining credits after the operation
  const remainingAfterOperation = cost
    ? Math.max(0, (credits || 0) - cost)
    : credits;
  const hasInsufficientCredits = cost && (credits || 0) < cost;

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span
        className={`text-sm ${
          hasInsufficientCredits
            ? 'text-destructive'
            : credits && credits > 0
              ? 'text-foreground'
              : 'text-destructive'
        }`}
      >
        <CoinsIcon className="h-4 w-4 mr-1 inline" />
        {cost ? (
          <>
            Spent {cost} credits | {remainingAfterOperation?.toLocaleString()}{' '}
            left
          </>
        ) : (
          <>{(credits || 0).toLocaleString()} Credits</>
        )}
      </span>
      {(credits === 0 || credits === null || hasInsufficientCredits) && (
        <Link
          href="/pricing"
          className="text-sm text-black hover:text-black/80 underline cursor-pointer"
        >
          Add Credits
        </Link>
      )}
    </div>
  );
}
