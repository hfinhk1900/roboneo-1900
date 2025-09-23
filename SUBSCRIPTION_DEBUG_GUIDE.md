# 订阅状态调试指南

## 概述

当用户取消订阅后仍享受订阅福利时，使用以下工具进行诊断和修复。

## 🔧 调试工具

### 1. Web界面调试工具

**访问路径**: `/admin/debug/subscription`

**功能**:
- 快速检查用户订阅状态
- 查看用户所有支付记录
- 对比本地数据库与Stripe实时状态
- 一键完整诊断

**使用方法**:
1. 以管理员身份登录
2. 访问 `/admin/debug/subscription`
3. 输入要调试的用户ID
4. 点击"完整诊断"或选择特定检查项

### 2. 浏览器控制台调试

**脚本文件**: `debug-subscription-status.js`

**使用方法**:
```javascript
// 1. 在浏览器中打开网站
// 2. 按F12打开开发者工具
// 3. 在控制台中执行:

const script = document.createElement('script');
script.src = '/debug-subscription-status.js';
document.head.appendChild(script);

// 4. 脚本加载后执行诊断:
debugSubscriptionStatus('用户ID');
```

### 3. API直接调用

**端点**: `/api/debug/subscription-status`

**支持的操作**:
- `getActiveSubscription`: 获取活跃订阅
- `getAllPayments`: 获取所有支付记录  
- `checkStripeStatus`: 验证Stripe实时状态

**示例请求**:
```bash
curl -X POST /api/debug/subscription-status \
  -H "Content-Type: application/json" \
  -d '{"userId": "用户ID", "action": "getActiveSubscription"}'
```

### 4. 数据库直接查询

**文件**: `debug-subscription-sql.sql`

包含10个常用的SQL查询，用于：
- 查看用户支付记录
- 检查活跃/取消的订阅
- 发现数据不一致问题
- 统计订阅状态分布

**使用方法**:
1. 连接到PostgreSQL数据库
2. 将SQL文件中的'USER_ID'替换为实际用户ID
3. 执行相应的查询语句

## 🔍 诊断流程

### 步骤1: 快速状态检查
```
GET /api/debug/subscription-status?userId=USER_ID
```

### 步骤2: 详细记录分析
使用Web界面或API检查:
- 用户的所有支付记录
- 每条记录的状态和时间戳
- 是否有多个订阅记录

### 步骤3: Stripe状态验证
对比本地数据库与Stripe实时状态:
- 订阅状态是否一致
- 取消时间是否一致
- 期间结束时间是否匹配

### 步骤4: 问题定位
根据诊断结果确定问题类型:

#### 情况A: 数据库状态正确，但逻辑判断错误
- 检查`getActiveSubscriptionAction`逻辑
- 检查订阅福利检查逻辑
- 可能存在缓存问题

#### 情况B: 数据库状态错误
- Webhook处理失败
- 网络问题导致状态同步失败
- 需要手动更新数据库状态

#### 情况C: Stripe与本地不一致
- 检查webhook配置
- 检查API密钥和权限
- 可能需要强制同步

## 🛠️ 常见问题修复

### 修复1: 手动更新订阅状态
```sql
UPDATE payment 
SET status = 'canceled', updated_at = NOW()
WHERE user_id = 'USER_ID' 
  AND subscription_id = 'SUBSCRIPTION_ID';
```

### 修复2: 清除缓存
```javascript
// 如果使用了客户端缓存
localStorage.clear();
sessionStorage.clear();

// 强制页面刷新
window.location.reload();
```

### 修复3: 重新同步Stripe状态
```javascript
// 通过API强制同步
fetch('/api/debug/subscription-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    userId: 'USER_ID', 
    action: 'checkStripeStatus' 
  })
});
```

## 📋 检查清单

### Webhook配置检查
- [ ] Stripe Dashboard中webhook端点已配置
- [ ] 包含`customer.subscription.deleted`事件
- [ ] Webhook密钥正确设置
- [ ] 端点URL可访问

### 数据库完整性检查
- [ ] payment表有对应的订阅记录
- [ ] 状态字段值正确
- [ ] 时间戳字段准确
- [ ] 外键关联完整

### 代码逻辑检查
- [ ] `getActiveSubscriptionAction`查询条件正确
- [ ] 订阅福利检查逻辑正确
- [ ] 缓存处理机制正常
- [ ] 错误处理完善

## 🚨 紧急修复

如果发现大量用户受影响，可以执行批量修复：

### 1. 批量同步Stripe状态
```sql
-- 查找所有可能有问题的记录
SELECT user_id, subscription_id 
FROM payment 
WHERE status = 'active' 
  AND updated_at < NOW() - INTERVAL '1 day';
```

### 2. 批量更新过期订阅
```sql
-- 更新已过期但状态仍为active的订阅
UPDATE payment 
SET status = 'canceled', updated_at = NOW()
WHERE status = 'active' 
  AND period_end < NOW();
```

## 📞 技术支持

如果以上工具无法解决问题：

1. 收集完整的诊断日志
2. 记录具体的用户ID和订阅ID
3. 导出相关的数据库记录
4. 检查Stripe Dashboard的事件日志
5. 联系技术团队进行深入分析

## 🔄 预防措施

为防止此类问题再次发生：

1. **监控Webhook健康状态**
   - 设置Webhook失败告警
   - 定期检查处理日志

2. **定期数据一致性检查**
   - 每日对比本地与Stripe状态
   - 自动修复明显的不一致

3. **改进错误处理**
   - 增强Webhook重试机制
   - 添加手动同步功能

4. **增强日志记录**
   - 记录所有订阅状态变更
   - 保留详细的操作审计日志
