# ⚡ 快速开始迁移指南

## 🎯 3 步完成迁移

---

## 第 1 步：导出旧项目的环境变量 （⏱️ 5分钟）

### 选项 A：自动导出（推荐）✨

打开终端，运行：

```bash
# 进入项目目录
cd "/Users/hf/Desktop/Web Template/Products/roboneo art"

# 运行自动导出脚本
./export-vercel-env.sh
```

脚本会自动：
1. 检查 Vercel CLI 是否已安装
2. 引导你登录旧账户
3. 导出所有环境变量到 `OLD_VERCEL_ENV_VARIABLES.md`

### 选项 B：手动导出

如果脚本不可用，打开：
1. 📄 `EXPORT_ENV_INSTRUCTIONS.md` - 查看详细说明
2. 📄 `export-env-checklist.md` - 使用清单逐个复制

---

## 第 2 步：在新 Vercel 账户中导入项目 （⏱️ 10分钟）

### 2.1 登录并导入

1. 访问：https://vercel.com （使用新账户登录）
2. 点击 **"Add New"** → **"Project"**
3. 连接 GitHub（如果还没连接）
4. 导入仓库：**`hfinhk1900/roboneo-1900`**

### 2.2 配置环境变量（重要！）

**⚠️ 在点击 "Deploy" 之前：**

1. 在导入页面找到 **"Environment Variables"** 部分
2. 打开刚才生成的 `OLD_VERCEL_ENV_VARIABLES.md` 文件
3. 逐个复制粘贴环境变量

**必需的环境变量（至少要添加这些）：**
- ✅ `NEXT_PUBLIC_BASE_URL`
- ✅ `DATABASE_URL`
- ✅ `BETTER_AUTH_SECRET`
- ✅ `STORAGE_*` (所有 R2 配置)
- ✅ `URL_SIGNING_SECRET`
- ✅ 支付相关（`CREEM_*` 或 `STRIPE_*`）

### 2.3 开始部署

添加完所有环境变量后，点击 **"Deploy"** 按钮。

等待 3-5 分钟完成构建。

---

## 第 3 步：配置域名 （⏱️ 15分钟）

### 3.1 获取新的 Vercel 域名

部署成功后，你会看到类似这样的域名：
```
https://roboneo-1900.vercel.app
```

### 3.2 更新 Cloudflare DNS

1. 登录 Cloudflare: https://dash.cloudflare.com
2. 选择域名 `roboneo.art`
3. 进入 **DNS** → **Records**
4. 找到指向 Vercel 的 CNAME 记录
5. 确认 **Target** 是：`cname.vercel-dns.com`
6. **Proxy status**: Proxied（橙色云朵图标）

### 3.3 在 Vercel 添加自定义域名

1. 在新 Vercel 项目中，进入 **Settings** → **Domains**
2. 点击 **"Add"**
3. 输入：`roboneo.art`
4. 点击 **"Add"**
5. （可选）也添加：`www.roboneo.art`

### 3.4 等待 DNS 生效

- 通常需要 5-30 分钟
- 检查工具：https://dnschecker.org

---

## ✅ 验证部署

访问以下 URL 测试：

1. **临时域名**：`https://roboneo-1900.vercel.app`
2. **自定义域名**：`https://roboneo.art`

测试功能：
- [ ] 网站能正常访问
- [ ] 用户登录功能
- [ ] 图片上传功能
- [ ] AI 功能
- [ ] 支付功能

---

## 🆘 遇到问题？

### 部署失败
→ 查看构建日志，检查环境变量是否都已添加

### 功能不正常
→ 检查 Vercel 项目的 Settings → Environment Variables
→ 确认所有必需的变量都已正确配置

### 域名无法访问
→ 检查 Cloudflare DNS 设置
→ 确认 Vercel 中已添加自定义域名
→ 等待 DNS 传播

### 需要更多帮助
→ 查看详细文档：`VERCEL_MIGRATION_GUIDE.md`
→ 环境变量导出：`EXPORT_ENV_INSTRUCTIONS.md`

---

## 📚 相关文档

- 📘 **VERCEL_MIGRATION_GUIDE.md** - 完整迁移指南
- 📗 **EXPORT_ENV_INSTRUCTIONS.md** - 环境变量导出说明
- 📙 **export-env-checklist.md** - 手动导出清单
- 🔧 **export-vercel-env.sh** - 自动导出脚本

---

## 🎉 完成！

迁移完成后：
1. ✅ 测试所有功能
2. ✅ 更新 Webhook URLs（如果使用）
3. ✅ 监控新账户使用情况
4. ✅ （可选）暂停旧项目

**恭喜你完成迁移！🚀**

