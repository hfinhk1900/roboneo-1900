'use client';

import { getUserCreditsAction } from '@/actions/credits-actions';
import { useCurrentUser } from '@/hooks/use-current-user';
import { creditsCache } from '@/lib/credits-cache';
import { CreditCardIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CreditsDisplayProps {
  className?: string;
}

export function CreditsDisplay({ className = '' }: CreditsDisplayProps) {
  const currentUser = useCurrentUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 提取获取 credits 的函数
  const fetchCredits = async () => {
    try {
      setLoading(true);
      const result = await getUserCreditsAction({});
      if (result?.data?.success) {
        const newCredits = result.data.data?.credits || 0;
        creditsCache.set(newCredits); // 这会自动触发监听器更新状态
        setCredits(newCredits);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

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
      if (newCredits !== null) {
        setCredits(newCredits);
        setLoading(false);
      } else {
        // 缓存被清空，重新获取最新数据
        fetchCredits();
      }
    });

    // 如果没有缓存数据，则获取最新数据
    if (cachedCredits === null) {
      fetchCredits();
    }

    // 清理监听器
    return unsubscribe;
  }, []);

  // 在客户端挂载前始终显示 loading 状态，避免 hydration 不匹配
  if (!mounted) {
    return (
      <span className={`text-sm text-muted-foreground ${className || ''}`}>
        <CreditCardIcon className="h-4 w-4 mr-1 inline" />
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
        <CreditCardIcon className="h-4 w-4 mr-1 inline" />
        Loading...
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span
        className={`text-sm ${credits && credits > 0 ? 'text-foreground' : 'text-destructive'}`}
      >
        <CreditCardIcon className="h-4 w-4 mr-1 inline" />
        {credits || 0} Credits
      </span>
      {(credits === 0 || credits === null) && (
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
