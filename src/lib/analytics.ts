'use client';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

type Dict = Record<string, any>;

const DEVICE_KEY = 'rbn_device_id';

/** 获取/生成 device_id（匿名用户用它做临时ID） */
export function ensureDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** 设置用户标识（登录后可传 userId；未登录时使用 device_id） */
export function setUser(userId?: string) {
  if (typeof window === 'undefined') return;
  const id = userId || ensureDeviceId();
  window.gtag?.('set', 'user_properties', { user_id: id });
  window.clarity?.('set', 'user_id', id);
}

/** 给 Clarity 打标签（便于录屏筛选） */
export function tag(key: string, value: string | number | boolean) {
  if (typeof window === 'undefined') return;
  window.clarity?.('set', key, value);
}

/** 统一发送事件 */
export function track(event: string, params: Dict = {}) {
  if (typeof window === 'undefined') return;
  // GA4
  window.gtag?.('event', event, params);
  // Clarity（事件名即可；关键属性用 set 做标签以便筛选）
  window.clarity?.('event', event);
  if (params.plan) window.clarity?.('set', 'plan', params.plan);
  if (params.ab_variant) window.clarity?.('set', 'ab_variant', params.ab_variant);
}

/** 发送 page_view（App Router 下我们手动触发） */
export function pageview(url: string) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'page_view', {
    page_location: url,
  });
}

/** 事件常量，避免拼写错误 */
export const Events = {
  GenerationStarted: 'generation_started',
  GenerationResultViewed: 'generation_result_viewed',
  GenerationFailed: 'generation_failed',
  UpgradeCtaClicked: 'upgrade_cta_clicked',
  CheckoutStarted: 'checkout_started',
  SignupCompleted: 'signup_completed',
  DownloadClicked: 'download_clicked',
  ShareClicked: 'share_clicked',
} as const;

