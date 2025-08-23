# Cloudflare R2 配置指南

## 🚨 问题诊断

**当前状态**: R2 环境变量未配置，导致图片无法上传到 R2 存储

**错误原因**: 代码中使用的环境变量名称与 `env.example` 中的不匹配

## 🔧 解决方案

### 1. 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件，添加以下 R2 配置：

```bash
# Cloudflare R2 配置
CLOUDFLARE_R2_REGION="auto"
CLOUDFLARE_R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="your-bucket-name"
CLOUDFLARE_R2_PUBLIC_URL="https://pub-your-subdomain.r2.dev"
```

### 2. 获取 R2 配置信息

#### 步骤 1: 登录 Cloudflare Dashboard
- 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
- 选择你的账户

#### 步骤 2: 创建 R2 存储桶
- 进入 "R2 Object Storage" 部分
- 点击 "Create bucket"
- 输入存储桶名称（例如：`roboneo-art-storage`）
- 选择区域（建议选择离用户最近的区域）

#### 步骤 3: 创建 API 令牌
- 进入 "My Profile" → "API Tokens"
- 点击 "Create Token"
- 选择 "Custom token" 模板
- 权限设置：
  - Account: R2 Object Storage:Edit
  - Zone: 如果需要的话，添加相关权限
- 创建令牌并保存 Access Key ID 和 Secret Access Key

#### 步骤 4: 配置公共访问
- 在 R2 存储桶设置中启用公共访问
- 记录公共访问 URL

### 3. 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `CLOUDFLARE_R2_REGION` | R2 区域 | `auto` 或具体区域如 `us-east-1` |
| `CLOUDFLARE_R2_ENDPOINT` | R2 端点 URL | `https://your-account-id.r2.cloudflarestorage.com` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | 访问密钥 ID | 从 API 令牌获取 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | 访问密钥 | 从 API 令牌获取 |
| `CLOUDFLARE_R2_BUCKET_NAME` | 存储桶名称 | 你创建的存储桶名称 |
| `CLOUDFLARE_R2_PUBLIC_URL` | 公共访问 URL | `https://pub-your-subdomain.r2.dev` |

### 4. 验证配置

配置完成后：

1. **重启开发服务器**:
   ```bash
   ppm dev
   ```

2. **测试 R2 连接**:
   - 上传图片到 Solid Color 模式
   - 观察控制台日志
   - 检查 R2 存储桶中是否出现 `aibackgrounsolidcolor` 文件夹

### 5. 常见问题

#### 问题 1: "Access Denied"
- 检查 API 令牌权限是否正确
- 确认存储桶名称拼写正确

#### 问题 2: "Invalid Endpoint"
- 检查端点 URL 格式
- 确认账户 ID 正确

#### 问题 3: "Bucket Not Found"
- 确认存储桶名称正确
- 检查存储桶是否在正确的账户下

### 6. 安全注意事项

- `.env.local` 文件已添加到 `.gitignore`，不会被提交到版本控制
- 生产环境请使用环境变量或密钥管理服务
- 定期轮换 API 令牌
- 限制 API 令牌权限范围

## 🎯 下一步

1. 按照上述步骤配置 R2 环境变量
2. 重启开发服务器
3. 测试 Solid Color 功能
4. 验证图片是否成功上传到 R2

配置完成后，Solid Color 模式的图片应该能够成功上传到 R2 存储，并在 `aibackgrounsolidcolor/{userId}/` 文件夹中看到处理后的图片。
