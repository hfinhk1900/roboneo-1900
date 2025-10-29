

# Scream AI API 测试指南

## 📋 修复总结

### 已修复的 Prompt 问题

根据 PRD 文档检查，修复了以下2个场景的 prompt：

#### 1. Scene 3 - Rainy Front Porch
**问题**：使用了简化版本，缺少关键细节指令
**修复**：更新为 PRD 完整版本，包含：
- 明确的人物位置（站在门廊上，门的前面）
- 门的角度（20-30度）
- 构图要求（右三分位、腰部以上、3/4角度）
- 手部动作（一只手拿电话，另一只手放松或轻触门把手）
- 技术要求（避免肢体变形、不与门框线条相交）

#### 2. Scene 5 - House Party
**问题**：最后包含 "background partygoers"，违反了 PRD 的 "No other people anywhere" 要求
**修复**：更新为 PRD 完整版本，强调：
- SOLO 肖像（只有一个人）
- 明确说明不要其他人（No other people anywhere）
- 走廊和门口物理上是空的
- Ghostface 只作为镜子反射出现
- 强调人物占据画面大部分（60-70%宽度）

### 验证内容

所有6个场景的 prompt 现在都：
✅ 符合 PRD 原文要求
✅ 在末尾自动追加 `IDENTITY_SUFFIX`
✅ 使用统一的 `NEGATIVE_PROMPT`
✅ 支持可选的 `custom_prompt` 功能

---

## 🧪 测试脚本

提供了2个测试脚本：

### 1. 完整测试套件 (`test-scream-ai-api.js`)

自动化测试所有场景、长宽比和自定义 prompt。

**功能**：
- ✅ 测试所有6个预设场景
- ✅ 测试所有5个长宽比（1:1, 3:4, 4:3, 9:16, 16:9）
- ✅ 测试自定义 prompt 功能
- ✅ 验证响应结构
- ✅ 生成测试报告

**使用方法**：

```bash
# 1. 设置 session token
export SESSION_TOKEN="your-session-token-here"

# 2. 确保开发服务器运行
pnpm dev

# 3. 运行测试
node test-scream-ai-api.js
```

**如何获取 SESSION_TOKEN**：
1. 在浏览器中登录到应用
2. 打开 DevTools → Application → Cookies
3. 找到 `better-auth.session_token` cookie
4. 复制其值
5. 运行：`export SESSION_TOKEN="复制的值"`

**输出**：
- 控制台显示测试结果
- 生成 `test-scream-ai-results.json` 文件

### 2. 简单测试脚本 (`test-scream-ai-simple.js`)

使用真实图片测试单个场景。

**使用方法**：

```bash
# 基本用法
node test-scream-ai-simple.js <图片路径> <预设ID> [长宽比]

# 示例
node test-scream-ai-simple.js ./test.jpg 0 1:1
node test-scream-ai-simple.js ./photo.png 3 16:9
node test-scream-ai-simple.js ./selfie.webp 5
```

**预设 ID**：
- `0` - Dreamy Y2K Bedroom
- `1` - Suburban Kitchen
- `2` - School Hallway
- `3` - Rainy Front Porch
- `4` - Movie Theater
- `5` - House Party

**长宽比**：
- `1:1` - 正方形（默认）
- `3:4` - 竖屏（Portrait）
- `4:3` - 横屏（Landscape）
- `9:16` - 竖屏（Tall）
- `16:9` - 宽屏（Widescreen）

**输出**：
- 显示生成结果
- 保存结果到 `scream-ai-result-<timestamp>.json`

---

## 📝 测试清单

### 功能测试

- [ ] **所有预设场景**
  - [ ] Scene 0: Dreamy Y2K Bedroom
  - [ ] Scene 1: Suburban Kitchen
  - [ ] Scene 2: School Hallway
  - [ ] Scene 3: Rainy Front Porch（已修复）
  - [ ] Scene 4: Movie Theater
  - [ ] Scene 5: House Party（已修复）

- [ ] **长宽比测试**
  - [ ] 1:1 正方形
  - [ ] 3:4 竖屏
  - [ ] 4:3 横屏
  - [ ] 9:16 竖屏
  - [ ] 16:9 宽屏

- [ ] **自定义 Prompt**
  - [ ] 添加额外描述
  - [ ] 验证正确拼接到基础 prompt 后

- [ ] **水印功能**
  - [ ] 免费用户：生成带水印图片
  - [ ] 付费用户：生成无水印图片

### 响应验证

