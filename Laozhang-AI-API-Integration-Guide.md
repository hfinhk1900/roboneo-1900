# Laozhang AI API 集成指南

## 📋 概述

本文档记录了将 Laozhang AI 的按 token 计费 API 集成到 Next.js 项目中的完整过程，实现图片转贴纸功能。

## 🎯 功能目标

- 用户上传图片
- 选择贴纸风格（iOS、像素、乐高、史努比）
- 调用 Laozhang AI 生成贴纸
- 在右侧卡片显示生成的图片
- 按 token 使用量计费

## 🔧 环境配置

### 1. 环境变量设置

在 `.env` 文件中添加：

```bash
# Laozhang AI API (for Image to Sticker generation)
LAOZHANG_API_BASE="https://api.laozhang.ai/v1"
LAOZHANG_API_KEY="your-api-key-here"
```

### 2. 依赖安装

```bash
# 如果需要使用 form-data（备用方案）
pnpm add form-data
```

## 📁 文件修改记录

### 1. API 路由创建

**文件**: `src/app/api/image-to-sticker/route.ts`

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const STYLE_PROMPTS = {
  ios: 'Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people\'s body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove background and include only the full figures, ensuring the final image looks like an official iOS emoji sticker.',
  pixel: 'Transform into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
  lego: 'Convert to LEGO minifigure style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
  snoopy: 'Transform into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background'
};

