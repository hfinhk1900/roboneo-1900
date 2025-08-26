# AI Background 历史记录功能实现

## 问题分析

### 🔍 当前 AI Background 的存储情况：

1. **Background Style 模式**：
   - ✅ 生成 AI 背景图片
   - ❌ **没有历史记录保存**
   - 图片上传到 R2 存储

2. **Solid Color 模式**：
   - ✅ 生成透明背景图片
   - ❌ **没有历史记录保存**
   - 图片通过 rembg API 处理

### 🎯 解决方案

**完全可以添加历史记录功能！** AI Background 和 ProductShot 的架构非常相似，可以轻松添加相同的历史记录功能。

## 实现内容

### 1. 数据库设计

**新增表：`aibg_history`**
```sql
CREATE TABLE aibg_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'background' 或 'color'
  style TEXT NOT NULL, -- 背景样式或颜色值
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**字段说明：**
- `mode`: 生成模式（'background' 或 'color'）
- `style`: 具体样式或颜色值
  - Background Style 模式：'gradient-abstract', 'fabric-texture', 'custom' 等
  - Solid Color 模式：'#E25241', 'transparent', 'custom' 等

### 2. API 路由

**新增 API 端点：**
- `GET /api/history/aibg` - 获取历史记录
- `POST /api/history/aibg` - 创建历史记录
- `DELETE /api/history/aibg/[id]` - 删除历史记录

### 3. 前端集成

**需要修改的文件：**
- `src/components/blocks/aibg/aibg-generator.tsx`

**集成内容：**
- 历史记录状态管理
- 本地存储回退机制
- 历史记录显示组件
- 删除和清理功能

### 4. 清理工具

**新增脚本：**
- `scripts/cleanup-duplicate-aibg.ts` - 数据库重复记录清理
- `scripts/cleanup-aibg-duplicates.js` - 本地存储重复记录清理

## 功能特性

### ✅ 支持的功能

1. **双模式历史记录**：
   - Background Style 模式：保存 AI 生成的背景样式
   - Solid Color 模式：保存透明背景和颜色应用

2. **永久历史记录**：
   - 所有生成的图片都会永久保存
   - 支持跨设备同步（已登录用户）

3. **智能去重**：
   - 按模式和样式分组
   - 保留最新记录，删除重复记录

4. **用户隔离**：
   - 每个用户只能看到自己的历史记录
   - 安全的删除操作

5. **本地存储回退**：
   - 未登录用户使用本地存储
   - 登录后自动同步到服务器

### 🎨 历史记录分类

**Background Style 模式：**
- Abstract Gradient
- Fabric Texture
- Nature Blur
- Urban Blur
- Wood Surface
- Marble Stone
- Custom Background

**Solid Color 模式：**
- Red (#E25241)
- Purple (#9036AA)
- Blue (#4153AF)
- Green (#419488)
- White (#FFFFFF)
- Black (#000000)
- Transparent
- Custom Color

## 实现步骤

### 阶段 1：后端基础设施 ✅
- [x] 数据库表设计
- [x] API 路由实现
- [x] 数据库迁移

### 阶段 2：前端集成 🔄
- [ ] 历史记录状态管理
- [ ] 本地存储实现
- [ ] 历史记录显示组件
- [ ] 删除和清理功能

### 阶段 3：测试和优化 📋
- [ ] 功能测试
- [ ] 性能优化
- [ ] 用户体验优化

## 使用方式

### 数据库清理
```bash
npx tsx scripts/cleanup-duplicate-aibg.ts
```

### 本地存储清理
在浏览器控制台运行：
```javascript
// 复制 scripts/cleanup-aibg-duplicates.js 的内容到控制台
```

## 优势

1. **一致性**：与 ProductShot 历史记录功能保持一致
2. **完整性**：支持两种生成模式的历史记录
3. **可扩展性**：易于添加新的背景样式和颜色
4. **用户友好**：智能去重和清理功能
5. **性能优化**：支持分页查询和本地存储

## 总结

AI Background 历史记录功能将完全复制 ProductShot 的成功实现，为用户提供：
- 完整的生成历史追溯
- 跨设备同步能力
- 智能重复记录管理
- 优秀的用户体验

这将使 AI Background 功能更加完整和用户友好！