- [ ] **成功响应**（200）
  - [ ] `asset_id` 存在且有效
  - [ ] `view_url` 可访问
  - [ ] `download_url` 有签名且可下载
  - [ ] `preset_id` 和 `preset_name` 匹配
  - [ ] `aspect_ratio` 正确
  - [ ] `watermarked` 标记正确
  - [ ] `credits_used` 正确扣除

- [ ] **错误响应**
  - [ ] 401: 未登录
  - [ ] 402: Credits 不足
  - [ ] 413: 图片过大（>10MB）
  - [ ] 429: 请求过于频繁
  - [ ] 400: 参数错误

### Prompt 验证

- [ ] **基础 Prompt**
  - [ ] 使用 PRD 定义的原文
  - [ ] Scene 3 使用详细版本
  - [ ] Scene 5 强调 SOLO 且无其他人

- [ ] **IDENTITY_SUFFIX**
  - [ ] 所有场景都追加
  - [ ] 内容完整且准确

- [ ] **NEGATIVE_PROMPT**
  - [ ] 包含所有安全约束
  - [ ] 格式正确

### 性能测试

- [ ] **响应时间**
  - [ ] P95 < 30s
  - [ ] 平均响应时间合理

- [ ] **成功率**
  - [ ] ≥95% 生成成功率

---

## 🔍 Prompt 对比

### Scene 3 - Rainy Front Porch

**❌ 旧版本（简化）**：
```
Create a cinematic, rain-soaked front-porch scene featuring the person from the input image opening a screen door while holding a 90s cordless phone...
```

**✅ 新版本（PRD 完整）**：
```
Create a cinematic, rain-soaked front-porch night scene. The person from the input image stands fully on the porch, in front of the screen door, not inside the doorway. The screen door is slightly open (about 20–30°) on the left edge of frame; the subject is offset on the right third, waist-up, 3/4 angle toward camera at eye level (≈35mm)...
```

### Scene 5 - House Party

**❌ 旧版本（包含错误）**：
```
...Add disposable-camera flash aesthetics and mild motion blur on background partygoers.
```
❌ 提到了 "background partygoers"（背景派对参与者）

**✅ 新版本（PRD 完整）**：
```
Create a late-90s house-party living room scene as a SOLO portrait. Show EXACTLY ONE HUMAN: the person from the input image... No other people anywhere... No blood, no weapons, no gore.
```
✅ 明确强调只有一个人

---

## 📊 预期结果示例

```json
{
  "success": true,
  "asset_id": "ast_1234567890",
  "view_url": "/api/assets/ast_1234567890",
  "download_url": "https://...signed-url...",
  "expires_at": 1234567890,
  "preset_id": "0",
  "preset_name": "Dreamy Y2K Bedroom",
  "aspect_ratio": "1:1",
  "credits_used": 1,
  "remaining_credits": 99,
  "watermarked": false
}
```

---

## 🚀 快速开始

```bash
# 1. 获取 session token（见上方说明）
export SESSION_TOKEN="your-token-here"

# 2. 准备测试图片
# 使用任何 JPG/PNG/WebP 图片，大小 ≤10MB

# 3. 测试单个场景
node test-scream-ai-simple.js ./test.jpg 0

# 4. 测试所有场景（需要较多 credits）
node test-scream-ai-api.js
```

---

## ⚠️ 注意事项

1. **Credits 消耗**：每次生成消耗 1 个 credit
2. **频率限制**：5次/分钟（每个用户）
3. **图片大小**：≤10MB
4. **支持格式**：JPG, PNG, WebP
5. **响应时间**：通常 30-60 秒，取决于服务器负载

---

## 📞 问题排查

### 401 Unauthorized
- 检查 SESSION_TOKEN 是否正确
- 确认用户已登录
- Token 可能已过期，重新获取

### 402 Insufficient Credits
- 检查用户 credits 余额
- 购买更多 credits 或升级订阅

### 413 Image Too Large
- 图片超过 10MB 限制
- 压缩图片后重试

### 429 Too Many Requests
- 等待 60 秒后重试
- 降低请求频率

### 503 Service Unavailable
- 检查 NANO_BANANA_API_KEY 环境变量
- 确认 AI 服务可用

---

## 📄 相关文件

- `src/features/scream-ai/constants.ts` - Prompt 定义
- `src/app/api/scream-ai/generate/route.ts` - API 实现
- `PRD_Scream AI_V1.0` - 产品需求文档
- `test-scream-ai-api.js` - 完整测试套件
- `test-scream-ai-simple.js` - 简单测试脚本
