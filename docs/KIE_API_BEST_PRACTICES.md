# KIE API 调用最佳实践文档

## 目录
1. [概述](#概述)
2. [基础配置](#基础配置)
3. [请求处理](#请求处理)
4. [错误处理](#错误处理)
5. [性能优化](#性能优化)
6. [安全性](#安全性)
7. [测试](#测试)
8. [代码示例](#代码示例)

---

## 概述

KIE（Key Information Extraction）API 用于从文档、图片等媒体中提取关键信息。本文档提供了在 Next.js 项目中调用 KIE API 的最佳实践。

### 关键原则
- **幂等性设计**：每个请求都应具有唯一的幂等性 ID
- **错误恢复**：实现重试机制和优雅降级
- **性能优先**：最小化客户端逻辑，优先使用服务器组件
- **安全第一**：敏感密钥存储在环境变量中，API 调用在服务端进行

---

## 基础配置

### 1. 环境变量设置

在 `.env.production` 和 `.env.development` 中配置：

```env
# KIE API Configuration
KIE_API_ENDPOINT=https://your-kie-api-endpoint.com
KIE_API_KEY={{KIE_API_KEY}}
KIE_API_SECRET={{KIE_API_SECRET}}
KIE_REQUEST_TIMEOUT=30000
KIE_MAX_RETRIES=3
```

### 2. 创建 API 客户端

创建 `src/lib/kie-client.ts`：

```typescript path=/Users/hf/Desktop/Web\ Template/Products/roboneo\ art/src/lib/kie-client.ts start=null
import { newIdempotencyKey } from './idempotency-client';

interface KIERequestConfig {
  endpoint: string;
  apiKey: string;
  apiSecret: string;
  timeout?: number;
  retries?: number;
}

interface KIEExtractionRequest {
  documentUrl?: string;
  documentBase64?: string;
  extractionType: 'invoice' | 'receipt' | 'identity' | 'contract';
  language?: string;
  idempotencyKey?: string;
}

interface KIEExtractionResponse {
  success: boolean;
  requestId: string;
  data: Record<string, unknown>;
  confidence?: Record<string, number>;
  error?: {
    code: string;
    message: string;
  };
}

class KIEClient {
  private config: KIERequestConfig;
  private requestCache: Map<string, KIEExtractionResponse> = new Map();

  constructor(config: KIERequestConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  async extract(
    request: KIEExtractionRequest
  ): Promise<KIEExtractionResponse> {
    const idempotencyKey = request.idempotencyKey || newIdempotencyKey();

    // Check cache first
    if (this.requestCache.has(idempotencyKey)) {
      console.log(`[KIE] Cache hit for request ${idempotencyKey}`);
      return this.requestCache.get(idempotencyKey)!;
    }

    return this.executeWithRetry(request, idempotencyKey);
  }

  private async executeWithRetry(
    request: KIEExtractionRequest,
    idempotencyKey: string,
    attempt: number = 1
  ): Promise<KIEExtractionResponse> {
    try {
      const response = await this.performRequest(request, idempotencyKey);

      // Cache successful response
      this.requestCache.set(idempotencyKey, response);

      return response;
    } catch (error) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('connection'));

      if (isRetryable && attempt < this.config.retries!) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(
          `[KIE] Retry attempt ${attempt}/${this.config.retries} after ${backoffMs}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.executeWithRetry(request, idempotencyKey, attempt + 1);
      }

      throw error;
    }
  }

  private async performRequest(
    request: KIEExtractionRequest,
    idempotencyKey: string
  ): Promise<KIEExtractionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const headers = this.buildHeaders(idempotencyKey);
      const payload = this.buildPayload(request);

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `KIE API error: ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as KIEExtractionResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private buildHeaders(idempotencyKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Idempotency-Key': idempotencyKey,
      'X-API-Secret': this.config.apiSecret,
      'User-Agent': 'RoboneoArt/1.0',
    };
  }

  private buildPayload(request: KIEExtractionRequest): object {
    return {
      document_url: request.documentUrl,
      document_base64: request.documentBase64,
      extraction_type: request.extractionType,
      language: request.language || 'en',
    };
  }

  clearCache(): void {
    this.requestCache.clear();
  }
}

export function createKIEClient(): KIEClient {
  const config: KIERequestConfig = {
    endpoint: process.env.KIE_API_ENDPOINT!,
    apiKey: process.env.KIE_API_KEY!,
    apiSecret: process.env.KIE_API_SECRET!,
    timeout: parseInt(process.env.KIE_REQUEST_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.KIE_MAX_RETRIES || '3', 10),
  };

  return new KIEClient(config);
}

export type { KIEExtractionRequest, KIEExtractionResponse };
```

---

## 请求处理

### 1. 服务器端 API 路由

创建 `src/app/api/kie/extract/route.ts`：

```typescript path=null start=null
import { createKIEClient, type KIEExtractionRequest } from '@/lib/kie-client';
import { getLocalTimestr } from '@/lib/formatter';
import type { NextRequest } from 'next/server';

const kieClient = createKIEClient();

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body: KIEExtractionRequest = await request.json();

    // Validate request
    if (!body.documentUrl && !body.documentBase64) {
      return new Response(
        JSON.stringify({
          error: 'Either documentUrl or documentBase64 is required',
        }),
        { status: 400 }
      );
    }

    if (!body.extractionType) {
      return new Response(
        JSON.stringify({ error: 'extractionType is required' }),
        { status: 400 }
      );
    }

    // Log request
    console.log(`[KIE] Extraction request from user ${session.user.id}`, {
      timestamp: getLocalTimestr(),
      extractionType: body.extractionType,
    });

    // Call KIE API
    const result = await kieClient.extract(body);

    // Log response
    if (!result.success) {
      console.warn(`[KIE] Extraction failed`, {
        error: result.error,
      });
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('[KIE] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process KIE request',
        },
      }),
      { status: 500 }
    );
  }
}
```

### 2. 客户端调用

创建 `src/hooks/use-kie-extraction.ts`：

```typescript path=null start=null
'use client';

import { useState, useCallback } from 'react';
import type { KIEExtractionRequest, KIEExtractionResponse } from '@/lib/kie-client';

interface UseKIEExtractionState {
  isLoading: boolean;
  data: KIEExtractionResponse | null;
  error: Error | null;
}

export function useKIEExtraction() {
  const [state, setState] = useState<UseKIEExtractionState>({
    isLoading: false,
    data: null,
    error: null,
  });

  const extract = useCallback(
    async (request: KIEExtractionRequest) => {
      setState({ isLoading: true, data: null, error: null });

      try {
        const response = await fetch('/api/kie/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: KIEExtractionResponse = await response.json();

        setState({ isLoading: false, data: result, error: null });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ isLoading: false, data: null, error: err });
        throw err;
      }
    },
    []
  );

  return { ...state, extract };
}
```

---

## 错误处理

### 1. 错误类型定义

```typescript path=null start=null
interface KIEErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const KIE_ERRORS = {
  INVALID_DOCUMENT: { code: 'INVALID_DOCUMENT', statusCode: 400 },
  UNSUPPORTED_FORMAT: { code: 'UNSUPPORTED_FORMAT', statusCode: 400 },
  EXTRACTION_FAILED: { code: 'EXTRACTION_FAILED', statusCode: 500 },
  TIMEOUT: { code: 'TIMEOUT', statusCode: 504 },
  RATE_LIMIT: { code: 'RATE_LIMIT', statusCode: 429 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', statusCode: 401 },
};

function handleKIEError(error: unknown): KIEErrorResponse {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return KIE_ERRORS.TIMEOUT;
    }
    if (error.message.includes('401')) {
      return KIE_ERRORS.UNAUTHORIZED;
    }
    if (error.message.includes('429')) {
      return KIE_ERRORS.RATE_LIMIT;
    }
  }

  return KIE_ERRORS.EXTRACTION_FAILED;
}
```

### 2. 降级策略

```typescript path=null start=null
async function extractWithFallback(
  request: KIEExtractionRequest,
  fallbackExtractor?: (req: KIEExtractionRequest) => Promise<any>
) {
  try {
    return await kieClient.extract(request);
  } catch (error) {
    console.warn('[KIE] Falling back to alternative extraction', error);

    if (fallbackExtractor) {
      return fallbackExtractor(request);
    }

    throw error;
  }
}
```

---

## 性能优化

### 1. 请求批处理

```typescript path=null start=null
interface BatchKIERequest {
  requests: KIEExtractionRequest[];
  batchId: string;
}

async function batchExtract(batch: BatchKIERequest) {
  const promises = batch.requests.map((req) =>
    kieClient.extract(req).catch((error) => ({
      success: false,
      error,
      request: req,
    }))
  );

  return Promise.allSettled(promises);
}
```

### 2. 缓存策略

- **请求级缓存**：使用幂等性 ID 缓存成功的响应（内存中）
- **数据库缓存**：对于相同文档的多次提取，存储在数据库中
- **CDN 缓存**：对公开文档的提取结果使用 CDN

### 3. 超时管理

```typescript path=null start=null
const TIMEOUT_STRATEGY = {
  QUICK_EXTRACT: 10000,      // 文本提取
  STANDARD_EXTRACT: 30000,   // 标准处理
  COMPLEX_EXTRACT: 60000,    // 复杂文档
};
```

---

## 安全性

### 1. 密钥管理

✅ **正确做法**：
```typescript
const apiKey = process.env.KIE_API_KEY;  // 在服务器端使用
```

❌ **错误做法**：
```typescript
// 不要将密钥暴露给客户端
const response = fetch('/api', {
  headers: { 'Authorization': `Bearer ${process.env.KIE_API_KEY}` }
});
```

### 2. 速率限制

```typescript path=null start=null
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 每分钟 10 个请求
});

export async function POST(request: NextRequest) {
  const { success } = await ratelimit.limit(`kie_${userId}`);

  if (!success) {
    return new Response('Rate limited', { status: 429 });
  }

  // Process request
}
```

### 3. 输入验证

```typescript path=null start=null
function validateKIERequest(request: KIEExtractionRequest): boolean {
  // 验证 URL 格式
  if (request.documentUrl) {
    try {
      new URL(request.documentUrl);
    } catch {
      return false;
    }
  }

  // 验证 Base64 格式
  if (request.documentBase64) {
    if (!/^[A-Za-z0-9+/=]+$/.test(request.documentBase64)) {
      return false;
    }
  }

  // 验证提取类型
  const validTypes = ['invoice', 'receipt', 'identity', 'contract'];
  if (!validTypes.includes(request.extractionType)) {
    return false;
  }

  return true;
}
```

---

## 测试

### 1. 单元测试

```typescript path=null start=null
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createKIEClient } from '@/lib/kie-client';

describe('KIEClient', () => {
  let client: ReturnType<typeof createKIEClient>;

  beforeEach(() => {
    // Mock environment
    process.env.KIE_API_ENDPOINT = 'https://test-api.example.com';
    process.env.KIE_API_KEY = 'test-key';
    process.env.KIE_API_SECRET = 'test-secret';

    client = createKIEClient();
  });

  it('should extract with idempotency key', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { extractedField: 'value' },
          }),
      })
    ));

    const result = await client.extract({
      documentBase64: 'base64data',
      extractionType: 'invoice',
      idempotencyKey: 'unique-key-123',
    });

    expect(result.success).toBe(true);
  });

  it('should retry on timeout', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject(new Error('timeout'));
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {},
          }),
      });
    }));

    const result = await client.extract({
      documentBase64: 'base64data',
      extractionType: 'invoice',
    });

    expect(result.success).toBe(true);
    expect(callCount).toBe(2);
  });
});
```

### 2. 集成测试

```typescript path=null start=null
describe('KIE API Integration', () => {
  it('should handle full extraction workflow', async () => {
    const response = await fetch('http://localhost:3000/api/kie/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentUrl: 'https://example.com/invoice.pdf',
        extractionType: 'invoice',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

---

## 代码示例

### 完整使用示例

```typescript path=null start=null
'use client';

import { useState } from 'react';
import { useKIEExtraction } from '@/hooks/use-kie-extraction';
import { Button } from '@/components/ui/button';

export function DocumentExtractor() {
  const [documentUrl, setDocumentUrl] = useState('');
  const { isLoading, data, error, extract } = useKIEExtraction();

  async function handleExtract() {
    try {
      await extract({
        documentUrl,
        extractionType: 'invoice',
        language: 'en',
      });
    } catch (err) {
      console.error('Extraction failed:', err);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={documentUrl}
        onChange={(e) => setDocumentUrl(e.target.value)}
        placeholder="Enter document URL"
        className="w-full px-3 py-2 border rounded"
      />

      <Button onClick={handleExtract} disabled={isLoading || !documentUrl}>
        {isLoading ? 'Extracting...' : 'Extract'}
      </Button>

      {error && (
        <div className="text-red-600">Error: {error.message}</div>
      )}

      {data?.success && (
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold">Extracted Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## 监控和日志

### 日志最佳实践

```typescript path=null start=null
import { getLocalTimestr } from '@/lib/formatter';

// Structured logging
console.log(JSON.stringify({
  timestamp: getLocalTimestr(),
  service: 'kie-api',
  level: 'info',
  userId: session.user.id,
  documentType: request.extractionType,
  requestId: idempotencyKey,
  duration: performance.now(),
}));
```

---

## 检查清单

在部署 KIE API 集成前，确保检查以下项目：

- [ ] 所有敏感密钥存储在环境变量中
- [ ] 实现了错误处理和重试逻辑
- [ ] 添加了幂等性 ID 机制
- [ ] 配置了速率限制
- [ ] 实现了请求超时
- [ ] 添加了结构化日志
- [ ] 编写了单元和集成测试
- [ ] 实现了缓存策略
- [ ] 配置了监控告警
- [ ] 文档已更新

---

## 参考资源

- [KIE API 官方文档](https://example.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Error Handling Best Practices](https://example.com/errors)
- [Performance Optimization Guide](https://example.com/perf)
