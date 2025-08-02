# Vercel + Cloudflare R2 部署优化方案

## 📋 目录
- [架构优化设计](#架构优化设计)
- [Vercel适配调整](#vercel适配调整)
- [Cloudflare R2集成](#cloudflare-r2集成)
- [异步任务处理](#异步任务处理)
- [性能优化策略](#性能优化策略)
- [成本优化方案](#成本优化方案)
- [代码实现调整](#代码实现调整)

---

## 架构优化设计

### 🏗️ Vercel + R2 优化架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel Edge   │    │ Vercel Functions│    │   Cloudflare    │
│                 │    │                 │    │                 │
│ - 文件上传      │────│ - 任务创建      │────│ - R2 Storage    │
│ - 结果展示      │    │ - 状态查询      │    │ - CDN 分发      │
│ - CDN 缓存      │    │ - Webhook接收   │    │ - 全球边缘      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Queue System  │    │  AI Providers   │
                       │                 │    │                 │
                       │ - Upstash Redis │────│ - Laozhang API  │
                       │ - 任务队列      │    │ - 异步处理      │
                       │ - 状态管理      │    │ - 结果回调      │
                       └─────────────────┘    └─────────────────┘
```

### 🚀 关键优化策略

1. **Edge Runtime**: 文件上传和下载使用Edge Functions
2. **异步处理**: 长时间AI生成任务放到队列
3. **CDN优化**: 利用Cloudflare全球CDN网络
4. **流量优化**: 最小化Vercel函数调用，最大化R2直传
5. **缓存策略**: 多层缓存减少重复计算

---

## Vercel适配调整

### ⚡ Edge Runtime 配置

```typescript
// src/app/api/upload-image/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    // 验证文件
    if (!validateImageFile(imageFile)) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }

    // 直接上传到R2，避免Vercel函数处理大文件
    const uploadUrl = await generateR2SignedUploadUrl();

    return Response.json({
      uploadUrl,
      uploadId: generateUploadId(),
      fileName: imageFile.name
    });

  } catch (error) {
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 🔄 异步任务处理

```typescript
// src/app/api/image-to-sticker/route.ts
export const runtime = 'nodejs';
export const maxDuration = 15; // Vercel Pro限制

export async function POST(request: Request) {
  const { uploadId, style } = await request.json();

  // 1. 快速验证和Credits检查（<1秒）
  const session = await getSession();
  const canGenerate = await creditsManager.canUserGenerate(session.user.id, 10);

  if (!canGenerate.canGenerate) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  // 2. 创建任务记录（<1秒）
  const taskId = generateTaskId();
  await createTaskRecord({
    taskId,
    userId: session.user.id,
    uploadId,
    style,
    status: 'queued'
  });

  // 3. 添加到Redis队列（<1秒）
  await addToQueue('image-generation', {
    taskId,
    uploadId,
    style,
    userId: session.user.id
  });

  // 4. 立即返回，不等待生成完成
  return Response.json({
    taskId,
    status: 'queued',
    estimatedTime: 30000, // 30秒预估
    checkUrl: `/api/task-status/${taskId}`
  });
}
```

### 📊 队列处理器

```typescript
// src/lib/queue/image-processor.ts
import { Queue } from '@upstash/qstash';

export class ImageQueueProcessor {
  private queue: Queue;

  constructor() {
    this.queue = new Queue({
      qstashUrl: process.env.QSTASH_URL!,
      qstashToken: process.env.QSTASH_TOKEN!,
    });
  }

  async processImageGeneration(taskData: ImageGenerationTask) {
    const { taskId, uploadId, style, userId } = taskData;

    try {
      // 1. 更新任务状态
      await updateTaskStatus(taskId, 'processing');

      // 2. 从R2获取原始图片
      const imageBuffer = await downloadFromR2(uploadId);

      // 3. 调用AI供应商
      const provider = await selectBestProvider(style);
      const result = await provider.generateSticker({
        imageFile: imageBuffer,
        style,
        userId
      });

      // 4. 上传结果到R2
      const resultUrl = await uploadResultToR2(result.resultBuffer, taskId);

      // 5. 更新任务完成状态
      await updateTaskStatus(taskId, 'completed', { resultUrl });

      // 6. 扣减Credits
      await creditsManager.deductCredits(userId, 10, taskId);

      // 7. 发送完成通知（可选）
      await notifyUserCompletion(userId, taskId);

    } catch (error) {
      // 失败处理
      await updateTaskStatus(taskId, 'failed', { error: error.message });
      // 不扣减Credits
    }
  }
}
```

---

## Cloudflare R2集成

### 📦 R2 存储优化

```typescript
// src/lib/storage/r2-client.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class CloudflareR2Client {
  private s3Client: S3Client;
  private bucketName: string;
  private publicDomain: string; // 自定义域名用于CDN

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    this.publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN!; // 如 cdn.roboneo.com
  }

  // 生成预签名上传URL，客户端直接上传到R2
  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      }
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 600 }); // 10分钟有效
  }

  // 上传处理结果
  async uploadResult(buffer: Buffer, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `results/${key}`,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000', // 1年缓存
      Metadata: {
        generatedAt: new Date().toISOString(),
      }
    });

    await this.s3Client.send(command);

    // 返回CDN URL而不是R2直链
    return `https://${this.publicDomain}/results/${key}`;
  }

  // 优化的文件下载
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];

    // 流式读取，避免内存溢出
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
```

### 🌐 CDN 优化配置

```typescript
// src/lib/cdn/r2-cdn.ts
export class R2CDNOptimizer {
  private cdnDomain: string;

  constructor() {
    this.cdnDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN!;
  }

  // 生成优化的CDN URL
  generateOptimizedUrl(key: string, options?: ImageOptimizationOptions): string {
    const baseUrl = `https://${this.cdnDomain}/${key}`;

    if (!options) return baseUrl;

    // 使用Cloudflare Image Resizing
    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    return `${baseUrl}?${params.toString()}`;
  }

  // 预热CDN缓存
  async warmupCache(keys: string[]): Promise<void> {
    const promises = keys.map(key =>
      fetch(`https://${this.cdnDomain}/${key}`, { method: 'HEAD' })
    );

    await Promise.allSettled(promises);
  }
}

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'png' | 'jpeg';
}
```

---

## 异步任务处理

### 🔄 队列系统设计

```typescript
// src/lib/queue/upstash-queue.ts
import { Redis } from '@upstash/redis';

export class UpstashTaskQueue {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  // 添加任务到队列
  async enqueue(queueName: string, task: any): Promise<void> {
    await this.redis.lpush(`queue:${queueName}`, JSON.stringify(task));
  }

  // 处理队列任务
  async dequeue(queueName: string): Promise<any | null> {
    const result = await this.redis.brpop(`queue:${queueName}`, 1);
    return result ? JSON.parse(result[1]) : null;
  }

  // 任务状态管理
  async setTaskStatus(taskId: string, status: TaskStatus, data?: any): Promise<void> {
    const taskData = {
      status,
      updatedAt: new Date().toISOString(),
      ...data
    };

    await this.redis.setex(`task:${taskId}`, 3600, JSON.stringify(taskData)); // 1小时过期
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const data = await this.redis.get(`task:${taskId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

### 📡 Webhook处理

```typescript
// src/app/api/webhooks/task-complete/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  const { taskId, status, resultUrl, error } = await request.json();

  // 验证webhook签名
  const signature = request.headers.get('x-webhook-signature');
  if (!verifyWebhookSignature(signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 更新任务状态
  await updateTaskStatus(taskId, status, { resultUrl, error });

  // 通知前端（WebSocket或者Server-Sent Events）
  await notifyFrontend(taskId, { status, resultUrl });

  return Response.json({ success: true });
}
```

---

## 性能优化策略

### ⚡ 多层缓存策略

```typescript
// src/lib/cache/multi-layer-cache.ts
export class MultiLayerCache {
  private edgeCache: Map<string, any> = new Map(); // 边缘缓存
  private redisCache: Redis; // Redis缓存
  private r2Cache: CloudflareR2Client; // R2持久化

  // 智能缓存读取
  async get(key: string): Promise<any> {
    // 1. 先检查边缘缓存（最快）
    if (this.edgeCache.has(key)) {
      return this.edgeCache.get(key);
    }

    // 2. 检查Redis缓存
    const redisData = await this.redisCache.get(key);
    if (redisData) {
      this.edgeCache.set(key, redisData); // 回填边缘缓存
      return redisData;
    }

    // 3. 检查R2存储
    try {
      const r2Data = await this.r2Cache.downloadFile(key);
      const parsedData = JSON.parse(r2Data.toString());

      // 回填所有缓存层
      await this.redisCache.setex(key, 3600, JSON.stringify(parsedData));
      this.edgeCache.set(key, parsedData);

      return parsedData;
    } catch {
      return null;
    }
  }
}
```

### 🌍 地理位置优化

```typescript
// src/lib/geo/region-selector.ts
export class RegionSelector {
  static selectOptimalProvider(userRegion: string): string {
    const regionMapping = {
      // 亚太地区用Laozhang（延迟低）
      'AP': 'laozhang',
      'AS': 'laozhang',

      // 北美用OpenAI（服务器近）
      'NA': 'openai',
      'US': 'openai',

      // 欧洲用Midjourney（质量优先）
      'EU': 'midjourney',
      'GB': 'midjourney',
    };

    return regionMapping[userRegion] || 'laozhang';
  }

  static getR2Region(userRegion: string): string {
    // Cloudflare R2 自动选择最近的数据中心
    return 'auto';
  }
}
```

---

## 成本优化方案

### 💰 流量成本优化

```typescript
// 成本优化策略
const costOptimization = {
  // 1. 使用R2自定义域名，避免Cloudflare流量费
  r2CustomDomain: 'cdn.roboneo.com',

  // 2. 客户端直传R2，减少Vercel函数调用
  directUpload: true,

  // 3. 激进缓存策略
  cacheStrategy: {
    results: '1 year',      // 结果图片缓存1年
    previews: '1 month',    // 预览图缓存1月
    thumbnails: '6 months', // 缩略图缓存6月
  },

  // 4. 智能图片格式
  imageFormats: {
    modern: 'avif',   // 现代浏览器用AVIF（文件更小）
    fallback: 'webp', // 降级用WebP
    legacy: 'png',    // 老浏览器用PNG
  }
};
```

### 📊 监控和分析

```typescript
// src/lib/analytics/cost-tracker.ts
export class CostTracker {
  async trackUsage(operation: string, data: any) {
    const metrics = {
      timestamp: new Date().toISOString(),
      operation,
      vercelFunctionCalls: data.functionCalls || 0,
      r2Operations: data.r2Ops || 0,
      bandwidthUsed: data.bandwidth || 0,
      estimatedCost: this.calculateCost(data),
    };

    // 发送到分析服务
    await this.sendToAnalytics(metrics);
  }

  private calculateCost(data: any): number {
    const costs = {
      vercelFunction: 0.000002, // $2 per million requests
      r2Storage: 0.015,        // $0.015 per GB per month
      r2Operations: 0.0000036, // Class A operations
    };

    return (
      data.functionCalls * costs.vercelFunction +
      data.storageGB * costs.r2Storage +
      data.operations * costs.r2Operations
    );
  }
}
```

---

## 代码实现调整

### 🔧 前端直传优化

```typescript
// src/components/ai/image/ImageUploader.tsx
export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      // 1. 获取预签名上传URL
      const response = await fetch('/api/upload-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      const { uploadUrl, uploadId } = await response.json();

      // 2. 直接上传到R2，绕过Vercel
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      // 3. 通知上传完成
      onImageSelect({ uploadId, fileName: file.name });

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-area">
      {/* 拖拽上传界面 */}
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        accept="image/jpeg,image/png"
      />
      {uploading && <UploadProgress />}
    </div>
  );
}
```

### 📱 实时状态更新

```typescript
// src/hooks/use-task-status.ts
export function useTaskStatus(taskId: string) {
  const [status, setStatus] = useState<TaskStatus>('queued');
  const [result, setResult] = useState<StickerResult | null>(null);

  useEffect(() => {
    if (!taskId) return;

    // 使用Server-Sent Events实时更新
    const eventSource = new EventSource(`/api/task-status/${taskId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);

      if (data.status === 'completed') {
        setResult(data.result);
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [taskId]);

  return { status, result };
}
```

### 🌐 Edge API Routes

```typescript
// src/app/api/task-status/[taskId]/stream/route.ts
export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  // 创建Server-Sent Events流
  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        const status = await getTaskStatus(taskId);

        if (status) {
          controller.enqueue(
            `data: ${JSON.stringify(status)}\n\n`
          );

          if (status.status === 'completed' || status.status === 'failed') {
            controller.close();
            return;
          }
        }

        // 每2秒检查一次状态
        setTimeout(sendUpdate, 2000);
      };

      sendUpdate();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 🚀 部署配置

### 📋 环境变量清单

```bash
# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxx
CLOUDFLARE_R2_BUCKET_NAME=roboneo-art-storage
CLOUDFLARE_R2_PUBLIC_DOMAIN=cdn.roboneo.com

# Upstash Redis (队列)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# QStash (异步任务)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxxx

# AI Providers
LAOZHANG_API_KEY=sk-xxxx
OPENAI_API_KEY=sk-xxxx

# 其他
WEBHOOK_SECRET=xxxx
NEXT_PUBLIC_APP_URL=https://roboneo.art
```

### ⚙️ Vercel 项目配置

```json
// vercel.json
{
  "functions": {
    "src/app/api/image-to-sticker/route.ts": {
      "maxDuration": 15
    }
  },
  "regions": ["iad1", "hkg1", "fra1"],
  "crons": [
    {
      "path": "/api/cleanup-temp-files",
      "schedule": "0 2 * * *"
    }
  ]
}
```

这个优化方案将显著提升性能并降低成本：

- **🚀 性能提升**: 直传R2减少延迟，CDN加速全球访问
- **💰 成本优化**: 减少Vercel函数调用，利用R2免费出站流量
- **⚡ 可扩展性**: 异步队列处理，支持高并发
- **🌍 全球化**: Cloudflare边缘网络，worldwide低延迟

您觉得这个优化方案如何？我们可以开始实施这些调整！
