# 📤 从旧 Vercel 项目导出环境变量

有两种方法可以导出环境变量：

---

## 方法一：使用自动脚本（推荐）✨

### 步骤 1: 安装 Vercel CLI（如果还没安装）

```bash
npm install -g vercel
```

### 步骤 2: 运行导出脚本

```bash
# 给脚本添加执行权限
chmod +x export-vercel-env.sh

# 运行脚本
./export-vercel-env.sh
```

### 步骤 3: 按提示操作

1. 确认已登录到**旧的 Vercel 账户**
2. 脚本会自动导出所有环境变量
3. 生成 `OLD_VERCEL_ENV_VARIABLES.md` 文件

---

## 方法二：手动使用 Vercel CLI

### 步骤 1: 登录旧账户

```bash
vercel login
```

选择你的旧账户登录方式（GitHub/Email 等）

### 步骤 2: 确认当前账户

```bash
vercel whoami
```

确保显示的是旧账户的用户名

### 步骤 3: 链接到旧项目（如果还没链接）

```bash
vercel link
```

选择你的旧项目 `roboneo-art`

### 步骤 4: 导出生产环境变量

```bash
vercel env pull .env.production.local --environment=production
```

### 步骤 5: 查看导出的变量

```bash
cat .env.production.local
```

### 步骤 6: 转换为 Markdown 格式

```bash
cat > OLD_VERCEL_ENV_VARIABLES.md << 'EOF'
# 🔐 旧 Vercel 项目环境变量

**项目**: roboneo-art (旧账户)

---

## 环境变量

\`\`\`bash
EOF

cat .env.production.local >> OLD_VERCEL_ENV_VARIABLES.md

echo '```' >> OLD_VERCEL_ENV_VARIABLES.md
```

---

## 方法三：从 Vercel Dashboard 手动导出

如果 CLI 方法不可行，可以手动复制：

### 步骤 1: 登录旧 Vercel 账户

访问：https://vercel.com

### 步骤 2: 进入项目设置

1. 选择 `roboneo-art` 项目
2. 点击 **Settings**
3. 点击 **Environment Variables**

### 步骤 3: 逐个复制变量

打开 `export-env-checklist.md` 文件，按照清单逐个复制每个变量的值。

---

## ⚠️ 重要安全提醒

1. **敏感信息**
   - 导出的文件包含所有 API 密钥和密码
   - 不要提交到 Git
   - 不要分享给他人

2. **文件已添加到 .gitignore**
   - `.env.production.local`
   - `OLD_VERCEL_ENV_VARIABLES.md`

3. **使用后的处理**
   - 完成迁移后建议删除这些文件
   - 或者移动到安全的位置保存

---

## 📝 导出后的操作

完成导出后：

1. ✅ 查看 `OLD_VERCEL_ENV_VARIABLES.md` 确认所有变量
2. ✅ 参考 `VERCEL_MIGRATION_GUIDE.md` 进行迁移
3. ✅ 在新 Vercel 项目中添加这些环境变量

---

## 🆘 遇到问题？

### 问题 1: "vercel: command not found"
**解决方法**：
```bash
npm install -g vercel
```

### 问题 2: "No existing credentials found"
**解决方法**：
```bash
vercel login
```

### 问题 3: "Project not linked"
**解决方法**：
```bash
vercel link
```
然后选择你的旧项目

### 问题 4: "Permission denied"
**解决方法**：
```bash
chmod +x export-vercel-env.sh
```

---

## 📞 需要帮助？

如果以上方法都不可行，可以：
1. 使用方法三手动从 Dashboard 复制
2. 截图错误信息寻求帮助
3. 使用 `export-env-checklist.md` 逐个记录

---

**准备好了吗？选择一个方法开始导出！** 🚀

