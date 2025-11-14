# 🚀 Vercel 项目迁移指南

## ✅ 第一步：代码推送（已完成）
代码已成功推送到新仓库：`https://github.com/hfinhk1900/roboneo-1900.git`

---

## 📦 第二步：在 Vercel 新账户中导入项目

### 1. 登录 Vercel 新账户
访问：https://vercel.com

### 2. 导入 GitHub 项目
1. 点击 **"Add New"** → **"Project"**
2. 如果是第一次使用，需要连接 GitHub 账户：
   - 点击 **"Continue with GitHub"**
   - 授权 Vercel 访问你的 GitHub 账户 `hfinhk1900`
3. 在项目列表中找到 **`roboneo-1900`**
4. 点击 **"Import"**

### 3. 配置项目设置
- **Project Name**: `roboneo-art` (或保持 `roboneo-1900`）
- **Framework Preset**: Next.js（应该自动检测）
- **Root Directory**: `./` (默认）
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

**⚠️ 重要：先不要点击 "Deploy"！**

---

## 🔑 第三步：配置环境变量

在点击 "Deploy" 之前，需要添加所有必需的环境变量。

### 📋 必需的环境变量清单

点击 **"Environment Variables"** 部分，逐个添加以下变量：

#### 1. 基础配置
```bash
NEXT_PUBLIC_BASE_URL=https://roboneo.art
```

#### 2. 数据库配置（从旧项目复制）
```bash
DATABASE_URL=你的数据库连接字符串
DATABASE_SSL=false
ADMIN_EMAIL=你的管理员邮箱
```

#### 3. 认证配置（从旧项目复制）
```bash
BETTER_AUTH_SECRET=你的认证密钥
```

#### 4. OAuth 配置（从旧项目复制）
```bash
GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端密钥
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
```

#### 5. 邮件服务（Resend）（从旧项目复制）
```bash
RESEND_API_KEY=你的Resend API密钥
RESEND_AUDIENCE_ID=你的受众ID
```

#### 6. 存储配置（Cloudflare R2）（从旧项目复制）
```bash
STORAGE_REGION=auto
STORAGE_BUCKET_NAME=你的存储桶名称
STORAGE_ACCESS_KEY_ID=你的访问密钥ID
STORAGE_SECRET_ACCESS_KEY=你的访问密钥
STORAGE_ENDPOINT=你的R2端点URL
STORAGE_PUBLIC_URL=你的公共访问URL
```

#### 7. 支付配置（Creem 或 Stripe）（从旧项目复制）
```bash
# 设置支付提供商
NEXT_PUBLIC_PAYMENT_PROVIDER=creem

# Creem 配置
CREEM_API_KEY=你的Creem API密钥
CREEM_WEBHOOK_SECRET=你的Webhook密钥
NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY=prod_xxxxxx
NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY=prod_xxxxxx
NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY=prod_xxxxxx
NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY=prod_xxxxxx

# 或 Stripe 配置（如果使用 Stripe）
STRIPE_SECRET_KEY=你的Stripe密钥
STRIPE_WEBHOOK_SECRET=你的Webhook密钥
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_MONTHLY=price_xxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_YEARLY=price_xxxxxx
```

#### 8. 安全配置（从旧项目复制或重新生成）
```bash
URL_SIGNING_SECRET=你的URL签名密钥
CRON_API_KEY=你的Cron API密钥
```

#### 9. AI 服务配置（从旧项目复制）
```bash
# Hugging Face Space（背景移除）
HF_SPACE_URL=https://yelo1900-bg-remove-2.hf.space
HF_SPACE_TOKEN=你的HF访问令牌

# AI API 密钥
FAL_API_KEY=你的FAL API密钥
FIREWORKS_API_KEY=你的Fireworks API密钥
OPENAI_API_KEY=你的OpenAI API密钥
REPLICATE_API_TOKEN=你的Replicate令牌
SILICONFLOW_API_KEY=你的SiliconFlow密钥
```

#### 10. Cloudflare Turnstile（验证码）（从旧项目复制）
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=你的站点密钥
TURNSTILE_SECRET_KEY=你的密钥
```

#### 11. 分析工具（可选，从旧项目复制）
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=你的GA ID
NEXT_PUBLIC_CLARITY_ID=你的Clarity ID
# 其他分析工具...
```

#### 12. 通知配置（可选，从旧项目复制）
```bash
DISCORD_WEBHOOK_URL=你的Discord Webhook URL
FEISHU_WEBHOOK_URL=你的飞书Webhook URL
```

### 💡 如何获取旧项目的环境变量

1. 登录旧的 Vercel 账户
2. 进入旧项目的 Settings → Environment Variables
3. 逐个复制所有变量的值

**⚠️ 注意：**
- 所有环境变量都应该选择 **"Production"** 环境
- 敏感信息（如 API 密钥）不要分享给他人

---

## 🚀 第四步：部署项目

### 1. 开始部署
添加完所有环境变量后，点击 **"Deploy"** 按钮

### 2. 等待部署完成
- 构建过程大约需要 3-5 分钟
- 可以查看部署日志了解进度

### 3. 获取新的 Vercel 域名
部署成功后，你会获得一个临时域名，格式类似：
```
https://roboneo-1900.vercel.app
```
或
```
https://roboneo-1900-xxx.vercel.app
```

---

## 🌐 第五步：更新 Cloudflare DNS 解析

### 1. 登录 Cloudflare
访问：https://dash.cloudflare.com

### 2. 选择域名
找到 `roboneo.art` 域名并进入管理页面

### 3. 更新 DNS 记录
1. 进入 **DNS** → **Records**
2. 找到指向旧 Vercel 的 CNAME 记录
3. 编辑该记录：
   - **Type**: CNAME
   - **Name**: @ (或 www)
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: Proxied（橙色云朵）
4. 点击 **Save**

### 4. 在 Vercel 中添加自定义域名
1. 在新的 Vercel 项目中，进入 **Settings** → **Domains**
2. 点击 **"Add"**
3. 输入域名：`roboneo.art` 和 `www.roboneo.art`
4. Vercel 会自动验证 DNS 配置

### 5. 等待 DNS 传播
- 通常需要 5-30 分钟
- 可以使用 https://dnschecker.org 检查传播状态

---

## ✅ 第六步：验证部署

### 1. 访问网站
在浏览器中打开：https://roboneo.art

### 2. 检查功能
- [ ] 网站能正常访问
- [ ] 用户登录功能正常
- [ ] 图片上传功能正常
- [ ] AI 功能正常工作
- [ ] 支付功能正常

### 3. 检查环境变量
访问一些需要环境变量的功能：
- 背景移除功能（测试 HF_SPACE_URL）
- 用户注册/登录（测试 DATABASE_URL）
- 图片上传（测试 R2 配置）
- 支付功能（测试支付配置）

---

## 🔧 常见问题排查

### 1. 部署失败
- 检查构建日志，查看具体错误
- 确保所有必需的环境变量都已添加
- 检查环境变量的值是否正确

### 2. 功能不正常
- 在 Vercel 项目的 **Settings** → **Environment Variables** 中检查配置
- 确保敏感变量（如 API 密钥）没有多余的空格或引号
- 修改环境变量后需要重新部署

### 3. 域名无法访问
- 检查 Cloudflare DNS 设置
- 确保 Vercel 中已添加自定义域名
- 等待 DNS 传播完成

### 4. SSL 证书问题
- Vercel 会自动配置 SSL 证书
- 如果证书未生效，等待 10-30 分钟
- 确保 Cloudflare 的 SSL/TLS 设置为 "Full" 或 "Full (strict)"

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 具体的错误信息
2. 部署日志截图
3. 出问题的具体功能

---

## 🎉 迁移完成后

### 1. 更新 Webhook URLs
如果使用了 Webhook（如支付、OAuth 回调），需要更新：
- Stripe/Creem Webhook URL
- GitHub/Google OAuth 回调 URL

### 2. 测试所有功能
确保所有功能在新环境中正常工作

### 3. 监控新账户使用情况
- 在 Vercel Dashboard 查看使用量
- 确保在免费额度范围内

### 4. （可选）停用旧项目
确认新项目完全正常后，可以在旧账户中：
- 暂停旧项目的部署
- 保留一段时间以备不时之需

---

**祝迁移顺利！🚀**

