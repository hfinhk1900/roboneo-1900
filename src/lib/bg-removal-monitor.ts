/**
 * AI Background Solid Color 使用量监控系统
 * 用于跟踪API调用次数、成本和性能
 */

export interface BGRemovalStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cacheHits: number;
  avgProcessingTime: number;
  estimatedMonthlyCost: number;
  lastResetDate: string;
}

export interface BGRemovalCall {
  timestamp: number;
  success: boolean;
  processingTime: number;
  cacheHit: boolean;
  errorType?: string;
}

class BGRemovalMonitor {
  private static instance: BGRemovalMonitor;
  private readonly STORAGE_KEY = 'bg_removal_stats';
  private readonly MONTHLY_RESET_KEY = 'bg_removal_last_reset';
  private readonly COST_PER_CALL = 0.003; // 估算每次调用$0.003

  static getInstance(): BGRemovalMonitor {
    if (!BGRemovalMonitor.instance) {
      BGRemovalMonitor.instance = new BGRemovalMonitor();
    }
    return BGRemovalMonitor.instance;
  }

  /**
   * 记录一次API调用
   */
  recordCall(call: BGRemovalCall): void {
    try {
      // 检查是否需要重置月度统计
      this.checkAndResetMonthlyStats();

      const stats = this.getStats();
      
      // 更新计数器
      stats.totalCalls++;
      if (call.success) {
        stats.successfulCalls++;
      } else {
        stats.failedCalls++;
      }
      
      if (call.cacheHit) {
        stats.cacheHits++;
      }

      // 更新平均处理时间（只计算非缓存的实际调用）
      if (!call.cacheHit && call.processingTime > 0) {
        const totalNonCachedCalls = stats.totalCalls - stats.cacheHits;
        if (totalNonCachedCalls === 1) {
          stats.avgProcessingTime = call.processingTime;
        } else {
          stats.avgProcessingTime = 
            (stats.avgProcessingTime * (totalNonCachedCalls - 1) + call.processingTime) / totalNonCachedCalls;
        }
      }

      // 计算预估月度成本（不包括缓存命中）
      const realAPICalls = stats.totalCalls - stats.cacheHits;
      stats.estimatedMonthlyCost = realAPICalls * this.COST_PER_CALL;

      this.saveStats(stats);

      // 控制台输出（开发环境）
      if (process.env.NODE_ENV === 'development') {
        this.logCallStats(call, stats);
      }

    } catch (error) {
      console.warn('Failed to record BG removal call stats:', error);
    }
  }

