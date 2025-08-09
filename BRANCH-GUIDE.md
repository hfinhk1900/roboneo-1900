# 分支管理指南

## 当前分支状态

### 🌿 分支列表

1. **main** - 主分支（原始代码）
2. **feature/kie-api-optimization** - KIE API 优化分支（新功能）

## 🔄 如何切换分支

### 切换到主分支（原始版本）
```bash
git checkout main
```

### 切换到优化分支（新功能）
```bash
git checkout feature/kie-api-optimization
```

### 查看当前分支
```bash
git branch
```

## 📌 分支内容对比

| 功能 | main 分支 | feature/kie-api-optimization 分支 |
|------|-----------|-----------------------------------|
| **API 端点** | `/api/image-to-sticker-ai` | `/api/image-to-sticker-optimized` |
| **机制** | 回调（需要 ngrok） | 轮询（无需 ngrok） |
| **本地测试** | 复杂 | 简单（模拟模式） |
| **带宽使用** | 高（下载图片） | 低（直接 URL） |

## 🚀 合并到主分支（当准备好时）

如果测试成功，想要合并到主分支：

```bash
# 1. 切换到主分支
git checkout main

# 2. 合并功能分支
git merge feature/kie-api-optimization

# 3. 推送到远程
git push origin main
```

## 🔙 如何回滚（如果需要）

如果合并后想要回滚：

```bash
# 1. 查看提交历史
git log --oneline -10

# 2. 找到合并前的提交 ID

# 3. 回滚到该提交
git reset --hard <commit-id>

# 4. 强制推送（谨慎！）
git push --force origin main
```

## 📝 环境变量配置

两个分支都支持的环境变量：

```bash
# .env.local

# 原始 API 配置
KIE_AI_API_KEY=your-api-key
KIE_AI_BASE_URL=https://api.kie.ai

# 优化分支新增
MOCK_KIE_API=true  # 启用模拟模式（仅在优化分支有效）
```

## 🧪 测试每个分支

### 测试主分支
```bash
git checkout main
npm run dev
# 需要 ngrok 进行回调测试
```

### 测试优化分支
```bash
git checkout feature/kie-api-optimization
npm run dev
# 直接访问 localhost:3000，无需 ngrok
```

## 📊 推荐工作流

1. **开发新功能**：在 `feature/kie-api-optimization` 分支
2. **测试稳定性**：充分测试后再合并
3. **生产部署**：确认无误后合并到 `main`
4. **保留分支**：即使合并后也保留功能分支，方便对比

## ⚠️ 注意事项

- 功能分支已推送到 GitHub
- 可以创建 Pull Request 进行代码审查
- 建议在 Vercel 创建预览部署测试功能分支
- 保留两个 API 端点，方便 A/B 测试

---

创建时间：2025-01-09
当前活跃分支：feature/kie-api-optimization
