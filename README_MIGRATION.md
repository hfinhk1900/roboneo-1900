# 📦 Vercel 项目迁移文档总览

欢迎使用 Roboneo Art 项目迁移套件！这个文档包帮助你从旧的 Vercel 账户迁移到新账户。

---

## 📚 文档目录

### 🚀 快速开始（从这里开始）

**📄 QUICK_START_MIGRATION.md**
- 3 步完成迁移的快速指南
- 适合想要快速上手的用户
- 包含最关键的步骤和命令

### 📖 详细指南

**📘 VERCEL_MIGRATION_GUIDE.md**
- 完整的迁移指南
- 详细的每个步骤说明
- 故障排查和常见问题
- 适合需要详细了解每个步骤的用户

### 🔑 环境变量导出

**📗 EXPORT_ENV_INSTRUCTIONS.md**
- 从旧项目导出环境变量的详细说明
- 提供 3 种不同的导出方法
- 包含安全提醒和最佳实践

**📙 export-env-checklist.md**
- 手动导出环境变量的清单
- 逐个记录每个变量的值
- 适合不使用 CLI 的用户

**🔧 export-vercel-env.sh**
- 自动导出环境变量的脚本
- 一键导出所有配置
- 生成格式化的 Markdown 文件

---

## 🎯 推荐使用流程

### 第一次迁移？跟着这个流程走：

```
1️⃣ 阅读 QUICK_START_MIGRATION.md
   ↓
2️⃣ 运行 ./export-vercel-env.sh 导出环境变量
   ↓
3️⃣ 在新 Vercel 账户中导入项目
   ↓
4️⃣ 配置环境变量
   ↓
5️⃣ 部署项目
   ↓
6️⃣ 配置域名
   ↓
7️⃣ 验证功能
   ↓
✅ 完成！
```

### 遇到问题？

- 🔍 查看 VERCEL_MIGRATION_GUIDE.md 的"常见问题排查"部分
- 📖 参考 EXPORT_ENV_INSTRUCTIONS.md 了解不同的导出方法
- 📋 使用 export-env-checklist.md 手动记录变量

---

## 🛠️ 工具和脚本

### export-vercel-env.sh

自动化导出脚本，使用方法：

```bash
# 赋予执行权限（首次使用）
chmod +x export-vercel-env.sh

# 运行脚本
./export-vercel-env.sh
```

**功能：**
- ✅ 自动检测 Vercel CLI
- ✅ 引导登录流程
- ✅ 导出所有生产环境变量
- ✅ 生成格式化的 Markdown 文件
- ✅ 自动保护敏感信息

**输出：**
- 📄 `OLD_VERCEL_ENV_VARIABLES.md` - 包含所有环境变量
- 📄 `.env.production.local` - CLI 导出的原始文件

---

## ⚠️ 安全提醒

### 这些文件包含敏感信息：

- 🔒 `OLD_VERCEL_ENV_VARIABLES.md`
- 🔒 `.env.production.local`
- 🔒 `.env.local`（如果存在）

### 已自动添加到 .gitignore：

```gitignore
# Exported environment variables (sensitive data)
OLD_VERCEL_ENV_VARIABLES.md
.env.production.local
```

### 使用后的处理建议：

1. ✅ 完成迁移后删除这些文件
2. ✅ 或者移动到安全的位置保存
3. ✅ 不要分享给他人
4. ✅ 不要提交到 Git

---

## 📞 需要帮助？

### 常见问题

**Q: 没有安装 Vercel CLI 怎么办？**
A: 运行 `npm install -g vercel` 安装

**Q: 脚本运行失败怎么办？**
A: 查看 EXPORT_ENV_INSTRUCTIONS.md 使用其他方法

**Q: 如何确认环境变量都配置正确？**
A: 部署后测试所有功能，参考 QUICK_START_MIGRATION.md 的验证清单

**Q: 域名配置需要多久生效？**
A: 通常 5-30 分钟，可以使用 https://dnschecker.org 检查

### 获取更多信息

- 📘 完整指南：VERCEL_MIGRATION_GUIDE.md
- 📗 导出说明：EXPORT_ENV_INSTRUCTIONS.md
- 📙 手动清单：export-env-checklist.md
- 🚀 快速开始：QUICK_START_MIGRATION.md

---

## 📊 迁移进度检查表

使用这个清单跟踪你的进度：

- [ ] 1. 阅读快速开始指南
- [ ] 2. 安装 Vercel CLI（如果还没有）
- [ ] 3. 运行导出脚本获取环境变量
- [ ] 4. 在新 Vercel 账户中导入 GitHub 项目
- [ ] 5. 配置所有环境变量
- [ ] 6. 部署项目
- [ ] 7. 在 Cloudflare 配置 DNS
- [ ] 8. 在 Vercel 添加自定义域名
- [ ] 9. 等待 DNS 生效
- [ ] 10. 测试所有功能
- [ ] 11. 更新 Webhook URLs（如果需要）
- [ ] 12. 清理敏感文件
- [ ] 13. （可选）暂停旧项目

---

## 🎉 准备开始？

**立即开始：**

```bash
# 步骤 1: 导出环境变量
./export-vercel-env.sh

# 步骤 2: 查看导出的变量
cat OLD_VERCEL_ENV_VARIABLES.md

# 步骤 3: 访问新 Vercel 账户开始导入
# https://vercel.com
```

**祝迁移顺利！🚀**

---

## 📝 文档版本

- **创建日期**: 2025-11-14
- **项目**: Roboneo Art
- **源仓库**: `yelo1900/roboneo-art`
- **目标仓库**: `hfinhk1900/roboneo-1900`
- **域名**: `roboneo.art`

