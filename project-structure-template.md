# 📁 项目结构模板

## 🏗️ 推荐的项目结构

```
your-nextjs-project/
├── app/                          # Next.js 13+ App Router
│   ├── api/                      # API 路由
│   │   ├── bg/                   # 背景处理相关 API
│   │   │   └── remove-direct/
│   │   │       └── route.ts      # 私有背景移除 API
│   │   ├── upload-aibg-solidcolor/
│   │   │   └── route.ts          # R2 上传 API（现有）
│   │   └── other-apis/
│   ├── components/               # 页面组件
│   │   ├── aibg-generator.tsx    # 主要组件（需要更新）
│   │   └── ui/                   # UI 组件
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── lib/                          # 工具库和服务
│   ├── private-bg-removal-service.ts  # 背景移除服务类
│   ├── utils.ts                  # 工具函数
│   └── r2-client.ts              # R2 客户端（现有）
├── hooks/                        # React Hooks
│   ├── use-private-bg-removal.ts # 背景移除 Hook
│   └── use-other-hooks.ts        # 其他 Hooks
├── types/                        # TypeScript 类型定义
│   └── index.ts                  # 类型导出
├── public/                       # 静态资源
│   ├── images/
│   └── icons/
├── .env.local                    # 本地环境变量（不提交到 Git）
├── .env.example                  # 环境变量示例
├── .gitignore                    # Git 忽略文件
├── next.config.js                # Next.js 配置
├── package.json                  # 项目依赖
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 项目说明
```

## 📝 关键文件内容

### 1. `.env.example`
```bash
# Hugging Face Space Configuration
HF_SPACE_URL=https://your-space.hf.space
HF_SPACE_TOKEN=hf_your_token_here

# R2 Storage Configuration (existing)
R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your-bucket-name
```

### 2. `.gitignore` 更新
确保包含以下内容：
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### 3. `package.json` 依赖检查
```json
{
  "name": "your-aibg-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "sonner": "^1.0.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@tailwindcss/typography": "^0.5.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

### 4. `next.config.js` 配置
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: [
      'your-domain.com',
      'pub-your-r2-bucket.r2.dev'
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // API 路由超时配置
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
```

### 5. `tsconfig.json` 配置
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🔧 文件创建脚本

创建一个快速设置脚本：

```bash
#!/bin/bash
# setup-project.sh

echo "🚀 Setting up project structure..."

# 创建目录
mkdir -p app/api/bg/remove-direct
mkdir -p app/components/ui
mkdir -p lib
mkdir -p hooks
mkdir -p types
mkdir -p public/images

# 复制集成文件
echo "📁 Copying integration files..."
cp app-api-bg-remove-direct-route.ts app/api/bg/remove-direct/route.ts
cp lib-private-bg-removal-service.ts lib/private-bg-removal-service.ts
cp hooks-use-private-bg-removal.ts hooks/use-private-bg-removal.ts

# 创建环境变量示例
echo "🔧 Creating environment files..."
cat > .env.example << EOF
# Hugging Face Space Configuration
HF_SPACE_URL=https://yelo1900-bg-remove-2.hf.space
HF_SPACE_TOKEN=hf_your_token_here

# R2 Storage Configuration
R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your-bucket-name
EOF

# 创建类型定义文件
cat > types/index.ts << EOF
// 背景移除相关类型
export interface BackgroundRemovalOptions {
  maxSide?: number;
  timeout?: number;
}

export interface BackgroundRemovalResult {
  success: boolean;
  image?: string;
  error?: string;
  processingTime?: number;
  imageSize?: [number, number];
  totalTime?: number;
}

// 其他项目类型...
EOF

echo "✅ Project structure setup complete!"
echo "📋 Next steps:"
echo "1. Copy .env.example to .env.local and fill in your values"
echo "2. Update your existing components with the integration code"
echo "3. Install dependencies: npm install"
echo "4. Test locally: npm run dev"
echo "5. Deploy to Vercel"
```

## 🎯 部署前检查清单

### 文件检查
- [ ] 所有集成文件已复制到正确位置
- [ ] 现有组件已更新集成代码
- [ ] 环境变量文件已配置
- [ ] TypeScript 类型检查通过
- [ ] 本地开发服务器正常运行

### 配置检查
- [ ] HF Access Token 已获取
- [ ] 环境变量已设置
- [ ] Git 仓库已准备就绪
- [ ] 依赖包已安装

### 功能检查
- [ ] API 路由响应正常
- [ ] 前端组件无错误
- [ ] 背景移除功能测试通过
- [ ] 错误处理正常工作

准备好这个项目结构后，你就可以顺利部署到 Vercel 了！需要我帮你创建设置脚本或检查任何特定配置吗？
