# 📋 环境变量导出清单

## 从旧 Vercel 项目获取环境变量

### 方法一：通过 Vercel Dashboard（推荐）

1. **登录旧的 Vercel 账户**
   - 访问：https://vercel.com
   - 使用旧账户登录

2. **进入旧项目**
   - 找到 `roboneo-art` 项目
   - 点击进入

3. **打开环境变量设置**
   - 点击 **Settings** 选项卡
   - 左侧菜单选择 **Environment Variables**

4. **复制所有环境变量**
   - 逐个查看并复制每个变量的值
   - 建议使用下面的清单表格记录

---

## 📝 环境变量记录表

### ✅ 基础配置
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://roboneo.art`

### ✅ 数据库
- [ ] `DATABASE_URL` = `_______________________________`
- [ ] `DATABASE_SSL` = `false`
- [ ] `ADMIN_EMAIL` = `_______________________________`

### ✅ 认证
- [ ] `BETTER_AUTH_SECRET` = `_______________________________`

### ✅ OAuth（GitHub）
- [ ] `GITHUB_CLIENT_ID` = `_______________________________`
- [ ] `GITHUB_CLIENT_SECRET` = `_______________________________`

### ✅ OAuth（Google）
- [ ] `GOOGLE_CLIENT_ID` = `_______________________________`
- [ ] `GOOGLE_CLIENT_SECRET` = `_______________________________`

### ✅ 邮件服务（Resend）
- [ ] `RESEND_API_KEY` = `_______________________________`
- [ ] `RESEND_AUDIENCE_ID` = `_______________________________`

### ✅ 存储（Cloudflare R2）
- [ ] `STORAGE_REGION` = `auto`
- [ ] `STORAGE_BUCKET_NAME` = `_______________________________`
- [ ] `STORAGE_ACCESS_KEY_ID` = `_______________________________`
- [ ] `STORAGE_SECRET_ACCESS_KEY` = `_______________________________`
- [ ] `STORAGE_ENDPOINT` = `_______________________________`
- [ ] `STORAGE_PUBLIC_URL` = `_______________________________`

### ✅ 支付（选择你使用的支付提供商）

#### 支付提供商设置
- [ ] `NEXT_PUBLIC_PAYMENT_PROVIDER` = `creem` 或 `stripe`

#### Creem（如果使用）
- [ ] `CREEM_API_KEY` = `_______________________________`
- [ ] `CREEM_WEBHOOK_SECRET` = `_______________________________`
- [ ] `NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY` = `_______________________________`

#### Stripe（如果使用）
- [ ] `STRIPE_SECRET_KEY` = `_______________________________`
- [ ] `STRIPE_WEBHOOK_SECRET` = `_______________________________`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_MONTHLY` = `_______________________________`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_YEARLY` = `_______________________________`

### ✅ 安全
- [ ] `URL_SIGNING_SECRET` = `_______________________________`
- [ ] `CRON_API_KEY` = `_______________________________`

### ✅ AI 服务

#### Hugging Face
- [ ] `HF_SPACE_URL` = `https://yelo1900-bg-remove-2.hf.space`
- [ ] `HF_SPACE_TOKEN` = `_______________________________`

#### AI API 密钥
- [ ] `FAL_API_KEY` = `_______________________________`
- [ ] `FIREWORKS_API_KEY` = `_______________________________`
- [ ] `OPENAI_API_KEY` = `_______________________________`
- [ ] `REPLICATE_API_TOKEN` = `_______________________________`
- [ ] `SILICONFLOW_API_KEY` = `_______________________________`

### ✅ 验证码（Cloudflare Turnstile）
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = `_______________________________`
- [ ] `TURNSTILE_SECRET_KEY` = `_______________________________`

### ✅ 分析工具（可选）
- [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` = `_______________________________`
- [ ] `NEXT_PUBLIC_CLARITY_ID` = `_______________________________`
- [ ] `NEXT_PUBLIC_UMAMI_WEBSITE_ID` = `_______________________________`
- [ ] `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` = `_______________________________`
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = `_______________________________`

### ✅ 通知（可选）
- [ ] `DISCORD_WEBHOOK_URL` = `_______________________________`
- [ ] `FEISHU_WEBHOOK_URL` = `_______________________________`

### ✅ 联盟营销（可选）
- [ ] `NEXT_PUBLIC_AFFILIATE_AFFONSO_ID` = `_______________________________`
- [ ] `NEXT_PUBLIC_AFFILIATE_PROMOTEKIT_ID` = `_______________________________`

---

## 方法二：使用 Vercel CLI

如果你安装了 Vercel CLI，可以使用以下命令导出环境变量：

```bash
# 1. 登录旧账户
vercel login

# 2. 拉取环境变量
vercel env pull .env.production

# 3. 查看文件内容
cat .env.production
```

---

## ⚠️ 重要提示

1. **不要分享这些值**
   - 这些是敏感信息，包含 API 密钥和密码
   - 不要提交到 Git
   - 不要在公共场所分享

2. **复制时注意**
   - 确保没有多余的空格
   - 确保没有引号（除非值本身包含引号）
   - 某些值可能很长，注意复制完整

3. **测试顺序**
   - 先添加必需的变量（标记为 ✅）
   - 再添加可选的变量
   - 分批测试功能

4. **备份**
   - 将这些值保存在安全的地方
   - 建议使用密码管理器（如 1Password, Bitwarden）

---

## 📌 下一步

完成环境变量记录后：
1. ✅ 打开迁移指南：`VERCEL_MIGRATION_GUIDE.md`
2. ✅ 按照指南第二步开始在新 Vercel 账户中导入项目
3. ✅ 在导入时添加所有记录的环境变量

**准备好了吗？让我知道你的进度！**

