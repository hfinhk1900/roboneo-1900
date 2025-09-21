# 🗑️ 用户删除完整指南

## 📋 **删除用户的多种方法**

### 🎯 **方法1：管理员面板删除 (推荐)**

#### **步骤1：添加管理员组件到admin页面**

在 `src/components/admin/admin-tools-page.tsx` 中添加：

```tsx
import { UserManagement } from '@/components/admin/user-management';

// 在组件中添加新卡片
<Card>
  <CardHeader>
    <CardTitle>🗑️ 用户管理</CardTitle>
  </CardHeader>
  <CardContent>
    <UserManagement />
  </CardContent>
</Card>
```

#### **步骤2：使用管理员面板**

1. 访问 `/admin/tools` 页面
2. 在"用户管理"部分输入要删除的用户邮箱
3. 点击"搜索用户"查看用户信息和数据统计
4. 确认后点击"确认删除"

#### **删除范围**：
✅ **数据库**：用户账户、会话、支付记录、所有历史记录
✅ **R2存储**：用户上传和生成的所有图片文件
✅ **级联删除**：所有关联的子表数据
❌ **IndexedDB**：需要前端手动清理

---

### 🔧 **方法2：直接API调用**

#### **查找用户**：
```bash
curl -X GET "https://your-domain.com/api/admin/find-user?email=user@example.com" \
  -H "Cookie: your-admin-session-cookie"
```

#### **预览删除信息**：
```bash
curl -X GET "https://your-domain.com/api/admin/delete-user?userId=USER_ID" \
  -H "Cookie: your-admin-session-cookie"
```

#### **执行删除**：
```bash
curl -X DELETE "https://your-domain.com/api/admin/delete-user?userId=USER_ID" \
  -H "Cookie: your-admin-session-cookie"
```

---

### 💻 **方法3：数据库直接操作**

#### **PostgreSQL命令**：

```sql
-- ⚠️ 危险操作：直接删除用户（CASCADE会自动清理关联数据）
-- 1. 首先查看用户信息
SELECT id, email, name, credits, created_at FROM "user" WHERE email = 'user@example.com';

-- 2. 查看用户的资产文件（需要手动删除R2文件）
SELECT key FROM assets WHERE user_id = 'USER_ID';

-- 3. 删除用户（CASCADE会自动删除所有关联数据）
DELETE FROM "user" WHERE id = 'USER_ID';
```

**注意**: 数据库直接删除不会清理R2存储文件，需要手动清理。

---

### 🧹 **方法4：前端数据清理**

#### **清理用户的IndexedDB数据**：

```javascript
// 在浏览器控制台执行，清理特定用户的IndexedDB
async function deleteUserIndexedDB(userId) {
  const dbName = `RoboneoImageLibrary_${userId}`;

  console.log(`🗑️ 删除用户${userId}的IndexedDB: ${dbName}`);

  const deleteRequest = indexedDB.deleteDatabase(dbName);

  deleteRequest.onsuccess = () => {
    console.log(`✅ ${dbName} 删除成功`);
  };

  deleteRequest.onerror = (error) => {
    console.log(`❌ ${dbName} 删除失败:`, error);
  };
}

// 使用方法
deleteUserIndexedDB('user123');
```

---

## 🔄 **完整删除流程**

### **推荐完整删除步骤**：

1. **🔍 管理员面板删除** (自动处理数据库+R2)
2. **🧹 前端数据清理** (清理该用户的IndexedDB)
3. **✅ 验证删除结果**

### **验证删除完成**：

```sql
-- 验证数据库删除
SELECT COUNT(*) FROM "user" WHERE email = 'user@example.com'; -- 应该返回0

-- 验证关联数据删除
SELECT COUNT(*) FROM assets WHERE user_id = 'DELETED_USER_ID'; -- 应该返回0
SELECT COUNT(*) FROM aibg_history WHERE "user_id" = 'DELETED_USER_ID'; -- 应该返回0
```

---

## ⚠️ **安全注意事项**

### **删除限制**：
- ❌ **无法删除管理员用户** (API会阻止)
- ❌ **无法删除不存在的用户** (API会返回404)
- ✅ **支持预览模式** (可以先查看要删除的数据)

### **数据恢复**：
- ⚠️ **数据库删除不可逆**
- ⚠️ **R2文件删除不可逆**
- 💡 **建议删除前先备份重要数据**

### **批量删除**：
```bash
# 批量删除多个用户的脚本示例
#!/bin/bash

USER_EMAILS=(
  "test1@example.com"
  "test2@example.com"
  "test3@example.com"
)

for email in "${USER_EMAILS[@]}"; do
  echo "正在删除用户: $email"

  # 查找用户ID
  USER_ID=$(curl -s -X GET "https://your-domain.com/api/admin/find-user?email=$email" \
    -H "Cookie: your-session" | jq -r '.userId')

  if [ "$USER_ID" != "null" ]; then
    # 执行删除
    curl -X DELETE "https://your-domain.com/api/admin/delete-user?userId=$USER_ID" \
      -H "Cookie: your-session"

    echo "✅ $email 删除完成"
  else
    echo "❌ $email 用户不存在"
  fi

  sleep 1  # 避免API频率限制
done
```

---

## 📊 **删除后用户可重新注册**

删除用户后，该邮箱可以重新注册，系统会：
- ✅ 创建新的用户ID
- ✅ 重置为10积分
- ✅ 获得全新的数据存储空间
- ✅ 完全独立的历史记录

**用户体验**: 就像第一次注册一样的全新账户！
