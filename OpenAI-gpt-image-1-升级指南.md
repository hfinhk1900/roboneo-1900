# OpenAI gpt-image-1 API 升级指南

## 概述

本项目已升级支持 OpenAI 最新的 `gpt-image-1` 图像生成模型。这个新模型提供了更好的指令跟随能力、更高的图像质量，以及更多的自定义选项。

## 新特性

### 1. 更强的指令跟随能力
- 更准确地理解复杂的提示词
- 更好的风格控制和细节生成
- 支持更精确的构图要求

### 2. 增强的图像质量选项
- **质量等级**: `low` | `medium` | `high` | `auto`
- **输出格式**: `jpeg` | `png` | `webp`
- **压缩控制**: 0-100% 可调节压缩级别
- **透明背景**: 支持 PNG 和 WebP 透明背景

### 3. 多种图像尺寸
- `1024x1024` - 正方形，适合头像、logo
- `1536x1024` - 风景格式，适合横向图像
- `1024x1536` - 人像格式，适合竖向图像
- `auto` - 自动选择最佳尺寸

## 技术实现

### API 类型更新

```typescript
// src/ai/image/lib/api-types.ts
export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  // 新增 OpenAI gpt-image-1 支持的参数
  quality?: 'low' | 'medium' | 'high' | 'auto';
  outputFormat?: 'jpeg' | 'png' | 'webp';
  outputCompression?: number; // 0-100
  background?: 'transparent' | 'default';
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
}
```

### 提供商配置更新

```typescript
// src/ai/image/lib/provider-config.ts
openai: {
  displayName: 'OpenAI',
  iconPath: '/provider-icons/openai.svg',
  color: 'from-blue-500 to-cyan-500',
  models: [
    'gpt-image-1', // 🆕 新的图像生成模型
    'dall-e-3',
    'dall-e-2',
  ],
},
```

### API 端点增强

```typescript
// src/app/api/generate-images/route.ts
// 为 OpenAI gpt-image-1 模型添加特殊参数支持
if (provider === 'openai' && modelId === 'gpt-image-1') {
  generateParams.providerOptions = {
    openai: {
      quality,
      ...(outputFormat && { output_format: outputFormat }),
      ...(outputCompression && { output_compression: outputCompression }),
      ...(background === 'transparent' && { background: 'transparent' }),
    }
  };
}
```

## 前端组件

### OpenAI 设置面板

新增了专门的设置组件 `OpenAISettings.tsx`，提供用户友好的界面：

- 图像质量选择器
- 输出格式选择器
- 图像尺寸选择器
- 透明背景开关
- 压缩级别滑块（适用于 JPEG/WebP）

### 集成到现有界面

```typescript
// 在 ImagePlayground 或其他组件中使用
import { OpenAISettings, type OpenAIImageSettings } from './OpenAISettings';

const [openaiSettings, setOpenaiSettings] = useState<OpenAIImageSettings>({
  quality: 'auto',
  outputFormat: 'webp',
  background: 'default',
  size: '1024x1024',
  outputCompression: 80,
});

// 传递给图像生成函数
startGeneration(prompt, providers, providerToModel, openaiSettings);
```

## 使用示例

### 基础使用

```typescript
const request: GenerateImageRequest = {
  prompt: 'A cute orange robot sticker in modern flat design',
  provider: 'openai',
  modelId: 'gpt-image-1',
};
```

### 高质量 PNG 输出

```typescript
const request: GenerateImageRequest = {
  prompt: 'A magical forest scene with unicorns, highly detailed',
  provider: 'openai',
  modelId: 'gpt-image-1',
  quality: 'high',
  outputFormat: 'png',
  size: '1024x1024',
};
```

### 透明背景 WebP

```typescript
const request: GenerateImageRequest = {
  prompt: 'A simple geometric logo design',
  provider: 'openai',
  modelId: 'gpt-image-1',
  quality: 'medium',
  outputFormat: 'webp',
  background: 'transparent',
  outputCompression: 80,
};
```

### 风景格式高压缩 JPEG

```typescript
const request: GenerateImageRequest = {
  prompt: 'A beautiful sunset over mountains, panoramic view',
  provider: 'openai',
  modelId: 'gpt-image-1',
  quality: 'high',
  outputFormat: 'jpeg',
  size: '1536x1024',
  outputCompression: 90,
};
```

## 测试

### 自动化测试

运行测试脚本验证 API 功能：

```bash
# 基础测试
npx tsx scripts/test-openai-gpt-image.ts

# 保存测试图片
SAVE_TEST_IMAGES=true npx tsx scripts/test-openai-gpt-image.ts
```

### 手动测试

1. 启动开发服务器: `pnpm dev`
2. 访问图像生成页面
3. 选择 OpenAI 提供商和 gpt-image-1 模型
4. 配置高级设置
5. 输入提示词并生成图像

## 迁移指南

### 从 DALL-E 2/3 迁移

1. **更新模型选择**: 将 `dall-e-3` 改为 `gpt-image-1`
2. **添加质量设置**: 考虑为高质量图像设置 `quality: 'high'`
3. **优化输出格式**: 对于网页使用选择 `webp`，对于设计工作选择 `png`
4. **利用新尺寸**: 根据用途选择合适的图像尺寸

### 兼容性说明

- 现有的 DALL-E 2/3 配置仍然完全支持
- 新参数是可选的，不会影响现有功能
- 可以逐步迁移到新模型

## 最佳实践

### 质量与性能平衡

- **快速预览**: 使用 `quality: 'low'` 和 `outputFormat: 'webp'`
- **最终输出**: 使用 `quality: 'high'` 和适当的格式
- **网页展示**: 优选 WebP 格式，压缩级别 70-90%
- **设计工作**: 使用 PNG 格式，无压缩或低压缩

### 提示词优化

利用 gpt-image-1 更强的指令跟随能力：

```
// ✅ 好的提示词
"Create a minimalist logo design featuring a stylized robot head,
using only blue and white colors, with clean geometric shapes,
on a transparent background, suitable for mobile app icon"

// ❌ 避免过于简单
"robot logo"
```

### 错误处理

```typescript
try {
  const result = await generateImage(request);
  if (result.error) {
    // 处理API错误
    console.error('Generation failed:', result.error);
  }
} catch (error) {
  // 处理网络错误
  console.error('Request failed:', error);
}
```

## 性能优化

### 缓存策略

- 相同参数的请求可以缓存结果
- Base64 图像数据可以存储在浏览器缓存中
- 考虑实现服务端图像缓存

### 内存管理

- 及时释放不需要的图像数据
- 对于大图像考虑使用 Blob URLs
- 实现图像懒加载

## 费用考虑

- `gpt-image-1` 的定价可能与 DALL-E 3 不同
- 高质量设置会消耗更多计算资源
- 合理选择质量等级以控制成本

## 故障排除

### 常见问题

1. **生成失败**: 检查 API 密钥和网络连接
2. **质量不佳**: 尝试调整质量设置和提示词
3. **格式错误**: 确认输出格式支持所需功能
4. **尺寸问题**: 验证尺寸设置是否适合用途

### 调试工具

- 使用测试脚本验证 API 功能
- 检查浏览器开发工具中的网络请求
- 查看服务器日志了解详细错误信息

## 总结

升级到 `gpt-image-1` 为您的应用带来了：

- 🎨 更高的图像质量
- 🎯 更精确的指令跟随
- ⚙️ 更多的自定义选项
- 🚀 更好的用户体验

通过合理配置和使用这些新功能，您可以为用户提供更出色的图像生成体验。
