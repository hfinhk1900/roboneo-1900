# Nano Banana API 接口修复总结

## 问题诊断

### 原始错误
```
POST https://api.kie.ai/nano-banana/v1/generate
Status: 404 Not Found
Path: /nano-banana/v1/generate
```

### 根本原因
根据访问 https://kie.ai/nano-banana 得到的文档信息，API endpoint 配置存在以下问题：

1. **参数名称错误**
   - ❌ 原来使用: `aspect_ratio`
   - ✅ 正确应为: `image_size`

2. **Endpoint 不确定**
   - 当前配置: `https://api.kie.ai/nano-banana/v1/generate`
   - 返回 404 错误

## 实施的修复

### 1. 更新 `src/ai/image/providers/nano-banana.ts`

**修改点:**
```typescript
// 修改前
const payload = {
  model: process.env.NANO_BANANA_MODEL || 'gemini-nano-banana-latest',
  prompt: params.prompt,
  image_base64: this.sanitizeBase64(params.imageBase64),
  aspect_ratio: params.aspectRatio || '1:1',  // ❌ 错误参数
  negative_prompt: params.negativePrompt || '...',
};

// 修改后
const payload = {
  model: process.env.NANO_BANANA_MODEL || 'gemini-nano-banana-latest',
  prompt: params.prompt,
  image_base64: this.sanitizeBase64(params.imageBase64),
  image_size: params.aspectRatio || '1:1',  // ✅ 正确参数
  negative_prompt: params.negativePrompt || '...',
};
```

### 2. 更新 `test-scream-api-debug.js`

同样更新测试脚本的参数配置。

## 当前状态

### ✅ 已完成
- ✅ 服务器正常运行 (localhost:3000)
- ✅ 数据库连接正常
- ✅ 认证系统工作正常

### ❌ 待解决
- ❌ Nano Banana API 仍返回 404
- ❌ 需要确认正确的 API endpoint URL

## 需要验证的项

### 选项 1: 验证 Endpoint
```bash
# 测试各种可能的 endpoint
curl -X POST https://api.kie.ai/nano-banana/v1/generate \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 选项 2: 查看 Kie.ai 文档更新
- 访问 https://docs.kie.ai 查看最新的 Nano Banana API 文档
- 确认正确的 endpoint 和参数格式

### 选项 3: 联系 Kie.ai 支持
- 邮件: support@kie.ai
- 验证 API 密钥和 endpoint 是否有效

## 环境配置确认

### .env 文件中的配置
```
NANO_BANANA_API_KEY=07d8d02f69a7dffaa9eaee8b0891455f
NANO_BANANA_BASE_URL=https://api.kie.ai/nano-banana
NANO_BANANA_MODEL=gemini-nano-banana-latest
NANO_BANANA_TIMEOUT_MS=120000
```

### 已做的改动
1. ✅ 参数名 `aspect_ratio` → `image_size`
2. ✅ 更新 endpoint 构建逻辑
3. ✅ 同步更新测试脚本

## 可能的 API 端点格式

根据 Kie.ai 文档页面看到的 API 设计：

```
// 方式 1: 直接使用 Kie.ai 代理
POST https://api.kie.ai/nano-banana/v1/generate

// 方式 2: 文档 API
POST https://docs.kie.ai/api/v1/nano-banana/generate

// 方式 3: 原始 Nano Banana（如果直接可用）
POST https://[原始nano-banana地址]/v1/generate
```

当前倾向于**方式 1**，因为这是 `.env` 中配置的地址。

##建议后续步骤

1. **立即**: 检查 Kie.ai 官方文档确认 endpoint
2. **验证**: 用 curl 测试 endpoint 可访问性
3. **确认**: 验证 API 密钥的有效期和权限
4. **更新**: 根据文档更新代码中的 endpoint 和参数

## 相关文件

- API 提供商: `src/ai/image/providers/nano-banana.ts`
- API 路由: `src/app/api/scream-ai/generate/route.ts`
- 测试脚本: `test-scream-api-debug.js`
- 文档链接: https://kie.ai/nano-banana

---

**最后更新**: 2025-10-23
**状态**: 🟡 参数已修复，但 endpoint 仍需验证