export async function POST(req: NextRequest) {
  try {
    console.log('=== Image-to-sticker API called ===');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Request method:', req.method);

    const formData = await req.formData();
    console.log('FormData keys:', Array.from(formData.keys()));

    const file = formData.get('imageFile') as File;
    const style = formData.get('style') as string || 'ios';

    console.log('Received file:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'null');
    console.log('Received style:', style);

    if (!file) {
      console.error('No image file provided');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File type not supported. Please use JPEG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 4MB as per API requirement)
    if (file.size > 4 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds the 4MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('File converted to buffer, size:', buffer.length);

    // Get style-specific prompt
    const stylePrompt = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.ios;
    console.log('Using prompt:', stylePrompt.substring(0, 50) + '...');

    console.log(`Image-to-sticker request [style=${style}, fileSize=${file.size}]`);

    // 使用聊天完成API，按token计费
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    const requestBody = {
      model: 'gpt-4o-image', // 或者 gpt-4-vision-preview
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: stylePrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    console.log('Chat completion request prepared');

    const headers = {
      'Authorization': `Bearer ${process.env.LAOZHANG_API_KEY!}`,
      'Content-Type': 'application/json',
    };
    console.log('Request headers to Laozhang AI:', headers);

    const response = await fetch('https://api.laozhang.ai/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Laozhang AI response status:', response.status);
    console.log('Laozhang AI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Laozhang AI API error response:', errorText);
      console.error('Request details:');
      console.error('- Model:', 'gpt-4o-image');
      console.error('- Image size:', buffer.length, 'bytes');
      console.error('- Style prompt:', stylePrompt);
      console.error('- Request size:', '512x512');

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      console.error('Laozhang AI API parsed error:', errorData);
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    console.log('Laozhang AI successful response:', JSON.stringify(data, null, 2));

    // 处理聊天完成API的响应
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('No response content from API');
    }

    const responseText = data.choices[0].message.content;
    const cost = data.usage?.total_tokens ?
      (data.usage.total_tokens * 0.001) : // 假设每1000 tokens $0.001
      0.01;

    console.log(`Chat completion response: ${responseText}`);
    console.log(`Token usage: ${data.usage?.total_tokens || 'unknown'}, cost: $${cost}`);

    // 解析Markdown中的图片URL
    const imageUrlMatch = responseText.match(/https?:\/\/[^\s\)]+\.(png|jpg|jpeg|webp)/i);
    const actualImageUrl = imageUrlMatch ? imageUrlMatch[0] : null;

    console.log('Extracted image URL:', actualImageUrl);

    // 返回真实的图片URL而不是占位符
    return NextResponse.json({
      url: actualImageUrl || `/api/proxy-image/placeholder.png`,
      description: responseText,
      seed: Math.floor(Math.random() * 1000000),
      width: 512,
      height: 512,
      isHighQuality: false,
      style: style,
      cost: cost,
      tokenUsage: data.usage
    });

  } catch (error) {
    console.error('Error in image-to-sticker conversion:', error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Failed to convert image to sticker. Please try again later.'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
```

### 2. 代理图片路由简化

**文件**: `src/app/api/proxy-image/[key]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// 简化版本，直接返回重定向到实际图片URL
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;

    // 对于外部URL，直接重定向
    if (key.includes('http')) {
      return NextResponse.redirect(key);
    }

    // 对于占位符，返回一个简单的响应
    if (key === 'placeholder.png') {
      return new NextResponse('Placeholder image not found', { status: 404 });
    }

    // 对于其他情况，返回 404
    return new NextResponse('Image not found', { status: 404 });

  } catch (error) {
    console.error('Error in proxy-image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const runtime = 'edge';
```

### 3. Next.js 配置更新

**文件**: `next.config.ts`

在 `images.remotePatterns` 中添加：

```typescript
{
  protocol: 'https',
  hostname: 'tokensceshi.oss-ap-southeast-1.aliyuncs.com',
},
```

### 4. 前端组件更新

**文件**: `src/components/blocks/hero/hero.tsx`

确保前端有正确的处理逻辑：

```typescript
const handleGenerate = async () => {
  if (!selectedImage) return;

  resetState();
  setGeneratedImageUrl(null);

  try {
    const formData = new FormData();
    formData.append('imageFile', selectedImage);
    formData.append('style', selectedStyle);

    console.log(`Starting image-to-sticker conversion [style=${selectedStyle}]`);

    const response = await fetch('/api/image-to-sticker', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to convert image');
    }

    const data = await response.json();
    console.log('Image-to-sticker response:', data);

    if (data.url) {
      setGeneratedImageUrl(data.url);
    }

    if (data.description) {
      console.log('AI Analysis:', data.description);
    }

  } catch (error) {
    console.error('Error generating sticker:', error);
  }
};
```

## 🔍 调试和测试

### 1. 测试最小 Token 使用

在开发阶段，可以使用简化的 prompts 来节省成本：

```typescript
const STYLE_PROMPTS = {
  ios: 'sticker style',
  pixel: '8-bit style',
  lego: 'lego style',
  snoopy: 'cartoon style'
};
```

### 2. 服务器日志监控

API 包含详细的日志输出，包括：
- 请求接收情况
- 文件处理状态
- 与 Laozhang AI 的通信过程
- Token 使用量和成本

### 3. 常见错误处理

- **400 错误**: 检查文件格式和大小
- **401 错误**: 验证 API Key
- **500 错误**: 查看服务器日志

## 💰 成本分析

### Token 使用估算

- **输入 Tokens**: 约 200-300 (图片分析 + prompt)
- **输出 Tokens**: 约 50-100 (响应文本)
- **总计**: 约 250-400 tokens
- **成本**: 约 $0.01-0.50 每次请求

### 成本优化建议

1. 使用较小的图片文件
2. 优化 prompt 长度
3. 设置合理的 `max_tokens` 限制
4. 实现请求缓存机制

## 🚀 部署注意事项

### 1. 环境变量

确保生产环境中正确设置：
- `LAOZHANG_API_KEY`
- `LAOZHANG_API_BASE`

### 2. 运行时配置

API 路由使用 `nodejs` 运行时，确保服务器支持。

### 3. 超时设置

设置 `maxDuration: 60` 秒，适应 AI 处理时间。

## 📊 API 响应格式

成功响应示例：

```json
{
  "url": "https://tokensceshi.oss-ap-southeast-1.aliyuncs.com/sora/ef49a29f-54c4-4946-9ca0-b89d5ce1a0d7.png",
  "description": "![图片](https://tokensceshi.oss-ap-southeast-1.aliyuncs.com/sora/ef49a29f-54c4-4946-9ca0-b89d5ce1a0d7.png)",
  "seed": 721578,
  "width": 512,
  "height": 512,
  "isHighQuality": false,
  "style": "ios",
  "cost": 0.317,
  "tokenUsage": {
    "prompt_tokens": 265,
    "completion_tokens": 52,
    "total_tokens": 317
  }
}
```

## 🔄 备用方案

如果聊天完成 API 不可用，可以回退到图像编辑 API：

```typescript
// 使用 /v1/images/edits 端点
const form = new FormData();
form.append('model', 'gpt-image-1');
form.append('image', buffer, {
  filename: `image.${file.type.split('/')[1]}`,
  contentType: file.type,
});
form.append('prompt', stylePrompt);
form.append('background', 'transparent');
form.append('size', '512x512');
form.append('quality', 'standard');
form.append('n', '1');

const response = await fetch('https://api.laozhang.ai/v1/images/edits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.LAOZHANG_API_KEY!}`,
    ...form.getHeaders(),
  },
  body: form.getBuffer(),
});
```

## 📝 总结

这个集成方案提供了：

1. ✅ **完整的图片转贴纸功能**
2. ✅ **按 token 计费的成本控制**
3. ✅ **详细的错误处理和日志**
4. ✅ **前端友好的响应格式**
5. ✅ **可扩展的架构设计**

通过这个指南，可以快速在其他项目中复用 Laozhang AI 的集成方案。
