'use client';

import { getUserCreditsAction } from '@/actions/credits-actions';
import { creditsCache } from '@/lib/credits-cache';
import { CreditCardIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreditsDisplayProps {
  className?: string;
}

export function CreditsDisplay({ className }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 只在客户端挂载后才读取缓存
    const cachedCredits = creditsCache.get();
    if (cachedCredits !== null) {
      setCredits(cachedCredits);
      setLoading(false);
    }

    // 监听 credits 更新
    const unsubscribe = creditsCache.addListener(() => {
      const newCredits = creditsCache.get();
      setCredits(newCredits);
      if (newCredits !== null) {
        setLoading(false);
      }
    });

    // 如果没有缓存数据，则获取最新数据
    if (cachedCredits === null) {
      const fetchCredits = async () => {
        try {
          const result = await getUserCreditsAction({});
          if (result?.data?.success) {
            const newCredits = result.data.data?.credits || 0;
            creditsCache.set(newCredits); // 这会自动触发监听器更新状态
          }
        } catch (error) {
          console.error('Failed to fetch credits:', error);
          setLoading(false);
        }
      };

      fetchCredits();
    }

    // 清理监听器
    return unsubscribe;
  }, []);

  // 在客户端挂载前始终显示 loading 状态，避免 hydration 不匹配
  if (!mounted) {
    return (
      <span className={`text-sm text-muted-foreground ${className}`}>
        <CreditCardIcon className="h-4 w-4 mr-1 inline" />
        Loading...
      </span>
    );
  }

    if (loading) {
    return (
      <span className={`text-sm text-muted-foreground ${className}`}>
        <CreditCardIcon className="h-4 w-4 mr-1 inline" />
        Loading...
      </span>
    );
  }

  return (
    <span className={`text-sm ${credits && credits > 0 ? 'text-foreground' : 'text-destructive'} ${className}`}>
      <CreditCardIcon className="h-4 w-4 mr-1 inline" />
      {credits || 0} Credits
    </span>
  );
}
