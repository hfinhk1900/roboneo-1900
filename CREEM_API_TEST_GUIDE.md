# Creem API 测试指南

## 📋 测试脚本说明

我为您创建了两个测试脚本来验证 Creem API 在测试模式下是否正常工作：

### 1. 完整测试脚本 - `test-creem-api.js`
- 全面的 API 测试套件
- 包含 API 密钥格式验证
- 多个测试场景
- 详细的错误分析和建议

### 2. 快速测试脚本 - `quick-creem-test.js`
- 简化版本，快速验证
- 专注于核心 checkout 功能
- 适合快速诊断

## 🚀 使用方法

### 方法 1: 使用环境变量（推荐）
```bash
# 设置环境变量
export CREEM_API_KEY=your_creem_api_key_here

# 运行完整测试
node test-creem-api.js

# 或运行快速测试
node quick-creem-test.js
```

### 方法 2: 直接传入 API 密钥
```bash
# 运行完整测试
CREEM_API_KEY=your_creem_api_key_here node test-creem-api.js

# 运行快速测试
CREEM_API_KEY=your_creem_api_key_here node quick-creem-test.js
```

## 🔍 测试内容

### 完整测试脚本包含：
1. **API 密钥格式验证**
   - 检查是否以 `creem_` 开头
   - 警告 Stripe 格式密钥（`sk_` 开头）

2. **基础 Checkout 测试**
   - 使用测试产品 ID
   - 验证 API 连接性

3. **产品信息获取测试**
   - 测试 GET 请求
   - 验证权限设置

4. **实际产品 ID 测试**
   - 使用您日志中的产品 ID
   - 诊断具体错误

### 快速测试脚本包含：
- 基本的 checkout 创建测试
- 状态码分析
- 简单的错误诊断

## 📊 预期结果

### ✅ 成功的响应
- **状态码**: 200 或 201
- **响应**: 包含 checkout URL 和 ID

### ❌ 常见错误
- **403 Forbidden**: API 密钥无效或权限不足
- **401 Unauthorized**: 缺少或错误的认证
- **404 Not Found**: 产品 ID 不存在

### ⚠️ 测试模式注意事项
- 使用测试 API 密钥（通常包含 "test" 字样）
- 产品 ID 应该是测试环境中的
- 不会产生真实费用

## 🔧 故障排除

### 如果收到 403 错误：
1. 检查 API 密钥是否以 `creem_` 开头
2. 确认 API 密钥来自 Creem Dashboard（不是 Stripe）
3. 验证 API 密钥权限设置

### 如果收到 404 错误：
1. 检查产品 ID 是否存在于 Creem Dashboard
2. 确认产品 ID 格式是否正确
3. 验证是否在正确的环境（测试/生产）

### 如果连接失败：
1. 检查网络连接
2. 确认 API 端点 `https://api.creem.io` 可访问
3. 检查防火墙设置

## 📝 示例输出

### 成功的测试输出：
```
🚀 开始测试 Creem API...
📋 API 密钥验证:
   ✅ 正确的 Creem API 密钥格式

🧪 测试 1: 创建简单的 Checkout
   状态码: 201
   ✅ Checkout 创建成功！

📊 测试结果汇总:
✅ 通过: 3/3 个测试
🎉 所有测试通过！Creem API 连接正常
```

### 失败的测试输出：
```
📋 API 密钥验证:
   ❌ 这是 Stripe API 密钥格式，不是 Creem 的！

🧪 测试 1: 创建简单的 Checkout
   状态码: 403
   ❌ 403 Forbidden - API 密钥无效或权限不足
```

## 💡 下一步

测试成功后：
1. 更新 Vercel 环境变量
2. 部署应用
3. 测试实际的支付流程

测试失败时：
1. 根据错误信息调整配置
2. 检查 Creem Dashboard 设置
3. 联系 Creem 支持（如需要）



creem_test_1RgN9IYysdot0UO4kTQRbX

# 替换为您的真实 API 密钥
CREEM_API_KEY=creem_test_1RgN9IYysdot0UO4kTQRbX node quick-creem-test.js
