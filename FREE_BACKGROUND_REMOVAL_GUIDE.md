# 免费去背景功能实施指南

## 📋 概述

本指南将帮您在 AIBG 功能中集成免费的去背景服务，解决 FLUX.1-Kontext-dev 模型无法生成透明背景的问题。

## 🎯 解决方案选择

### 方案 1：rembg 开源库（推荐）
- ✅ **完全免费**
- ✅ **专业去背景效果**
- ✅ **支持透明背景**
- ✅ **本地处理，数据安全**
- ❌ 需要安装 Python 环境

### 方案 2：在线免费服务
- ✅ **无需安装**
- ✅ **即用即得**
- ❌ 通常有使用限制
- ❌ 需要上传图片到第三方

## 🚀 快速开始

### 1. 安装去背景环境

\`\`\`bash
# 进入项目目录
cd "/Users/hf/Desktop/Web Template/Products/roboneo art"

# 运行安装脚本
./scripts/setup-bg-removal.sh
\`\`\`

### 2. 测试去背景功能

\`\`\`bash
# 测试本地去背景服务
node test-bg-removal.js
\`\`\`

### 3. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

## 🔧 技术实现

### 新增文件
1. **scripts/background_removal_service.py** - Python 去背景服务
2. **scripts/requirements-bg-removal.txt** - Python 依赖包
3. **scripts/setup-bg-removal.sh** - 环境安装脚本
4. **src/app/api/remove-background/route.ts** - Next.js API 路由

### 修改文件
1. **src/components/blocks/aibg/aibg-generator.tsx** - 前端逻辑更新

## 📱 用户体验流程

### Solid Color 模式
1. 用户上传图片
2. 选择 "Solid Color" 模式
3. 点击 "Generate" 按钮
4. **自动调用免费去背景服务** 🆕
5. 返回透明背景图片
6. 用户可选择纯色背景应用

### AI Background 模式
1. 用户上传图片
2. 选择 "AI Background" 模式
3. 选择预设场景或自定义描述
4. 调用 FLUX.1-Kontext-dev 生成新背景

## 🎨 Solid Color 新流程

\`\`\`typescript
// 前端流程
if (backgroundMode === 'color') {
  // 1. 调用免费去背景API
  const bgRemovalResponse = await fetch('/api/remove-background', {
    method: 'POST',
    body: JSON.stringify({ image_input: imageBase64 })
  });

  // 2. 获得透明背景图片
  const result = await bgRemovalResponse.json();
  setProcessedImage(result.image);

  // 3. 用户选择颜色后，前端动态应用背景色
  applyBackgroundColor(selectedColor);
}
\`\`\`

## 🧪 测试场景

### 测试 1：基本去背景
\`\`\`bash
node test-bg-removal.js
\`\`\`

### 测试 2：AIBG 完整流程
1. 访问 http://localhost:3000
2. 上传图片到 AIBG
3. 选择 "Solid Color" 模式
4. 点击 "Generate"
5. 验证去背景效果
6. 选择不同颜色验证背景应用

## 🔍 故障排除

### 问题 1：Python 环境未安装
\`\`\`bash
# macOS 安装 Python
brew install python3

# 重新运行安装脚本
./scripts/setup-bg-removal.sh
\`\`\`

### 问题 2：依赖安装失败
\`\`\`bash
# 手动安装依赖
cd scripts
python3 -m venv bg_removal_env
source bg_removal_env/bin/activate
pip install -r requirements-bg-removal.txt
\`\`\`

### 问题 3：API 调用失败
- 检查开发服务器是否运行
- 检查 Python 虚拟环境是否激活
- 查看服务器日志：\`tail -f dev.log\`

## 📊 性能优化建议

1. **缓存处理结果** - 避免重复去背景
2. **图片压缩** - 减少处理时间
3. **异步处理** - 提升用户体验
4. **错误重试** - 提高成功率

## 🔄 替代方案

如果 rembg 安装有问题，可以考虑：

### 在线免费服务
1. **Remove.bg API** - 每月50张免费
2. **Photoroom API** - 有免费额度
3. **Erase.bg** - 在线工具

### 集成示例
\`\`\`typescript
// 调用在线服务
const response = await fetch('https://api.remove.bg/v1.0/removebg', {
  method: 'POST',
  headers: {
    'X-Api-Key': 'YOUR_API_KEY',
  },
  body: formData
});
\`\`\`

## 🎉 总结

通过本实施方案，您的 AIBG 功能将具备：
- ✅ 专业的去背景能力
- ✅ 真正的透明背景
- ✅ 免费的解决方案
- ✅ 完整的 Solid Color 工作流

现在您可以为用户提供真正意义上的"纯色背景"功能了！
