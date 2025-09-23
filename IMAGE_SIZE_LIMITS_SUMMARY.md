# 🖼️ 图片大小限制总结

## 📊 **各功能图片大小限制概览**

| 功能 | 文件大小限制 | Base64限制 | 尺寸限制 | 支持格式 |
|------|-------------|------------|----------|----------|
| **Image to Sticker** | 4MB (客户端)<br>4MB (服务端) | 无单独限制 | 256×256 - 2048×2048px | JPEG, PNG, WebP |
| **Productshot** | 无直接文件限制 | 5MB (可配置) | 无限制 | Base64格式 |
| **AI Background** | 无直接文件限制 | 5MB (可配置) | 无限制 | Base64格式 |
| **Profile Picture** | 无直接文件限制 | 无单独限制 | 无限制 | Base64格式 |
| **Remove Watermark** | 无直接文件限制 | 无单独限制 | 无限制 | Base64格式 |
| **Background Removal** | 无直接文件限制 | 5MB (可配置) | 无限制 | Base64格式 |
| **Storage Upload** | 10MB | 无单独限制 | 无限制 | 所有图片格式 |

---

## 🔍 **详细配置分析**

### **1. Image to Sticker 🎨**
- **配置文件**: `src/lib/image-validation.ts`
- **客户端验证**: 使用 `OPENAI_IMAGE_CONFIG`
  ```typescript
  maxFileSize: 4 * 1024 * 1024, // 4MB
  allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  maxDimensions: { width: 2048, height: 2048 }
  minDimensions: { width: 256, height: 256 }
  ```
- **服务端验证**: 双重检查文件大小和类型
- **处理后限制**: 处理后的图片不能超过4MB

### **2. Productshot 📷**
- **Base64限制**: 通过环境变量配置
  ```typescript
  const limit = Number(process.env.MAX_GENERATE_IMAGE_BYTES || 5 * 1024 * 1024); // 默认5MB
  ```
- **计算方式**: `(base64Length * 3) / 4` 估算字节数
- **无文件大小限制**: 仅限制Base64编码后的大小

### **3. AI Background 🎭**
- **Base64限制**: 与Productshot相同
  ```typescript
  const limit = Number(process.env.MAX_GENERATE_IMAGE_BYTES || 5 * 1024 * 1024); // 默认5MB
  ```
- **模式要求**: 必须是 `background` 模式
- **背景类型验证**: 必须是有效的背景类型

### **4. Background Removal (Solid Color) 🎯**
- **Base64限制**: 专用环境变量
  ```typescript
  const limit = Number(process.env.MAX_BG_REMOVE_IMAGE_BYTES || 5 * 1024 * 1024); // 默认5MB
  ```
- **特殊处理**: 有自己独立的大小限制配置

### **5. Profile Picture 👤**
- **无明确限制**: 代码中没有发现明确的文件大小限制
- **输入方式**: 接受Base64编码的图片
- **输出格式**: 支持 `jpeg`, `png`, `webp`

### **6. Remove Watermark 🧹**
- **无明确限制**: 代码中没有发现明确的文件大小限制
- **输入方式**: 接受Base64编码的图片
- **输出格式**: 支持 `png` 等格式

### **7. Storage Upload 💾**
- **文件大小限制**: 10MB
  ```typescript
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File size exceeds the 10MB limit' },
      { status: 413 }
    );
  }
  ```

---

## 🔧 **环境变量配置**

可以通过以下环境变量调整限制：

```bash
# Productshot 和 AI Background 的Base64大小限制 (默认: 5MB)
MAX_GENERATE_IMAGE_BYTES=5242880

# Background Removal 的Base64大小限制 (默认: 5MB)
MAX_BG_REMOVE_IMAGE_BYTES=5242880
```

---

## 📋 **支持的文件格式**

### **通用支持格式** (基于 OPENAI_IMAGE_CONFIG):
- ✅ **JPEG** (`image/jpeg`)
- ✅ **JPG** (`image/jpg`)
- ✅ **PNG** (`image/png`)
- ✅ **WebP** (`image/webp`)

### **不支持的格式**:
- ❌ **GIF** (不支持动画)
- ❌ **BMP** (格式过大)
- ❌ **TIFF** (不常用)
- ❌ **SVG** (矢量格式)

---

## 🔍 **尺寸限制详情**

### **Image to Sticker 专用限制**:
- **最小尺寸**: 256×256 像素
- **最大尺寸**: 2048×2048 像素
- **推荐尺寸**: 1024×1024 像素 (处理目标尺寸)

### **其他功能**:
- **无严格尺寸限制**: 大多数功能依赖AI服务自动调整
- **OpenAI自动缩放**: 超大图片会被自动调整到合适尺寸

---

## ⚡ **性能优化建议**

### **用户上传建议**:
1. **推荐格式**: PNG (最佳质量) 或 JPEG (较小文件)
2. **推荐尺寸**: 1024×1024 到 2048×2048 像素
3. **文件大小**: 尽量控制在 2MB 以下以获得最佳性能

### **开发者配置建议**:
1. **环境变量**: 根据服务器性能调整 `MAX_GENERATE_IMAGE_BYTES`
2. **CDN优化**: 使用R2/S3的CDN功能加速图片传输
3. **压缩算法**: 考虑在上传前进行客户端压缩

---

## 🚨 **常见问题**

### **问题1: 用户上传失败**
**可能原因**:
- 文件超过4MB (Image to Sticker)
- 格式不支持 (如GIF、BMP)
- 图片尺寸过小 (<256px)

### **问题2: Base64编码后超限**
**可能原因**:
- 原图过大导致Base64编码后超过5MB
- **解决方案**: 在客户端预压缩图片

### **问题3: 处理后图片过大**
**可能原因**:
- Image to Sticker处理后超过4MB限制
- **解决方案**: 调整压缩级别或降低输出质量

---

## 🛠️ **调试工具**

### **检查文件大小**:
```typescript
import { getFileSizeDisplay } from '@/lib/image-validation';

console.log('文件大小:', getFileSizeDisplay(file.size));
```

### **验证图片**:
```typescript
import { validateImageFile } from '@/lib/image-validation';

const validation = validateImageFile(file);
if (!validation.isValid) {
  console.error('验证失败:', validation.error);
}
```

### **估算Base64大小**:
```typescript
const approxBytes = Math.floor((base64String.length * 3) / 4);
console.log('Base64估算大小:', getFileSizeDisplay(approxBytes));
```
