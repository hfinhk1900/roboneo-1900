# KIE AI API 调用文档

## 📋 概述

KIE AI 是一个第三方 GPT-4o 图像生成服务提供商，提供比直接调用 OpenAI 更便宜、更稳定的图像生成服务。本文档详细说明如何在项目中集成和使用 KIE AI API。

## 🔗 基本信息

- **服务商**: KIE AI
- **官网**: https://kie.ai
- **API基础URL**: `https://api.kie.ai`
- **底层技术**: GPT-4o (OpenAI)
- **支持功能**: 图像生成、图像编辑、文本转图像

## 🔑 认证配置

### 1. 获取API密钥

1. 访问 [KIE AI API Key管理页面](https://kie.ai/api-key)
2. 注册账户或登录
3. 创建新的API密钥
4. 复制密钥备用

### 2. 环境变量配置

在项目的 `.env.local` 文件中添加：

```bash
# KIE AI API配置
KIE_AI_API_KEY="your-kie-ai-api-key-here"
KIE_AI_BASE_URL="https://api.kie.ai"
```

## 📡 主要API端点

### 1. 图像生成 (Generate)

**端点**: `POST /api/v1/gpt4o-image/generate`

创建新的图像生成任务。

#### 请求参数

```typescript
interface GenerateRequest {
  prompt?: string;           // 文本提示词 (可选)
  filesUrl?: string[];       // 参考图片URL数组 (可选，最多5张)
  size: string;              // 图片尺寸，如 "1:1", "16:9"
  nVariants?: number;        // 生成变体数量 (默认1)
  maskUrl?: string;          // 遮罩图片URL (可选)
  callBackUrl?: string;      // 回调URL (可选)
  isEnhance?: boolean;       // 是否增强 (默认false)
  uploadCn?: boolean;        // 是否上传到中国 (默认false)
  enableFallback?: boolean;  // 启用备用模型 (默认false)
  fallbackModel?: string;    // 备用模型名称 (默认"FLUX_MAX")
}
```

#### 请求示例

```javascript
const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: "Transform into iOS emoji style sticker with transparent background",
    filesUrl: ["https://example.com/image.jpg"],
    size: "1:1",
    nVariants: 1,
    callBackUrl: "https://yourdomain.com/api/callback"
  })
});
```

#### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123def456"
  }
}
```

### 2. 任务状态查询 (Record Info)

**端点**: `GET /api/v1/gpt4o-image/record-info`

查询图像生成任务的状态和结果。

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| taskId | string | 是 | 任务ID |

#### 请求示例

```javascript
const taskId = "abc123def456";
const response = await fetch(`https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
```

#### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123def456",
    "status": "SUCCESS",           // GENERATING, SUCCESS, GENERATE_FAILED
    "progress": "1.00",
    "createTime": 1754688412000,
    "completeTime": 1754688500000,
    "response": {
      "resultUrls": [
        "https://tempfile.aiquickdraw.com/s/abc123_0_1754688500_1525.png"
      ]
    },
    "errorCode": null,
    "errorMessage": null
  }
}
```

### 3. 下载URL转换 (Download URL)

**端点**: `POST /api/v1/gpt4o-image/download-url`

将图片URL转换为直接下载URL，解决跨域问题。

#### 请求示例

```javascript
const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/download-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    imageUrl: "https://tempfile.aiquickdraw.com/s/abc123_0_1754688500_1525.png"
  })
});
```

## 🔄 回调机制

### 回调URL设置

在生成请求中设置 `callBackUrl` 参数，KIE AI 完成任务后会自动POST结果到该URL。

### 回调数据格式

**成功回调**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123def456",
    "info": {
      "result_urls": [
        "https://tempfile.aiquickdraw.com/s/abc123_0_1754688500_1525.png"
      ]
    }
  }
}
```

**失败回调**:
```json
{
  "code": 400,
  "msg": "Your content was flagged by OpenAI as violating content policies",
  "data": {
    "taskId": "abc123def456",
    "info": null
  }
}
```

### 回调超时和重试

- **超时**: 15秒
- **重试**: 失败后重试3次
- **重试间隔**: 1分钟、5分钟、15分钟

## ❌ 错误处理

### 常见错误代码

| 代码 | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误或内容违规 |
| 401 | 认证失败，API密钥无效 |
| 402 | 余额不足 |
| 404 | 任务不存在 |
| 429 | 请求频率限制 |
| 451 | 图片下载失败 |
| 500 | 服务器内部错误 |

### 错误处理示例

```javascript
try {
  const response = await fetch(apiUrl, options);

  if (!response.ok) {
    const errorText = await response.text();

    switch (response.status) {
      case 401:
        throw new Error('API密钥无效，请检查认证信息');
      case 402:
        throw new Error('账户余额不足，请充值');
      case 429:
        throw new Error('请求过于频繁，请稍后重试');
      default:
        throw new Error(`KIE AI API错误: ${response.status} ${errorText}`);
    }
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`KIE AI错误: ${data.msg}`);
  }

  return data;
} catch (error) {
  console.error('KIE AI调用失败:', error);
  throw error;
}
```

