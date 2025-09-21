# 🗑️ 用户删除系统 - 完整使用指南

## ✅ **系统已部署完成**

用户删除系统现已完全部署并集成到管理员面板中！

## 🎯 **三种删除用户的方法**

### **方法1：管理员面板 (最推荐)**

#### **访问管理员面板**：
```
https://your-domain.com/admin/tools
```

#### **使用步骤**：
1. **登录管理员账户**
2. **访问 `/admin/tools` 页面**
3. **找到 "🗑️ User Management" 卡片**
4. **输入要删除的用户邮箱**
5. **点击 "搜索用户" 查看详细信息**
6. **确认后点击 "确认删除"**

#### **功能特点**：
- ✅ **安全预览**: 删除前显示所有相关数据
- ✅ **管理员保护**: 自动阻止删除管理员用户
- ✅ **完整清理**: 自动删除数据库+R2存储+IndexedDB
- ✅ **详细统计**: 显示待删除的数据量和类型

---

### **方法2：浏览器控制台脚本 (快速)**

#### **加载删除工具**：
1. **访问管理员面板页面** (`/admin/tools`)
2. **打开浏览器控制台** (F12 → Console)
3. **加载删除脚本**：

```javascript
// 加载用户删除工具
const script = document.createElement('script');
script.src = '/quick-user-deletion.js';
document.head.appendChild(script);
```

#### **使用命令**：
```javascript
// 删除单个用户
await deleteUser('user@example.com');

// 批量删除多个用户
await batchDeleteUsers([
  'test1@example.com', 
  'test2@example.com', 
  'test3@example.com'
]);

// 验证删除结果
await verifyUserDeleted('user@example.com');
```

---

### **方法3：直接API调用 (开发者)**

#### **API端点**：

**查找用户**：
```bash
GET /api/admin/find-user?email=user@example.com
```

**预览删除**：
```bash
GET /api/admin/delete-user?userId=USER_ID
```

**执行删除**：
```bash
DELETE /api/admin/delete-user?userId=USER_ID
```

#### **cURL示例**：
```bash
# 1. 查找用户ID
USER_ID=$(curl -s -X GET "https://your-domain.com/api/admin/find-user?email=test@example.com" \
  -H "Cookie: your-session-cookie" | jq -r '.userId')

# 2. 预览删除信息
curl -X GET "https://your-domain.com/api/admin/delete-user?userId=$USER_ID" \
  -H "Cookie: your-session-cookie"

# 3. 执行删除
curl -X DELETE "https://your-domain.com/api/admin/delete-user?userId=$USER_ID" \
  -H "Cookie: your-session-cookie"
```

---

## 🔍 **删除范围详解**

### **数据库清理**：
- ✅ `user` - 用户基本信息
- ✅ `account` - 登录凭据
- ✅ `session` - 会话记录
- ✅ `payment` - 付费记录
- ✅ `assets` - 资产文件记录
- ✅ `aibg_history` - AI背景历史
- ✅ `profile_picture_history` - 头像制作历史
- ✅ `sticker_history` - 贴纸生成历史
- ✅ `productshot_history` - 产品拍摄历史
- ✅ `watermark_history` - 水印移除历史
- ✅ `credits_transaction` - 积分交易记录
- ✅ `ailog_history` - AI操作日志

### **文件存储清理**：
- ✅ **R2存储**: 所有用户上传和生成的图片文件
- ✅ **IndexedDB**: 前端本地缓存数据

### **级联删除**：
数据库使用 `ON DELETE CASCADE` 约束，删除用户时自动清理所有关联数据。

---

## 🛡️ **安全保护机制**

### **权限控制**：
- ❌ **只有管理员** 才能访问删除功能
- ❌ **管理员保护** 无法删除其他管理员用户
- ❌ **用户验证** 必须确认用户存在才能删除

### **删除确认**：
- 📊 **详细预览** 显示所有待删除数据
- ⚠️ **二次确认** 防止误删操作
- 📝 **操作日志** 记录删除操作详情

### **错误处理**：
- 🔄 **事务回滚** 删除失败时自动回滚
- 📋 **详细报错** 提供具体失败原因
- 🛠️ **部分失败处理** R2文件删除失败不影响数据库清理

---

## 🎉 **删除后效果**

### **用户可重新注册**：
- ✅ **邮箱释放** 该邮箱可以重新注册
- ✅ **全新账户** 重新注册后获得全新的用户ID
- ✅ **初始积分** 新账户获得10个初始积分
- ✅ **独立数据** 完全独立的数据存储空间

### **数据完全隔离**：
- ✅ **数据库隔离** 新用户ID确保数据不冲突
- ✅ **存储隔离** 新的R2存储路径
- ✅ **前端隔离** 新的IndexedDB数据库

---

## 🔧 **故障排除**

### **常见问题**：

**Q: 删除失败，提示"User not found"？**
A: 检查邮箱是否正确，或者用户已经被删除。

**Q: 无法删除，提示"Cannot delete admin user"？**
A: 系统保护机制，无法删除管理员用户。

**Q: R2文件删除失败？**
A: 不影响数据库删除，用户数据已清理，文件会在R2中孤立存在。

**Q: IndexedDB清理失败？**
A: 需要用户在浏览器中手动清理或下次访问时自动覆盖。

### **手动清理IndexedDB**：
```javascript
// 清理特定用户的IndexedDB
async function cleanUserIndexedDB(userId) {
  const deleteRequest = indexedDB.deleteDatabase(`RoboneoImageLibrary_${userId}`);
  deleteRequest.onsuccess = () => console.log('✅ IndexedDB清理成功');
  deleteRequest.onerror = () => console.log('❌ IndexedDB清理失败');
}
```

---

## 📊 **批量操作示例**

### **批量删除测试账户**：
```javascript
// 批量删除所有test邮箱
const testEmails = [
  'test1@example.com',
  'test2@example.com', 
  'test3@example.com',
  'demo@example.com',
  'sample@example.com'
];

// 执行批量删除
const results = await batchDeleteUsers(testEmails);

// 检查结果
console.log(`成功删除: ${results.filter(r => r.success).length} 个用户`);
console.log(`删除失败: ${results.filter(r => !r.success).length} 个用户`);
```

### **验证删除结果**：
```javascript
// 验证所有用户是否删除成功
for (const email of testEmails) {
  const deleted = await verifyUserDeleted(email);
  console.log(`${email}: ${deleted ? '✅ 已删除' : '❌ 仍存在'}`);
}
```

---

## 🎯 **最佳实践**

1. **删除前备份** 重要用户数据（如果需要）
2. **使用管理员面板** 最安全和直观的删除方式
3. **批量操作** 大量删除时使用控制台脚本
4. **验证删除** 删除后验证用户是否真正移除
5. **记录操作** 保留删除操作的记录以便追踪

**现在您可以安全、便捷地管理用户账户了！** 🚀
