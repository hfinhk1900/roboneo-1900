# 🔧 环境变量配置指南

## Vercel 环境变量配置

在你的 Vercel 项目 Dashboard 中配置以下环境变量：

### 1. 访问 Vercel Dashboard
- 登录 https://vercel.com
- 选择你的项目
- 点击 **Settings** 标签页
- 在左侧菜单中点击 **Environment Variables**

### 2. 添加环境变量

#### HF_SPACE_URL
- **Name**: `HF_SPACE_URL`
- **Value**: `https://yelo1900-bg-remove-2.hf.space`
- **Environment**: 选择 `Production`, `Preview`, `Development`

#### HF_SPACE_TOKEN
- **Name**: `HF_SPACE_TOKEN`
- **Value**: `hf_your_access_token_here`
- **Environment**: 选择 `Production`, `Preview`, `Development`

### 3. 获取 HF Access Token

如果你还没有访问令牌：

1. 访问：https://huggingface.co/settings/tokens
2. 点击 **"New token"**
3. 配置令牌：
   - **Name**: `bg-removal-api`
   - **Type**: 选择 **"Read"**
4. 点击 **"Generate a token"**
5. 复制生成的令牌（格式：`hf_xxxxxxxxxx`）

### 4. 本地开发配置

在你的项目根目录创建 `.env.local` 文件：

```bash
# .env.local
# Hugging Face Space Configuration
HF_SPACE_URL=https://yelo1900-bg-remove-2.hf.space
HF_SPACE_TOKEN=hf_your_access_token_here
```

### 5. 验证配置

配置完成后，重新部署你的 Vercel 项目：

```bash
vercel --prod
```

或者通过 Git 推送触发自动部署。

## 测试配置

### 1. 测试 API 端点
```bash
curl https://your-vercel-app.vercel.app/api/bg/remove-direct
```

应该返回：
```json
{
  "status": "healthy",
  "service": "Background Removal Proxy",
  "hf_space_configured": true
}
```

### 2. 测试完整流程
1. 访问你的网站
2. 上传一张图片
3. 选择 "Solid Color" 模式
4. 点击 "Process Image"
5. 验证背景移除功能

## 故障排除

### 常见问题

#### 1. "HF Space configuration missing"
- 检查环境变量是否正确设置
- 确保变量名拼写正确
- 重新部署项目

#### 2. "Network error"
- 检查 HF Space 是否正在运行
- 访问 https://yelo1900-bg-remove-2.hf.space/health 验证服务状态

#### 3. "Request timeout"
- 图片可能太大，尝试压缩图片
- 检查网络连接

#### 4. "Authorization failed"
- 检查 HF_SPACE_TOKEN 是否有效
- 重新生成访问令牌

### 调试步骤

1. **检查 Vercel 函数日志**：
   - 在 Vercel Dashboard 中查看 Functions 日志
   - 查找错误信息

2. **检查 HF Space 日志**：
   - 访问 https://huggingface.co/spaces/Yelo1900/bg-remove-2
   - 点击 "Logs" 标签页

3. **本地测试**：
   ```bash
   npm run dev
   # 访问 http://localhost:3000/api/bg/remove-direct
   ```

## 安全注意事项

- ✅ 使用环境变量存储敏感信息
- ✅ 不要在代码中硬编码令牌
- ✅ 定期轮换访问令牌
- ✅ 使用最小权限原则（Read-only token）

## 性能优化

- 📊 图片自动压缩（大于 5MB）
- ⏱️ 60秒请求超时
- 🔄 自动重试机制
- 📈 进度显示和用户反馈
