# Vercel 环境变量配置

## 🎯 需要在 Vercel Dashboard 中设置的环境变量

基于您创建的 4 个 Creem 产品，请在 **Vercel Dashboard** → **Environment Variables** 中设置以下变量：

### 📋 Creem 产品 ID 配置

```bash
# PRO 套餐
NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY=prod_4irkpIUIDcEtbFraaLU2TT
NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY=prod_rbE5gREcbO1fQUrsCjYXQ

# ULTIMATE 套餐
NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY=prod_2P4YC31e5tjLOVNEfREgUY
NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY=prod_4R24ChuSuPcH7CVz9qf3YR

# 支付提供商设置
NEXT_PUBLIC_PAYMENT_PROVIDER=creem

# Base URL (如果还没设置)
NEXT_PUBLIC_BASE_URL=https://roboneo-art.vercel.app

# Creem API 密钥 (使用您的测试密钥)
CREEM_API_KEY=creem_test_your_api_key_here
CREEM_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🚀 设置步骤

### 1. 登录 Vercel Dashboard
前往：https://vercel.com/dashboard

### 2. 进入项目设置
- 找到 `roboneo-art` 项目
- 点击 "Settings" 选项卡
- 点击 "Environment Variables"

### 3. 添加每个环境变量
对于上面列出的每个变量：
- 点击 "Add New"
- 输入变量名和值
- **重要：勾选 "Production" 环境**
- 点击 "Save"

### 4. 重新部署
设置完所有变量后，触发重新部署

## 🧪 测试 API 连接

设置环境变量之前，先测试 API 连接：

```bash
# 使用您的 Creem 测试 API 密钥
CREEM_API_KEY=creem_test_xxxxx node quick-creem-test.js
```

## 📋 产品映射确认

| 套餐类型 | 计费周期 | 产品 ID | 测试 URL |
|---------|---------|---------|----------|
| PRO | Monthly | `prod_4irkpIUIDcEtbFraaLU2TT` | https://www.creem.io/test/payment/prod_4irkpIUIDcEtbFraaLU2TT |
| PRO | Yearly | `prod_rbE5gREcbO1fQUrsCjYXQ` | https://www.creem.io/test/payment/prod_rbE5gREcbO1fQUrsCjYXQ |
| ULTIMATE | Monthly | `prod_2P4YC31e5tjLOVNEfREgUY` | https://www.creem.io/test/payment/prod_2P4YC31e5tjLOVNEfREgUY |
| ULTIMATE | Yearly | `prod_4R24ChuSuPcH7CVz9qf3YR` | https://www.creem.io/test/payment/prod_4R24ChuSuPcH7CVz9qf3YR |

## ✅ 完成检查清单

- [ ] 运行 API 测试确认连接正常
- [ ] 在 Vercel 中设置所有环境变量
- [ ] 确认所有变量都勾选了 "Production" 环境
- [ ] 触发重新部署
- [ ] 测试支付流程
- [ ] 检查 Vercel 运行时日志确认无错误
