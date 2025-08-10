# 📚 本地测试指南 - 优化后的 KIE AI API

## 快速开始

本指南帮助你在本地完整测试优化后的 KIE AI API，**无需 ngrok，无需部署**。

## 🎯 测试模式对比

| 特性 | 模拟模式（推荐开始） | 生产模式 |
|------|-------------------|----------|
| **需要 KIE API Key** | ❌ 不需要 | ✅ 需要 |
| **消耗 Credits** | ❌ 不消耗 | ✅ 消耗 |
| **生成速度** | ⚡ 5-10秒 | ⏱️ 1-2分钟 |
| **返回图片** | 占位图片 | 真实 AI 图片 |
| **适用场景** | UI/流程测试 | 最终验证 |

## 🚀 步骤 1：启用模拟模式（推荐先测试）

### 1.1 配置环境变量

编辑 `.env.local` 文件，添加或修改：

```bash
# 启用模拟模式 - 不需要真实 API key
MOCK_KIE_API=true

# 可选：如果要测试真实 API，设置为 false 并提供 API key
# MOCK_KIE_API=false
# KIE_AI_API_KEY=your-real-kie-api-key
```

### 1.2 启动开发服务器

```bash
npm run dev
```

### 1.3 访问应用

打开浏览器访问：
```
http://localhost:3000
```

**注意：** 直接使用 localhost，无需 ngrok！

## 🧪 步骤 2：测试流程

### 2.1 登录账号

1. 点击右上角 "Sign In"
2. 使用 Google 账号登录
3. 确保账号有足够的 credits（模拟模式不消耗）

### 2.2 使用 Hero 区域的 AI 生成器

在首页 Hero 部分，你会看到 AI 贴纸生成器界面：

1. **选择输入模式**
   - 📝 文字提示：输入描述文字
   - 🖼️ 图片转换：上传或提供图片 URL

2. **选择风格**
   - 🍎 iOS Style - iOS 表情风格
   - 🎮 Pixel Art - 像素艺术风格
   - 🧱 LEGO Style - 乐高积木风格
   - 🐕 Snoopy Style - 史努比漫画风格

3. **点击生成**
   - 观察进度条更新
   - 等待生成完成

### 2.3 观察测试结果

**模拟模式下的预期行为：**

```javascript
// 时间线
0秒: 创建任务 → 返回 taskId
2秒: 第一次轮询 → 进度 20%
4秒: 第二次轮询 → 进度 45%
6秒: 第三次轮询 → 进度 70%
8秒: 第四次轮询 → 进度 95%
10秒: 第五次轮询 → 完成 100%，返回占位图片
```

**你会看到：**
- ✅ 进度条逐渐增长
- ✅ 状态从 "processing" 变为 "completed"
- ✅ 返回一个占位图片（标注了选择的风格）
- ✅ 可以复制图片 URL

## 🔍 步骤 3：监控和调试

### 3.1 打开浏览器开发者工具

按 `F12` 打开开发者工具，切换到 **Network** 标签：

```
观察 API 调用：
1. POST /api/image-to-sticker-optimized → 创建任务
2. GET /api/image-to-sticker-optimized?taskId=xxx → 轮询状态（多次）
```

### 3.2 查看控制台日志

在 **Console** 标签中，你会看到：

```javascript
🚀 [MOCK] Starting sticker generation...
🧪 [MOCK] Skipping credits check in test mode
✅ Task created: task_abc123 (KIE: mock_kie_xyz789)
🧪 [MOCK] Polling task mock_kie_xyz789: status=GENERATING, progress=25%
🧪 [MOCK] Polling task mock_kie_xyz789: status=GENERATING, progress=50%
🧪 [MOCK] Polling task mock_kie_xyz789: status=SUCCESS, progress=100%
✅ Task task_abc123 completed with image: https://placehold.co/...
```

### 3.3 验证轮询机制

轮询采用指数退避策略：

```
第1次轮询: 2秒后
第2次轮询: 3秒后 (2 × 1.5)
第3次轮询: 4.5秒后 (3 × 1.5)
第4次轮询: 6.75秒后 (4.5 × 1.5)
第5次轮询: 10秒后 (上限)
...
最多60次轮询
```

