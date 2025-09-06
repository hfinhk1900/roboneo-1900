# Image to Sticker 功能实现说明

## 📋 目录
- [功能概述](#功能概述)
- [技术架构设计](#技术架构设计)
- [API供应商适配器](#api供应商适配器)
- [前端交互流程](#前端交互流程)
- [后端API设计](#后端api设计)
- [Credits系统集成](#credits系统集成)
- [实施任务清单](#实施任务清单)
- [测试验证计划](#测试验证计划)

---

## 功能概述

### 🎯 核心功能
Image to Sticker是RoboNeo Art的核心功能，允许用户上传任意照片并转换为各种风格的贴纸。

### 💡 用户体验流程
1. **上传图片**: 支持JPEG/PNG格式，≤5MB
2. **选择风格**: iOS贴纸、像素艺术、乐高积木、史努比风格等
3. **生成预览**: 实时显示处理进度
4. **下载结果**: 获得透明背景的PNG贴纸

### 🎨 支持的贴纸风格
| 风格类型 | 技术实现 | Credits消耗 | 特点 |
|---------|----------|-------------|------|
| **iOS Sticker** | OpenAI DALL-E 3 编辑 | 10 Credits | 苹果风格，圆润边缘 |
| **Pixel Art** | 像素化prompt处理 | 10 Credits | 8位游戏风格 |
| **LEGO Style** | 乐高积木风格转换 | 10 Credits | 积木质感，明亮色彩 |
| **Snoopy Style** | 卡通化处理 | 10 Credits | 简约线条，可爱风格 |

---

## 技术架构设计

### 🏗️ 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Next.js API   │    │  AI Providers   │
│                 │    │    Routes       │    │                 │
│ - 图片上传      │────│                 │────│ - Laozhang API  │
│ - 风格选择      │    │ - 参数验证      │    │ - OpenAI Direct │
│ - 进度显示      │    │ - Credits检查   │    │ - Future APIs   │
│ - 结果展示      │    │ - 任务管理      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   File Storage  │
                       │                 │
                       │ - 上传文件缓存  │
                       │ - 结果文件存储  │
                       │ - CDN分发       │
                       └─────────────────┘
```

### 📁 项目目录结构

```
src/
├─ ai/
│  ├─ image/
│  │  ├─ providers/           # AI供应商适配器
│  │  │  ├─ laozhang.ts      # 老张API适配器
│  │  │  ├─ openai.ts        # OpenAI直接调用
│  │  │  ├─ base.ts          # 基础适配器接口
│  │  │  └─ index.ts         # 供应商选择器
│  │  ├─ processors/          # 图片处理器
│  │  │  ├─ upload.ts        # 文件上传处理
│  │  │  ├─ style.ts         # 风格参数处理
│  │  │  └─ output.ts        # 结果处理
│  │  ├─ types/              # 类型定义
│  │  │  ├─ provider.ts      # 供应商接口类型
│  │  │  ├─ style.ts         # 风格配置类型
│  │  │  └─ task.ts          # 任务状态类型
│  │  └─ utils/              # 工具函数
│  │     ├─ image-helpers.ts # 图片处理工具
│  │     └─ prompt-builder.ts # 提示词构建
│  └─ storage/               # 文件存储
│     ├─ upload.ts           # 上传文件管理
│     └─ result.ts           # 结果文件管理
├─ app/
│  └─ api/
│     ├─ image-to-sticker/   # 主要API端点
│     │  └─ route.ts
│     ├─ upload-image/       # 图片上传端点
│     │  └─ route.ts
│     └─ sticker-result/     # 结果获取端点
│        └─ [taskId]/
│           └─ route.ts
└─ components/
   └─ ai/
      └─ image/
         ├─ ImageUploader.tsx    # 图片上传组件
         ├─ StyleSelector.tsx    # 风格选择组件
         ├─ GenerationStatus.tsx # 生成状态组件
         └─ ResultDisplay.tsx    # 结果展示组件
```

---

## API供应商适配器

### 🔌 基础接口设计

```typescript
// src/ai/image/types/provider.ts
export interface ImageToStickerProvider {
  name: string;
  supportedStyles: StickerStyle[];
  maxFileSize: number;
  supportedFormats: string[];

  // 核心方法
  generateSticker(params: StickerGenerationParams): Promise<StickerResult>;
  checkStatus(taskId: string): Promise<TaskStatus>;
  getResult(taskId: string): Promise<StickerResult>;
}

export interface StickerGenerationParams {
  imageFile: Buffer;
  imageFormat: string;
  style: StickerStyle;
  prompt?: string;
  userId: string;
}

export interface StickerResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  resultBuffer?: Buffer;
  seed?: number;
  processingTime?: number;
  error?: string;
}
```

### 🔧 Laozhang API适配器

```typescript
// src/ai/image/providers/laozhang.ts
export class LaozhangProvider implements ImageToStickerProvider {
  name = 'laozhang';
  apiKey: string;
  baseUrl = 'https://api.laozhang.ai/v1';

  supportedStyles = [
    StickerStyle.IOS_STICKER,
    StickerStyle.PIXEL_ART,
    StickerStyle.LEGO_STYLE,
    StickerStyle.SNOOPY_STYLE
  ];

  async generateSticker(params: StickerGenerationParams): Promise<StickerResult> {
    // 构建风格特定的prompt
    const stylePrompt = this.buildStylePrompt(params.style);
    const finalPrompt = `${stylePrompt}. Convert the uploaded image to this style while maintaining the main subject.`;

    // 使用 /v1/images/edits 端点
    const formData = new FormData();
    formData.append('image', new Blob([params.imageFile]), 'input.png');
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', finalPrompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch(`${this.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    return this.processResponse(response);
  }

  private buildStylePrompt(style: StickerStyle): string {
    const stylePrompts = {
      [StickerStyle.IOS_STICKER]: 'iOS emoji sticker style with clean edges, vibrant colors, and transparent background',
      [StickerStyle.PIXEL_ART]: '8-bit pixel art style with blocky edges and retro gaming colors',
      [StickerStyle.LEGO_STYLE]: 'LEGO minifigure style with plastic texture and bright colors',
      [StickerStyle.SNOOPY_STYLE]: 'Snoopy cartoon style with simple lines and cute expression'
    };

    return stylePrompts[style] || stylePrompts[StickerStyle.IOS_STICKER];
  }
}
```

### 🎯 供应商选择器

```typescript
// src/ai/image/providers/index.ts
export class ProviderManager {
  private providers: Map<string, ImageToStickerProvider>;

  constructor() {
    this.providers = new Map();
    this.registerProvider(new LaozhangProvider());
    // 未来可以添加更多供应商
    // this.registerProvider(new OpenAIDirectProvider());
    // this.registerProvider(new ReplicateProvider());
  }

  async selectBestProvider(style: StickerStyle, userPlan: UserPlan): Promise<ImageToStickerProvider> {
    // 选择逻辑：
    // 1. 检查供应商是否支持指定风格
    // 2. 根据用户计划选择合适的供应商
    // 3. 考虑成本和质量平衡

    const availableProviders = Array.from(this.providers.values())
      .filter(provider => provider.supportedStyles.includes(style));

    if (availableProviders.length === 0) {
      throw new Error(`No provider supports style: ${style}`);
    }

    // 优先选择Laozhang（性价比高）
    return availableProviders.find(p => p.name === 'laozhang') || availableProviders[0];
  }
}
```

---

## 前端交互流程

### 🎨 Sticker 生成器集成

```typescript
// src/components/blocks/sticker/sticker-generator.tsx (更新现有组件)
export default function HeroSection() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StickerStyle>(StickerStyle.IOS_STICKER);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [result, setResult] = useState<StickerResult | null>(null);

  const { generateSticker, isLoading } = useImageToSticker();

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    try {
      setGenerationStatus('processing');
      const result = await generateSticker({
        imageFile: uploadedImage,
        style: selectedStyle
      });

      setResult(result);
      setGenerationStatus('completed');
    } catch (error) {
      setGenerationStatus('failed');
      console.error('Generation failed:', error);
    }
  };

  return (
    <main className="hero-section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：上传和配置 */}
        <div className="upload-section">
          <ImageUploader
            onImageSelect={setUploadedImage}
            maxSize={5 * 1024 * 1024} // 5MB
          />

          <StyleSelector
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            disabled={isLoading}
          />

          <GenerateButton
            onClick={handleGenerate}
            disabled={!uploadedImage || isLoading}
            loading={isLoading}
          />
        </div>

        {/* 右侧：预览和结果 */}
        <div className="preview-section">
          <GenerationStatus status={generationStatus} />

          {result && (
            <ResultDisplay
              result={result}
              originalImage={uploadedImage}
            />
          )}
        </div>
      </div>
    </main>
  );
}
```

### 🖼️ 核心前端Hook

```typescript
// src/ai/image/hooks/use-image-to-sticker.ts
export function useImageToSticker() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateSticker = async (params: {
    imageFile: File;
    style: StickerStyle;
  }): Promise<StickerResult> => {
    setIsLoading(true);
    setProgress(0);

    try {
      // 1. 检查用户Credits
      const creditsCheck = await fetch('/api/user/credits');
      const credits = await creditsCheck.json();

      if (credits.balance < 10) {
        throw new Error('Insufficient credits');
      }

      // 2. 上传图片
      setProgress(20);
      const uploadData = new FormData();
      uploadData.append('image', params.imageFile);

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadData
      });

      const { uploadId } = await uploadResponse.json();

      // 3. 开始生成
      setProgress(40);
      const generateResponse = await fetch('/api/image-to-sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          style: params.style
        })
      });

      const { taskId } = await generateResponse.json();

      // 4. 轮询结果
      setProgress(60);
      return await pollForResult(taskId, setProgress);

    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return { generateSticker, isLoading, progress };
}
```

---

## 后端API设计

### 📤 图片上传API

```typescript
// src/app/api/upload-image/route.ts
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    // 验证文件
    const validation = validateImageFile(imageFile);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 临时存储文件
    const uploadId = generateUploadId();
    const tempPath = await saveTemporaryFile(imageFile, uploadId);

    return NextResponse.json({
      uploadId,
      fileName: imageFile.name,
      fileSize: imageFile.size,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
    });

  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 🎨 图片转贴纸API

```typescript
// src/app/api/image-to-sticker/route.ts
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId, style } = await request.json();

    // 1. 检查Credits
    const creditsManager = new CreditsManager();
    const canGenerate = await creditsManager.canUserGenerate(session.user.id, 'laozhang', 'standard');

    if (!canGenerate.canGenerate) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: canGenerate.cost,
        current: canGenerate.remainingAfter + canGenerate.cost
      }, { status: 402 });
    }

    // 2. 获取上传的文件
    const imageBuffer = await getTemporaryFile(uploadId);
    if (!imageBuffer) {
      return NextResponse.json({ error: 'Upload not found or expired' }, { status: 404 });
    }

    // 3. 选择合适的供应商
    const providerManager = new ProviderManager();
    const provider = await providerManager.selectBestProvider(style, session.user.planType);

    // 4. 开始生成任务
    const taskId = generateTaskId();
    const generationParams = {
      imageFile: imageBuffer,
      imageFormat: 'png',
      style,
      userId: session.user.id
    };

    // 异步处理生成任务
    processGenerationTask(taskId, provider, generationParams, creditsManager);

    return NextResponse.json({
      taskId,
      status: 'pending',
      estimatedTime: 15000 // 15秒预估
    });

  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

### 📊 任务状态查询API

```typescript
// src/app/api/sticker-result/[taskId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;
    const taskStatus = await getTaskStatus(taskId);

    if (!taskStatus || taskStatus.userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      taskId,
      status: taskStatus.status,
      progress: taskStatus.progress,
      resultUrl: taskStatus.resultUrl,
      error: taskStatus.error,
      processingTime: taskStatus.processingTime
    });

  } catch (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
```

---

## Credits系统集成

### 💳 Credits消耗规则

| 风格类型 | Credits消耗 | 处理时间 | 质量等级 |
|---------|-------------|----------|----------|
| iOS Sticker | 10 Credits | ~15秒 | 高质量 |
| Pixel Art | 10 Credits | ~15秒 | 高质量 |
| LEGO Style | 10 Credits | ~15秒 | 高质量 |
| Snoopy Style | 10 Credits | ~15秒 | 高质量 |

### 🔄 Credits处理流程

```typescript
// 生成前检查
const canGenerate = await creditsManager.canUserGenerate(userId, provider, quality);

// 生成成功后扣减
if (generationSuccess) {
  await creditsManager.deductCredits(userId, creditsCost, taskId);
}

// 生成失败时退款
if (generationFailed) {
  await creditsManager.refundCredits(userId, creditsCost, taskId, 'Generation failed');
}
```

---

## 实施任务清单

### 🏗️ Phase 1: 基础架构 (第1周)

#### 后端基础设施
- [ ] **创建项目目录结构**
  - [ ] `src/ai/image/providers/` 目录
  - [ ] `src/ai/image/types/` 类型定义
  - [ ] `src/ai/image/utils/` 工具函数

- [ ] **基础类型定义**
  - [ ] `ImageToStickerProvider` 接口
  - [ ] `StickerGenerationParams` 类型
  - [ ] `StickerResult` 类型
  - [ ] `StickerStyle` 枚举定义

- [ ] **Laozhang API适配器**
  - [ ] 实现基础的 `LaozhangProvider` 类
  - [ ] 配置API密钥和端点
  - [ ] 实现 `generateSticker()` 方法
  - [ ] 添加错误处理和重试机制

#### 前端基础组件
- [ ] **ImageUploader组件**
  - [ ] 拖拽上传界面
  - [ ] 文件格式和大小验证
  - [ ] 图片预览功能

- [ ] **StyleSelector组件**
  - [ ] 风格选项界面
  - [ ] 风格预览图标
  - [ ] 选中状态管理

### 🔧 Phase 2: 核心功能 (第2周)

#### API端点实现
- [ ] **图片上传API** (`/api/upload-image`)
  - [ ] 文件接收和验证
  - [ ] 临时文件存储
  - [ ] 过期清理机制

- [ ] **图片转贴纸API** (`/api/image-to-sticker`)
  - [ ] 参数验证和处理
  - [ ] Credits检查和扣减
  - [ ] 异步任务创建

- [ ] **结果查询API** (`/api/sticker-result/[taskId]`)
  - [ ] 任务状态查询
  - [ ] 结果文件下载
  - [ ] 权限验证

#### 前端交互逻辑
- [ ] **useImageToSticker Hook**
  - [ ] 完整的生成流程
  - [ ] 进度状态管理
  - [ ] 错误处理

- [ ] **GenerationStatus组件**
  - [ ] 实时进度显示
  - [ ] 状态动画效果
  - [ ] 错误信息展示

### 🎨 Phase 3: 用户体验优化 (第3周)

#### 界面完善
- [ ] **ResultDisplay组件**
  - [ ] 结果图片展示
  - [ ] 原图对比功能
  - [ ] 下载和分享按钮

- [ ] **Credits集成**
  - [ ] 实时余额显示
  - [ ] 消耗预估提示
  - [ ] 余额不足处理

#### 性能优化
- [ ] **文件处理优化**
  - [ ] 图片压缩和格式转换
  - [ ] 缓存策略实现
  - [ ] CDN集成

- [ ] **异步任务优化**
  - [ ] 任务队列管理
  - [ ] 失败重试机制
  - [ ] 超时处理

### 🧪 Phase 4: 测试和部署 (第4周)

#### 功能测试
- [ ] **单元测试**
  - [ ] API适配器测试
  - [ ] 工具函数测试
  - [ ] 组件渲染测试

- [ ] **集成测试**
  - [ ] 完整生成流程测试
  - [ ] 错误场景测试
  - [ ] 性能压力测试

#### 部署准备
- [ ] **环境配置**
  - [ ] 生产环境API密钥
  - [ ] 文件存储配置
  - [ ] 监控和日志

- [ ] **用户文档**
  - [ ] 功能使用指南
  - [ ] FAQ常见问题
  - [ ] 故障排除文档

---

## 测试验证计划

### 🧪 测试用例设计

#### 功能测试
```
1. 图片上传测试
   - 支持格式：JPEG, PNG ✓
   - 文件大小限制：5MB ✓
   - 无效文件拒绝 ✓

2. 风格转换测试
   - iOS贴纸风格 ✓
   - 像素艺术风格 ✓
   - 乐高积木风格 ✓
   - 史努比卡通风格 ✓

3. Credits系统测试
   - 余额检查 ✓
   - 消耗扣减 ✓
   - 失败退款 ✓
```

#### 性能测试
- **响应时间**: 目标15秒内完成生成
- **并发处理**: 支持10个并发请求
- **失败率**: 低于5%的失败率

#### 用户验收测试
- **易用性**: 3步完成操作
- **结果质量**: 90%用户满意度
- **稳定性**: 99.5%可用性

### 📊 监控指标

```typescript
const monitoringMetrics = {
  // 业务指标
  daily_generations: 0,
  success_rate: 0.95,
  avg_processing_time: 15000, // 毫秒
  user_satisfaction: 0.9,

  // 技术指标
  api_response_time: 500, // 毫秒
  file_upload_success_rate: 0.99,
  credits_accuracy: 1.0,

  // 成本指标
  cost_per_generation: 0.1, // 美元
  provider_performance: {
    laozhang: { success_rate: 0.95, avg_time: 15000 }
  }
};
```

---

## 📈 后续扩展计划

### 🔮 功能扩展
- **批量处理**: 一次上传多张图片
- **自定义风格**: 用户训练个人风格
- **高级编辑**: 手动调整贴纸边缘
- **社区分享**: 贴纸作品社区

### 🤖 技术扩展
- **更多供应商**: Midjourney, Stable Diffusion
- **边缘计算**: 本地GPU加速
- **智能推荐**: 基于图片内容推荐风格
- **实时预览**: WebGL实时风格预览

---

**文档版本**: v1.0.0
**创建日期**: 2025-08-02
**负责团队**: AI功能开发组

**关键联系人**:
- 技术负责人: 待指定
- API供应商联系: laozhang技术支持
- 测试负责人: 待指定

---

## 🔗 相关资源

- [Laozhang API文档](https://apiai.apifox.cn/api-288595533)
- [OpenAI图像生成文档](https://platform.openai.com/docs/guides/image-generation)
- [Credits管理系统说明](./Credits管理说明.md)
- [API供应商适配规范](待创建)
- [前端组件设计规范](待创建)