  /**
   * 获取当前统计数据
   */
  getStats(): BGRemovalStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load BG removal stats:', error);
    }

    // 返回默认统计数据
    return this.getDefaultStats();
  }

  /**
   * 获取缓存效率统计
   */
  getCacheEfficiency(): { hitRate: number; savedCalls: number; savedCost: number } {
    const stats = this.getStats();
    const hitRate = stats.totalCalls > 0 ? (stats.cacheHits / stats.totalCalls) : 0;
    const savedCost = stats.cacheHits * this.COST_PER_CALL;
    
    return {
      hitRate: Math.round(hitRate * 100) / 100,
      savedCalls: stats.cacheHits,
      savedCost: Math.round(savedCost * 1000) / 1000,
    };
  }

  /**
   * 检查是否超出免费额度
   */
  checkFreeTierStatus(): { 
    withinLimit: boolean; 
    usage: number; 
    limit: number; 
    warningLevel: 'safe' | 'warning' | 'critical' 
  } {
    const stats = this.getStats();
    const realAPICalls = stats.totalCalls - stats.cacheHits;
    const freeLimit = 30; // 保守估计：30次免费调用/月
    const usage = realAPICalls;
    const usageRate = usage / freeLimit;

    let warningLevel: 'safe' | 'warning' | 'critical' = 'safe';
    if (usageRate >= 0.9) {
      warningLevel = 'critical';
    } else if (usageRate >= 0.7) {
      warningLevel = 'warning';
    }

    return {
      withinLimit: usage < freeLimit,
      usage,
      limit: freeLimit,
      warningLevel,
    };
  }

  /**
   * 获取性能建议
   */
  getOptimizationSuggestions(): string[] {
    const stats = this.getStats();
    const cacheEff = this.getCacheEfficiency();
    const freeTier = this.checkFreeTierStatus();
    const suggestions: string[] = [];

    if (cacheEff.hitRate < 0.3) {
      suggestions.push('缓存命中率较低，考虑引导用户使用相似的图片处理');
    }

    if (stats.avgProcessingTime > 5000) {
      suggestions.push('平均处理时间较长，考虑图片压缩或优化');
    }

    if (freeTier.warningLevel === 'warning') {
      suggestions.push('接近免费额度限制，考虑升级到PRO版或优化使用');
    }

    if (freeTier.warningLevel === 'critical') {
      suggestions.push('即将超出免费额度，建议立即升级或实施用户限制');
    }

    if (stats.failedCalls / stats.totalCalls > 0.1) {
      suggestions.push('失败率较高，检查网络连接或HF Space状态');
    }

    return suggestions;
  }

  /**
   * 重置月度统计
   */
  resetMonthlyStats(): void {
    const defaultStats = this.getDefaultStats();
    this.saveStats(defaultStats);
    localStorage.setItem(this.MONTHLY_RESET_KEY, new Date().toISOString());
    console.log('📊 BG Removal monthly stats reset');
  }

  /**
   * 导出统计数据（用于分析）
   */
  exportStats(): string {
    const stats = this.getStats();
    const cacheEff = this.getCacheEfficiency();
    const freeTier = this.checkFreeTierStatus();
    
    return JSON.stringify({
      stats,
      cacheEfficiency: cacheEff,
      freeTierStatus: freeTier,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  private getDefaultStats(): BGRemovalStats {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      cacheHits: 0,
      avgProcessingTime: 0,
      estimatedMonthlyCost: 0,
      lastResetDate: new Date().toISOString(),
    };
  }

  private saveStats(stats: BGRemovalStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save BG removal stats:', error);
    }
  }

  private checkAndResetMonthlyStats(): void {
    try {
      const lastReset = localStorage.getItem(this.MONTHLY_RESET_KEY);
      if (!lastReset) {
        this.resetMonthlyStats();
        return;
      }

      const lastResetDate = new Date(lastReset);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - lastResetDate.getFullYear()) * 12 + 
                        (now.getMonth() - lastResetDate.getMonth());
      
      if (monthsDiff >= 1) {
        this.resetMonthlyStats();
      }
    } catch (error) {
      console.warn('Failed to check monthly reset:', error);
    }
  }

  private logCallStats(call: BGRemovalCall, stats: BGRemovalStats): void {
    const cacheEff = this.getCacheEfficiency();
    const freeTier = this.checkFreeTierStatus();
    
    console.group('📊 BG Removal Call Stats');
    console.log(`${call.success ? '✅' : '❌'} Call ${call.cacheHit ? '(cached)' : '(API)'}`);
    console.log(`⏱️ Processing time: ${call.processingTime}ms`);
    console.log(`📈 Total calls: ${stats.totalCalls} | Cache hits: ${stats.cacheHits} (${Math.round(cacheEff.hitRate * 100)}%)`);
    console.log(`💰 Estimated cost: $${stats.estimatedMonthlyCost.toFixed(3)} | Saved: $${cacheEff.savedCost.toFixed(3)}`);
    console.log(`🎯 Free tier: ${freeTier.usage}/${freeTier.limit} (${freeTier.warningLevel})`);
    console.groupEnd();
  }
}

// 导出单例实例
export const bgRemovalMonitor = BGRemovalMonitor.getInstance();
