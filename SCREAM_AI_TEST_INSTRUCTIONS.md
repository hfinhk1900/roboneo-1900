# Scream AI 测试说明

## ✅ Prompt 验证结果

所有 6 个场景的 prompts 已通过验证，完全符合 PRD 规范：

- ✅ Scene 0: Dreamy Y2K Bedroom
- ✅ Scene 1: Suburban Kitchen
- ✅ Scene 2: School Hallway
- ✅ Scene 3: Rainy Front Porch （已修复为详细版本）
- ✅ Scene 4: Movie Theater
- ✅ Scene 5: House Party （已修复，强调 SOLO 肖像）
- ✅ IDENTITY_SUFFIX 正确追加
- ✅ NEGATIVE_PROMPT 包含所有安全约束

---

## 🧪 如何进行 API 测试

### 步骤 1：获取 Session Token

1. 在浏览器中访问：http://localhost:3000
2. 登录到您的账号
3. 打开浏览器开发者工具（F12）
4. 切换到 **Application** 标签（Chrome）或 **Storage** 标签（Firefox）
5. 左侧菜单选择 **Cookies** → **http://localhost:3000**
6. 找到名为 `better-auth.session_token` 的 cookie
7. 复制它的值（完整的长字符串）

### 步骤 2：设置环境变量

在终端中运行：

```bash
export SESSION_TOKEN="粘贴你复制的token值"
```

**注意**：token 会在一段时间后过期，如果测试失败显示 401 错误，请重新获取。

### 步骤 3：准备测试图片

准备一张人像照片用于测试：
- 格式：JPG、PNG 或 WebP
- 大小：≤ 10MB
- 内容：清晰的人脸照片效果最佳

推荐测试图片位置：
```bash
# 将测试图片放在项目根目录
# 例如：test-photo.jpg
```

---

## 🚀 运行测试

### 选项 1：测试单个场景（推荐先用这个）

```bash
# 基本语法
node test-scream-ai-simple.js <图片路径> <预设ID> [长宽比]

# 示例：测试 Scene 0 (Y2K Bedroom)，1:1 比例
node test-scream-ai-simple.js ./test-photo.jpg 0 1:1

# 示例：测试 Scene 3 (Rainy Porch)，16:9 比例
node test-scream-ai-simple.js ./test-photo.jpg 3 16:9

# 示例：测试 Scene 5 (House Party)，默认 1:1
node test-scream-ai-simple.js ./test-photo.jpg 5
```

**预设 ID 列表**：
- `0` - Dreamy Y2K Bedroom
- `1` - Suburban Kitchen
- `2` - School Hallway
- `3` - Rainy Front Porch
- `4` - Movie Theater
- `5` - House Party

**长宽比选项**：
- `1:1` - 正方形（默认）
- `3:4` - 竖屏
- `4:3` - 横屏
- `9:16` - 竖屏（高）
- `16:9` - 宽屏

### 选项 2：完整测试套件（消耗较多 Credits）

```bash
# 测试所有场景、所有长宽比、自定义 prompts
node test-scream-ai-api.js
```

**警告**：此测试会运行：
- 6 个预设场景 × 1 次 = 6 credits
- 5 个长宽比 × 1 次 = 5 credits
- 3 个自定义 prompt 测试 = 3 credits
- **总计约 14 credits**

---

## 📊 监测服务器日志

在另一个终端窗口中监测服务器日志：

```bash
# 方法 1：直接查看运行中的 dev server 输出

# 方法 2：监测 dev.log（如果有的话）
tail -f dev.log

# 方法 3：使用 monitor-server.sh（如果存在）
./monitor-server.sh
```

---

## 🔍 验证测试结果

### 成功响应应包含：

```json
{
  "success": true,
  "asset_id": "ast_xxxxx",
  "view_url": "/api/assets/ast_xxxxx",
  "download_url": "https://...signed-url...",
  "preset_id": "0",
  "preset_name": "Dreamy Y2K Bedroom",
  "aspect_ratio": "1:1",
  "credits_used": 1,
  "remaining_credits": 99,
  "watermarked": false  // 或 true，取决于订阅状态
}
```

