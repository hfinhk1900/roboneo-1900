# ProductShot R2 同步删除测试工具

这个工具用于测试 ProductShot 功能中，前端删除历史记录时是否会同步删除 R2 存储中的文件。

## 🚀 快速开始

### 查看所有 ProductShot 文件
```bash
node test-productshot-r2-sync.js list
```

### 检查特定文件是否存在
```bash
node test-productshot-r2-sync.js check <文件名>
```

### 生成测试计划
```bash
node test-productshot-r2-sync.js test
```

## 🧪 完整测试步骤

### 步骤 1: 记录删除前状态
```bash
# 查看当前所有文件
node test-productshot-r2-sync.js list

# 选择一个文件记录（例如第一个）
node test-productshot-r2-sync.js check 05e632a6-b3e3-4c93-96bb-88c3f32482e3.png
```

### 步骤 2: 在前端执行删除
1. 🌐 打开浏览器，访问应用
2. 🔐 登录您的账户
3. 📸 进入 ProductShot 功能页面
4. 📜 查看历史记录
5. 🎯 找到对应的图片（根据文件名匹配）
6. 🗑️ 在前端删除该图片
7. ⏳ 等待 5 秒钟

### 步骤 3: 验证 R2 同步删除
```bash
# 检查文件是否已从 R2 删除
node test-productshot-r2-sync.js check 05e632a6-b3e3-4c93-96bb-88c3f32482e3.png
```

## ✅ 预期结果

**成功的同步删除应该显示：**
```
❌ File NOT found: 05e632a6-b3e3-4c93-96bb-88c3f32482e3.png
```

**如果同步删除失败会显示：**
```
✅ File exists: 05e632a6-b3e3-4c93-96bb-88c3f32482e3.png
   Size: 1.37 MB
   Type: image/png
   Modified: 8/24/2025, 10:41:11 PM
```

## 📋 当前发现

根据之前的实现，我们已经在以下 API 中集成了 R2 同步删除功能：

1. **单个删除**: `/api/history/productshot/[id]`
   - ✅ 已实现 R2 同步删除

2. **批量删除**: `/api/history/productshot/batch-delete`
   - ✅ 已实现 R2 同步删除

## 🔧 工具命令参考

| 命令 | 功能 | 示例 |
|------|------|------|
| `list` | 列出所有 ProductShot 文件 | `node test-productshot-r2-sync.js list` |
| `check <文件名>` | 检查特定文件是否存在 | `node test-productshot-r2-sync.js check example.png` |
| `test` | 生成测试计划和说明 | `node test-productshot-r2-sync.js test` |
| 无参数 | 显示帮助和文件列表 | `node test-productshot-r2-sync.js` |

## 🚨 注意事项

1. **权限**: 脚本使用环境变量中的 R2 配置，确保 `.env.local` 文件配置正确
2. **延迟**: 删除操作后等待几秒钟再检查，以确保异步操作完成
3. **备份**: 在测试前备份重要文件，删除操作是不可逆的
4. **网络**: 确保网络连接稳定，避免因网络问题导致的误判
