#!/bin/bash

# Vercel 环境变量导出脚本
# 用于从旧的 Vercel 项目导出所有环境变量

echo "🔧 Vercel 环境变量导出工具"
echo "================================"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未检测到 Vercel CLI"
    echo ""
    echo "请先安装 Vercel CLI："
    echo "npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ 检测到 Vercel CLI"
echo ""

# 提示用户登录旧账户
echo "📝 步骤 1: 请确认你已登录到旧的 Vercel 账户"
echo "如果没有登录，请运行: vercel login"
echo ""
read -p "已登录旧账户？按 Enter 继续..."

# 显示当前用户
echo ""
echo "当前登录的账户："
vercel whoami
echo ""

read -p "确认这是旧账户吗？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请先登录旧账户: vercel login"
    exit 1
fi

# 拉取环境变量
echo ""
echo "📥 步骤 2: 拉取生产环境变量..."
echo ""

# 导出到临时文件
vercel env pull .env.production.local --environment=production

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 环境变量已导出到: .env.production.local"
    echo ""
    
    # 转换为 Markdown 格式
    echo "📝 步骤 3: 转换为 Markdown 格式..."
    
    cat > OLD_VERCEL_ENV_VARIABLES.md << 'EOF'
# 🔐 旧 Vercel 项目环境变量

**导出时间**: $(date)
**项目**: roboneo-art (旧账户)

---

## 📋 环境变量列表

```bash
EOF
    
    # 添加环境变量内容
    cat .env.production.local >> OLD_VERCEL_ENV_VARIABLES.md
    
    # 添加结尾
    cat >> OLD_VERCEL_ENV_VARIABLES.md << 'EOF'
```

---

## ⚠️ 安全提醒

1. **这是敏感文件！** 包含所有 API 密钥和密码
2. **不要提交到 Git**（已在 .gitignore 中）
3. **不要分享给他人**
4. **使用完毕后建议删除或加密保存**

---

## 📝 使用方法

1. 打开此文件查看所有环境变量
2. 在新的 Vercel 项目中逐个添加这些变量
3. 参考 `VERCEL_MIGRATION_GUIDE.md` 完成配置

---

## 🔄 批量导入到新 Vercel 项目

你可以使用以下命令批量导入（需要先登录新账户）：

```bash
# 1. 登录新的 Vercel 账户
vercel login

# 2. 链接到新项目
vercel link

# 3. 导入环境变量到生产环境
vercel env add < .env.production.local
```

EOF
    
    # 清理临时文件
    # rm .env.production.local
    
    echo ""
    echo "✅ 完成！环境变量已保存到: OLD_VERCEL_ENV_VARIABLES.md"
    echo ""
    echo "📌 接下来："
    echo "1. 查看 OLD_VERCEL_ENV_VARIABLES.md 文件"
    echo "2. 按照 VERCEL_MIGRATION_GUIDE.md 在新项目中配置"
    echo ""
else
    echo ""
    echo "❌ 导出失败"
    echo ""
    echo "可能的原因："
    echo "1. 未登录到正确的 Vercel 账户"
    echo "2. 未在正确的项目目录中"
    echo "3. 项目未链接到 Vercel"
    echo ""
    echo "解决方法："
    echo "1. 运行: vercel login"
    echo "2. 运行: vercel link"
    echo "3. 重新运行此脚本"
    echo ""
fi

