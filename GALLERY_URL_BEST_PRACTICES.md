# Gallery URL 管理最佳实践

## 🚨 问题背景

Gallery图片URL经常失效的问题主要由以下原因造成：

### 原有问题
1. **硬编码URL**：图片URL直接写死在组件代码中
2. **缺乏统一管理**：无法统一更新和维护URL
3. **R2域名变更风险**：Cloudflare R2公共域名可能发生变化
4. **与存储配置不一致**：Gallery和上传功能使用不同的URL管理机制

## ✅ 解决方案

### 1. 统一URL管理系统

创建了 `src/config/gallery-config.ts` 文件，提供：

- **动态URL生成**：基于环境变量配置URL
- **统一管理**：所有Gallery图片URL集中管理
- **配置优先级**：
  1. 优先使用 `STORAGE_PUBLIC_URL` 环境变量
  2. 回退到硬编码的R2域名作为备选方案

### 2. 环境变量配置

在 `.env.local` 中配置：

```bash
# 存储配置
STORAGE_PUBLIC_URL="https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev"
STORAGE_BUCKET_NAME="your-bucket-name"
```

### 3. 组件重构

更新 `showcase-gallery.tsx`：

```typescript
// ❌ 原有方式：硬编码URL
const showcaseImages = [
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker01-ios.webp',
    // ...
  }
];

// ✅ 新方式：动态配置
import { getStickerImages } from '@/config/gallery-config';
const showcaseImages = getStickerImages();
```

## 🔧 实施步骤

### 步骤1：配置环境变量

```bash
# 在 .env.local 中添加
STORAGE_PUBLIC_URL="https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev"
```

### 步骤2：使用新配置系统

Gallery组件现在会：
1. 首先尝试使用 `STORAGE_PUBLIC_URL` 环境变量
2. 如果环境变量未配置，回退到硬编码域名
3. 动态生成所有图片的完整URL

### 步骤3：验证配置

```typescript
import { getGalleryBaseUrl, getStickerImages } from '@/config/gallery-config';

// 检查基础URL
console.log('Gallery Base URL:', getGalleryBaseUrl());

// 检查生成的图片URL
const images = getStickerImages();
console.log('First image URL:', images[0].src);
```

## 🛡️ 预防措施

### 1. URL失效时的应对策略

如果R2域名发生变化：

1. **更新环境变量**（推荐）：
   ```bash
   STORAGE_PUBLIC_URL="https://new-domain.r2.dev"
   ```

2. **更新代码备选方案**：
   ```typescript
   // 在 gallery-config.ts 中更新回退URL
   return 'https://new-pub-domain.r2.dev';
   ```

### 2. 监控和检测

建议添加URL健康检查：

```typescript
// 可以添加到配置文件中
export const validateGalleryUrls = async (): Promise<boolean> => {
  const images = getStickerImages();
  const sampleUrl = images[0]?.src;

  if (!sampleUrl) return false;

  try {
    const response = await fetch(sampleUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
```

### 3. 缓存策略

配置适当的缓存策略：

```typescript
// next.config.ts 中的图片配置
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'pub-cfc94129019546e1887e6add7f39ef74.r2.dev',
      port: '',
      pathname: '/**',
    },
  ],
},
```

## 📋 维护清单

### 定期检查
- [ ] 验证所有Gallery图片URL是否可访问
- [ ] 确认环境变量配置正确
- [ ] 检查R2存储桶设置是否有变化

### 更新流程
1. 如果R2域名变更，优先更新环境变量
2. 测试新URL是否正常工作
3. 如需更新代码，遵循配置优先级原则

### 扩展建议
- 考虑使用CDN进一步提高可靠性
- 实施图片URL的定期健康检查
- 为不同环境（开发/生产）配置不同的存储URL

## 🚀 优势

### 新系统优势
1. **灵活性**：可通过环境变量快速切换URL
2. **可维护性**：统一管理，减少重复代码
3. **可靠性**：有备选方案，减少失效风险
4. **一致性**：与存储系统的其他部分保持一致

### 性能优化
- Next.js图片优化仍然正常工作
- 支持响应式图片加载
- 保持原有的缓存策略

## 🔗 相关文件

- `src/config/gallery-config.ts` - Gallery URL配置
- `src/components/shared/showcase-gallery.tsx` - Sticker Gallery组件
- `src/storage/config/storage-config.ts` - 存储配置
- `next.config.ts` - Next.js图片配置

这个新系统确保了Gallery URL的稳定性和可维护性，大大降低了因URL失效导致的问题。