## 🎯 步骤 4：测试真实 API（可选）

### 4.1 切换到生产模式

修改 `.env.local`：

```bash
# 关闭模拟模式
MOCK_KIE_API=false

# 提供真实的 KIE API key
KIE_AI_API_KEY=d98fc52479b343d99d808d9f1fff7f58
```

### 4.2 重启服务器

```bash
# 停止服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 4.3 测试真实生成

使用相同的测试流程，但这次会：
- ✅ 调用真实的 KIE AI API
- ✅ 消耗账户 credits
- ✅ 返回真实的 AI 生成图片
- ✅ 生成时间约 1-2 分钟

## 📊 测试检查清单

### 基础功能测试

- [ ] 能够成功登录
- [ ] 能够选择不同风格
- [ ] 文字提示模式正常工作
- [ ] 图片 URL 模式正常工作
- [ ] 进度条正确显示
- [ ] 生成成功后显示图片
- [ ] 能够复制图片 URL

### 错误处理测试

- [ ] 未登录时提示需要登录
- [ ] Credits 不足时显示错误（生产模式）
- [ ] 无效输入时显示验证错误
- [ ] 网络错误时正确处理

### 性能测试

- [ ] 轮询不会过于频繁
- [ ] 页面刷新后任务状态丢失（预期行为）
- [ ] 多个任务并发处理正常

## 🐛 常见问题

### Q1: 为什么看不到进度更新？

**检查：**
1. 浏览器控制台是否有错误
2. Network 标签是否有轮询请求
3. 确保 `useOptimizedSticker` hook 正确导入

### Q2: 模拟模式返回的图片是什么？

模拟模式返回占位图片，URL 格式如：
```
https://placehold.co/1024x1024/[color]/ffffff/png?text=[StyleName]
```

这些是公开的占位图服务，用于测试。

### Q3: 如何查看完整的请求/响应？

在 Network 标签中：
1. 找到 `image-to-sticker-optimized` 请求
2. 点击查看 Headers, Payload, Response
3. 检查返回的 JSON 数据

### Q4: 为什么生产模式下生成失败？

可能原因：
- KIE API key 无效或过期
- KIE 账户 credits 不足
- 网络连接问题
- 输入内容违反内容政策

## 📝 测试数据示例

### 文字提示测试用例

```javascript
// 简单描述
"A cute cat"

// 详细描述
"A happy golden retriever puppy playing with a red ball in a sunny garden"

// 风格指定
"Cyberpunk robot in neon city"

// 多元素
"Three penguins wearing party hats celebrating birthday"
```

### 图片 URL 测试用例

```javascript
// 公开图片 URL
"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"

// 占位图片
"https://placehold.co/512x512/orange/white/png?text=Test"
```

## 🎉 测试成功标志

当你看到以下情况，说明测试成功：

1. **模拟模式：**
   - ✅ 10秒内完成生成
   - ✅ 返回占位图片
   - ✅ 无错误信息
   - ✅ 进度条达到 100%

2. **生产模式：**
   - ✅ 1-2分钟内完成生成
   - ✅ 返回真实 AI 图片
   - ✅ Credits 正确扣除
   - ✅ 图片符合选择的风格

## 🚀 下一步

测试完成后，你可以：

1. **部署到 Vercel**
   ```bash
   vercel deploy
   ```

2. **配置 Cloudflare Worker**（可选）
   - 参考 `KIE-DEPLOYMENT-GUIDE.md`
   - 实现永久存储

3. **监控和优化**
   - 添加错误追踪（Sentry）
   - 添加分析（Google Analytics）
   - 优化轮询策略

## 📞 需要帮助？

如果遇到问题：

1. 检查浏览器控制台错误
2. 查看服务器终端日志
3. 确认环境变量正确设置
4. 参考 `KIE-DEPLOYMENT-GUIDE.md` 获取更多信息

---

**提示：** 建议先在模拟模式下完整测试所有功能，确认流程正确后再切换到生产模式测试真实 API。这样可以节省 credits 和调试时间。
