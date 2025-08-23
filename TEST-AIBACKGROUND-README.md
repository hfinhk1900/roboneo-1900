# AI Background API 测试指南

## 概述

本指南提供了完整的 AI Background API 测试方案，包括两个测试脚本和详细的使用说明。

## 测试文件

1. **test-aibackground-api.js** - Node.js 测试脚本（推荐）
2. **test-aibackground-curl.sh** - Curl 命令测试脚本
3. **TEST-AIBACKGROUND-README.md** - 本说明文档

## API 端点

- **GET** `/api/aibackground/generate` - 获取可用的背景样式和预设颜色
- **POST** `/api/aibackground/generate` - 生成AI背景或纯色背景

## 测试前准备

### 1. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

### 2. 获取认证Token
1. 在浏览器中打开 `http://localhost:3000` 并登录
2. 打开开发者工具 (F12)
3. 进入 **Application** -> **Cookies** -> `localhost:3000`
4. 复制 `better-auth.session_token` 的值

### 3. 确保测试图片存在
检查测试图片路径: `public/aibg/aibg-test.jpg`

### 4. 确保有足够的Credits
API 每次生成需要消耗一定的 Credits，确保账户余额充足。

## 方法一：Node.js 测试脚本（推荐）

### 运行步骤

1. **配置认证信息**
   ```javascript
   // 编辑 test-aibackground-api.js 文件
   const CONFIG = {
     // ... 其他配置
     authCookie: 'better-auth.session_token=YOUR_ACTUAL_SESSION_TOKEN_HERE'
   };
   ```

2. **运行测试**
   ```bash
   node test-aibackground-api.js
   ```

### 测试内容

该脚本将依次执行以下测试：

1. **获取背景样式** - GET请求获取所有可用的背景样式和预设颜色
2. **纯色背景** - 生成红色背景 (#E25241)
3. **第一个AI背景样式** - 使用 "Abstract Gradient" 样式
4. **自定义背景** - 使用自定义描述生成海滩夕阳背景
5. **透明背景** - 移除背景生成透明图片

### 输出示例

```
🚀 开始测试 AI Background API
📍 API 基础 URL: http://localhost:3000
🖼️  测试图片路径: /path/to/aibg-test.jpg
✅ 测试图片已转换为 base64 (长度: 81248 字符)

============================================================
🧪 测试: 获取背景样式和颜色
============================================================
📊 状态码: 200 (OK)
✅ 状态码正确

📄 响应数据:
{
  "backgroundStyles": [
    {
      "id": "gradient-abstract",
      "name": "Abstract Gradient"
    },
    // ... 更多样式
  ],
  "presetColors": [
    {
      "name": "Red",
      "value": "#E25241"
    },
    // ... 更多颜色
  ]
}
✅ 测试成功
```

## 方法二：Curl 测试脚本

### 运行步骤

1. **配置认证信息**
   ```bash
   # 编辑 test-aibackground-curl.sh 文件
   SESSION_TOKEN="YOUR_ACTUAL_SESSION_TOKEN_HERE"
   ```

2. **添加执行权限并运行**
   ```bash
   chmod +x test-aibackground-curl.sh
   ./test-aibackground-curl.sh
   ```

## API 参数说明

### POST 请求参数

```typescript
interface AIBackgroundRequest {
  // 必需 - 产品图片 (base64编码)
  image_input: string;
  
  // 必需 - 背景模式: 'color' | 'background'
  backgroundMode: 'color' | 'background';
  
  // 纯色模式参数
  backgroundColor?: string; // hex颜色 或 'transparent'
  
  // AI背景模式参数  
  backgroundType?: string; // 背景样式ID
  customBackgroundDescription?: string; // 自定义背景描述
  
  // 可选参数
  quality?: 'standard' | 'hd';
  steps?: number;
  seed?: number;
  guidance_scale?: number;
  size?: string; // 如 '1024x1024'
  output_format?: 'jpeg' | 'png' | 'webp';
}
```

### 成功响应示例

```json
{
  "success": true,
  "resultUrl": "https://your-r2-storage.com/aibackgrounds/generated-image.png",
  "backgroundMode": "background",
  "backgroundType": "gradient-abstract",
  "backgroundColor": null,
  "credits_used": 1,
  "remaining_credits": 99
}
```

## 可用背景样式

从 API 的 GET 响应中可以看到所有可用样式：

1. **gradient-abstract** - Abstract Gradient
2. **texture-fabric** - Fabric Texture  
3. **nature-blur** - Nature Blur
4. **urban-blur** - Urban Blur
5. **wood-surface** - Wood Surface
6. **marble-stone** - Marble Stone
7. **fabric-cloth** - Soft Fabric
8. **paper-vintage** - Vintage Paper
9. **custom** - Custom Background (需要自定义描述)

## 预设颜色

- Red: #E25241
- Purple: #9036AA
- Blue: #4153AF
- Green: #419488
- White: #FFFFFF
- Black: #000000
- Transparent: transparent

## 故障排除

### 常见错误

1. **401 Unauthorized**
   - 检查 session token 是否正确
   - 确保用户已登录

2. **402 Payment Required** 
   - Credits 不足，需要充值

3. **400 Bad Request**
   - 检查请求参数是否正确
   - 确保 image_input 是有效的 base64 图片

4. **503 Service Unavailable**
   - SiliconFlow API 服务不可用
   - 检查 SILICONFLOW_API_KEY 环境变量

### 调试建议

1. **启用详细日志**
   ```bash
   # 查看服务器日志
   npm run dev
   ```

2. **检查网络连接**
   ```bash
   curl -I http://localhost:3000/api/aibackground/generate
   ```

3. **验证图片格式**
   确保测试图片是有效的 JPG/PNG 格式

## 性能测试

### 建议的测试参数组合

```javascript
// 快速测试 (低质量)
{
  quality: 'standard',
  steps: 10,
  size: '512x512'
}

// 标准测试 (平衡)  
{
  quality: 'standard',
  steps: 20,
  size: '1024x1024'
}

// 高质量测试 (慢)
{
  quality: 'hd', 
  steps: 50,
  size: '1024x1024'
}
```

## 生产环境测试

将 `baseUrl` 修改为生产环境地址：

```javascript
const CONFIG = {
  baseUrl: 'https://your-production-domain.com',
  // ... 其他配置
};
```

## 注意事项

1. **Rate Limiting** - 生产环境可能有频率限制
2. **Credits 消耗** - 每次成功生成都会扣减 Credits  
3. **存储位置** - 生成的图片存储在 `aibackgrounds` 文件夹
4. **超时设置** - AI生成可能需要30-60秒，设置合适的超时时间
5. **错误处理** - 建议实现重试机制

## 支持

如果遇到问题：
1. 检查控制台日志
2. 验证环境配置
3. 确认 API 依赖服务正常运行
