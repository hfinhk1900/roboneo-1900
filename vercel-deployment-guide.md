# 🚀 Vercel 部署完整指南

## 📋 部署前准备

### 1. 项目结构检查
确保你的项目有以下结构：
```
your-project/
├── app/
│   ├── api/
│   │   └── bg/
│   │       └── remove-direct/
│   │           └── route.ts
│   ├── components/
│   │   └── aibg-generator.tsx
│   └── page.tsx
├── lib/
│   └── private-bg-removal-service.ts
├── hooks/
│   └── use-private-bg-removal.ts
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

### 2. 依赖检查
确保 `package.json` 包含必要依赖：
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "sonner": "^1.0.0"
  }
}
```

## 🔧 Vercel 账户设置

### 1. 创建 Vercel 账户
- 访问：https://vercel.com
- 使用 GitHub/GitLab/Bitbucket 账户登录
- 完成账户验证

### 2. 连接 Git 仓库
- 确保你的项目已推送到 Git 仓库（GitHub/GitLab/Bitbucket）
- 在 Vercel Dashboard 点击 "New Project"
- 选择你的 Git 提供商
- 授权 Vercel 访问你的仓库

## 📁 文件部署准备

### 1. 复制集成文件
将我们创建的文件复制到正确位置：

```bash
# 创建目录结构
mkdir -p app/api/bg/remove-direct
mkdir -p lib
mkdir -p hooks

# 复制文件
cp app-api-bg-remove-direct-route.ts app/api/bg/remove-direct/route.ts
cp lib-private-bg-removal-service.ts lib/private-bg-removal-service.ts
cp hooks-use-private-bg-removal.ts hooks/use-private-bg-removal.ts
```

### 2. 更新现有组件
参考 `aibg-generator-integration.tsx`，更新你的现有组件文件。

### 3. 创建环境变量文件
创建 `.env.local`（用于本地开发）：
```bash
# .env.local
HF_SPACE_URL=https://yelo1900-bg-remove-2.hf.space
HF_SPACE_TOKEN=hf_your_token_here
```

**注意**：不要将 `.env.local` 提交到 Git！

## 🔑 获取 HF Access Token

### 1. 访问 Hugging Face
- 登录：https://huggingface.co
- 访问：https://huggingface.co/settings/tokens

### 2. 创建新令牌
- 点击 "New token"
- 配置：
  - **Name**: `bg-removal-vercel`
  - **Type**: 选择 "Read"
- 点击 "Generate a token"
- 复制令牌（格式：`hf_xxxxxxxxxx`）

## 🚀 Vercel 部署步骤

### 1. 推送代码到 Git
```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Add private background removal integration"

# 推送到远程仓库
git push origin main
```

### 2. 在 Vercel 中导入项目
1. 访问 Vercel Dashboard
2. 点击 "New Project"
3. 选择你的 Git 仓库
4. 点击 "Import"

### 3. 配置项目设置
在导入页面：
- **Project Name**: 输入项目名称
- **Framework Preset**: 选择 "Next.js"
- **Root Directory**: 保持默认 "./"
- **Build Command**: 保持默认
- **Output Directory**: 保持默认

### 4. 配置环境变量
在部署前，点击 "Environment Variables" 展开：

添加以下变量：
- **Name**: `HF_SPACE_URL`
  **Value**: `https://yelo1900-bg-remove-2.hf.space`
- **Name**: `HF_SPACE_TOKEN`
  **Value**: `hf_your_actual_token_here`

### 5. 开始部署
点击 "Deploy" 开始部署。

## 📊 部署后验证

### 1. 检查部署状态
- 等待部署完成（通常 2-5 分钟）
- 查看构建日志确保无错误
- 获取部署 URL

### 2. 测试 API 端点
```bash
# 替换为你的实际域名
curl https://your-app.vercel.app/api/bg/remove-direct

# 预期响应
{
  "status": "healthy",
  "service": "Background Removal Proxy",
  "hf_space_configured": true
}
```

### 3. 测试前端功能
1. 访问你的 Vercel 应用
2. 上传测试图片
3. 选择 "Solid Color" 模式
4. 测试背景移除功能

## 🔧 常见部署问题

### 1. 构建失败
**问题**: TypeScript 类型错误
**解决**:
```bash
# 本地检查类型
npm run type-check

# 修复类型错误后重新部署
```

### 2. API 路由 404
**问题**: API 路由不存在
**解决**:
- 检查文件路径：`app/api/bg/remove-direct/route.ts`
- 确保文件名正确
- 重新部署

### 3. 环境变量未生效
**问题**: 环境变量配置错误
**解决**:
- 在 Vercel Dashboard → Settings → Environment Variables 检查
- 确保变量名拼写正确
- 重新部署项目

### 4. HF Space 连接失败
**问题**: 无法连接到 HF Space
**解决**:
- 检查 HF Space 是否运行：https://yelo1900-bg-remove-2.hf.space/health
- 验证 Access Token 是否有效
- 检查网络连接

## 📈 部署优化建议

### 1. 性能优化
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: ['your-domain.com'],
  },
}

module.exports = nextConfig
```

### 2. 缓存策略
```typescript
// 在 API 路由中添加缓存头
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

### 3. 错误监控
考虑集成错误监控服务：
- Sentry
- LogRocket
- Vercel Analytics

## 🎯 部署成功标准

部署成功后，你应该能够：
- ✅ 访问你的 Vercel 应用
- ✅ API 健康检查返回正确状态
- ✅ 前端背景移除功能正常工作
- ✅ 错误处理和用户反馈正常
- ✅ 图片上传和处理流畅

## 🔄 后续维护

### 1. 自动部署
- 每次推送到主分支自动触发部署
- 可以设置预览部署分支

### 2. 监控和日志
- 在 Vercel Dashboard 查看函数日志
- 监控 API 使用情况和性能

### 3. 更新和维护
- 定期更新依赖
- 监控 HF Space 状态
- 轮换访问令牌

准备好开始部署了吗？需要我帮你检查任何特定的配置吗？