## 💡 最佳实践

### 1. 成本优化

```javascript
// ✅ 推荐: 使用回调机制，减少轮询调用
const generateRequest = {
  prompt: "iOS style sticker",
  filesUrl: ["https://example.com/image.jpg"],
  size: "1:1",
  nVariants: 1,                    // 只生成1张，控制成本
  callBackUrl: "https://yourdomain.com/callback"  // 设置回调URL
};

// ❌ 不推荐: 频繁轮询状态
setInterval(() => checkTaskStatus(taskId), 5000);
```

### 2. 请求防重复

```javascript
// 生成唯一请求标识避免重复提交
const requestHash = crypto.createHash('md5')
  .update(`${userId}:${JSON.stringify(request)}`)
  .digest('hex');

if (requestCache.has(requestHash)) {
  return requestCache.get(requestHash);
}
```

### 3. 图片URL要求

```javascript
// ✅ 正确: 使用可公网访问的URL
const validUrl = "https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/image.jpg";

// ❌ 错误: 本地URL无法被KIE AI访问
const invalidUrl = "http://localhost:3000/image.jpg";
```

### 4. 异步任务管理

```javascript
// 推荐的任务管理模式
class KIETaskManager {
  async createTask(request) {
    // 1. 创建KIE AI任务
    const response = await this.callKIEAPI(request);
    const taskId = response.data.taskId;

    // 2. 存储本地任务状态
    this.taskStorage.set(localTaskId, {
      kieTaskId: taskId,
      status: 'PROCESSING',
      createdAt: new Date()
    });

    return { taskId: localTaskId };
  }

  async handleCallback(callbackData) {
    // 3. 处理回调，更新任务状态
    const { taskId, info } = callbackData.data;
    const localTask = this.findTaskByKieId(taskId);

    if (localTask && info?.result_urls) {
      await this.downloadAndSave(info.result_urls);
      localTask.status = 'COMPLETED';
    }
  }
}
```

## 📋 完整示例

### Node.js 完整调用示例

```javascript
const fetch = require('node-fetch');

class KIEAIClient {
  constructor(apiKey, baseUrl = 'https://api.kie.ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generateImage(request) {
    const url = `${this.baseUrl}/api/v1/gpt4o-image/generate`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error(`KIE AI Error: ${data.msg}`);
      }

      return data.data.taskId;
    } catch (error) {
      console.error('Generate image failed:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId) {
    const url = `${this.baseUrl}/api/v1/gpt4o-image/record-info?taskId=${taskId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get task status failed:', error);
      throw error;
    }
  }
}

// 使用示例
async function main() {
  const client = new KIEAIClient(process.env.KIE_AI_API_KEY);

  try {
    // 1. 创建生成任务
    const taskId = await client.generateImage({
      prompt: "Transform into cute iOS emoji style sticker",
      filesUrl: ["https://example.com/photo.jpg"],
      size: "1:1",
      nVariants: 1,
      callBackUrl: "https://mydomain.com/api/callback"
    });

    console.log('任务创建成功:', taskId);

    // 2. 查询任务状态
    const status = await client.getTaskStatus(taskId);
    console.log('任务状态:', status);

  } catch (error) {
    console.error('操作失败:', error.message);
  }
}
```

## 📊 费用和配额

### 计费方式

- **按任务计费**: 每次调用 `generate` 接口消耗积分
- **状态查询**: `record-info` 查询通常免费
- **回调机制**: 不额外收费，推荐使用

### 节省成本建议

1. **使用回调**: 避免频繁轮询状态
2. **控制变体数量**: `nVariants=1` 最经济
3. **合理的图片尺寸**: 根据需求选择尺寸
4. **请求防重复**: 避免意外的重复调用

## 🔧 调试和监控

### 日志记录

```javascript
// 推荐的日志格式
console.log(`🚀 KIE AI请求: ${JSON.stringify(request, null, 2)}`);
console.log(`✅ KIE AI响应: ${JSON.stringify(response, null, 2)}`);
console.log(`📊 任务状态: ${taskStatus} | 进度: ${progress}`);
```

### 性能监控

```javascript
// 记录API调用时间
const startTime = Date.now();
const result = await kieClient.generateImage(request);
const duration = Date.now() - startTime;
console.log(`⏱️  KIE AI调用耗时: ${duration}ms`);
```

## 📞 技术支持

- **官方文档**: https://docs.kie.ai
- **API密钥管理**: https://kie.ai/api-key
- **技术支持**: 通过官方渠道联系

---

*最后更新时间: 2025-08-08*
*文档版本: v1.0*