### 需要检查的关键点：

1. ✅ **Status Code**: 200
2. ✅ **asset_id**: 已生成
3. ✅ **view_url**: 可访问
4. ✅ **download_url**: 有签名且可下载
5. ✅ **preset_name**: 与请求的预设匹配
6. ✅ **aspect_ratio**: 与请求的比例匹配
7. ✅ **watermarked**: 根据订阅状态正确标记
8. ✅ **credits_used**: 正确扣除（通常是 1）

---

## 🐛 常见错误排查

### 401 Unauthorized
```
❌ Error: Unauthorized
```
**原因**：SESSION_TOKEN 未设置或已过期
**解决**：重新获取 token 并设置环境变量

### 402 Insufficient Credits
```
❌ Error: Insufficient credits
```
**原因**：账户 credits 不足
**解决**：购买更多 credits 或升级订阅

### 413 Image Too Large
```
❌ Error: Image too large
```
**原因**：图片超过 10MB
**解决**：压缩图片后重试

### 429 Too Many Requests
```
❌ Error: Too many requests
```
**原因**：超过频率限制（5次/分钟）
**解决**：等待 60 秒后重试

### 503 Service Unavailable
```
❌ Error: AI service temporarily unavailable
```
**原因**：NANO_BANANA_API_KEY 未配置或 AI 服务不可用
**解决**：检查环境变量配置

---

## 📝 测试清单

### 基础功能测试（必做）

- [ ] 测试至少 1 个场景成功生成
- [ ] 验证 Scene 3 (Rainy Porch) 使用了详细 prompt
- [ ] 验证 Scene 5 (House Party) 强调 SOLO 肖像
- [ ] 测试不同长宽比（至少 2 个）
- [ ] 验证水印功能（免费 vs 付费）

### 进阶功能测试（可选）

- [ ] 测试所有 6 个场景
- [ ] 测试所有 5 个长宽比
- [ ] 测试自定义 prompt 功能
- [ ] 验证历史记录保存
- [ ] 检查 Dashboard 显示
- [ ] 测试下载功能

### Prompt 验证（已完成）

- [x] 所有场景 prompt 符合 PRD
- [x] IDENTITY_SUFFIX 正确追加
- [x] NEGATIVE_PROMPT 包含所有约束

---

## 🎯 快速开始示例

```bash
# 1. 设置 token（从浏览器 cookie 复制）
export SESSION_TOKEN="your-token-here"

# 2. 测试 Scene 0（Y2K Bedroom）
node test-scream-ai-simple.js ./test-photo.jpg 0

# 3. 测试 Scene 3（Rainy Porch，已修复的详细版本）
node test-scream-ai-simple.js ./test-photo.jpg 3 16:9

# 4. 测试 Scene 5（House Party，已修复的 SOLO 版本）
node test-scream-ai-simple.js ./test-photo.jpg 5 1:1

# 5. 查看生成的结果文件
ls -lh scream-ai-result-*.json
```

---

## 📞 需要帮助？

如果遇到问题，请检查：

1. **服务器状态**：`ps aux | grep "next dev" | grep -v grep`
2. **环境变量**：`echo $SESSION_TOKEN`
3. **图片文件**：确认文件存在且格式正确
4. **Credits 余额**：在 Dashboard 中查看
5. **服务器日志**：查看控制台输出的错误信息

---

## 📄 相关文件

- `test-scream-ai-simple.js` - 简单测试脚本
- `test-scream-ai-api.js` - 完整测试套件
- `verify-scream-ai-prompts.js` - Prompt 验证脚本
- `SCREAM_AI_TEST_GUIDE.md` - 详细测试指南
- `PRD_Scream AI_V1.0` - 产品需求文档

