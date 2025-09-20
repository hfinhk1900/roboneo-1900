// 全局 credits 缓存管理
class CreditsCache {
  private data: number | null = null;
  private timestamp = 0;
  // TTL can be configured via NEXT_PUBLIC_CREDITS_CACHE_TTL_MS (defaults to 2 minutes)
  private readonly ttl: number = (() => {
    const raw = process.env.NEXT_PUBLIC_CREDITS_CACHE_TTL_MS;
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2 * 60 * 1000;
  })();
  private readonly storageKey = 'user_credits';
  private listeners: Set<() => void> = new Set();

  constructor() {
    // 只在客户端环境下初始化时从 localStorage 读取
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { credits, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < this.ttl) {
          this.data = credits;
          this.timestamp = timestamp;
        } else {
          // 过期数据，清除
          localStorage.removeItem(this.storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to read credits from localStorage:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          credits: this.data,
          timestamp: this.timestamp,
        })
      );
    } catch (error) {
      console.warn('Failed to save credits to localStorage:', error);
    }
  }

  isValid(): boolean {
    return this.data !== null && Date.now() - this.timestamp < this.ttl;
  }

  get(): number | null {
    if (this.isValid()) {
      return this.data;
    }

    // 如果缓存过期，重新从 localStorage 读取（仅在客户端）
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      return this.isValid() ? this.data : null;
    }

    return null;
  }

  set(credits: number) {
    this.data = credits;
    this.timestamp = Date.now();
    this.saveToStorage();

    // 通知所有监听器
    this.listeners.forEach((listener) => listener());
  }

  clear() {
    this.data = null;
    this.timestamp = 0;

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn('Failed to clear credits from localStorage:', error);
      }
    }

    // 通知所有监听器
    this.listeners.forEach((listener) => listener());
  }

  // 添加监听器，当 credits 更新时触发
  addListener(listener: () => void) {
    this.listeners.add(listener);

    // 返回清理函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 手动触发更新
  forceUpdate() {
    this.listeners.forEach((listener) => listener());
  }
}

// 导出全局实例
export const creditsCache = new CreditsCache();
