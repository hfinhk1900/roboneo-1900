# Roboneo Art 功能架构文档

## 目录
1. [AI Background 功能](#ai-background-功能)
2. [ProductShot 功能](#productshot-功能)
3. [Image to Sticker 功能](#image-to-sticker-功能)
4. [数据库架构](#数据库架构)
5. [存储架构](#存储架构)
6. [前端架构](#前端架构)

---

## AI Background 功能

### 功能概述
AI Background 提供两种模式：AI 背景生成和纯色背景替换。

### 存储方案

#### 1. 图片存储流程
```
用户上传图片 → 前端处理 → API 调用 → R2 存储 → 数据库记录 → 历史记录显示
```

#### 2. R2 存储结构
- **路径格式**: `aibg/{uuid}.png`
- **文件类型**: PNG 格式
- **命名规则**: 基于时间戳和随机 UUID

#### 3. 数据库记录 (aibg_history 表)
```sql
CREATE TABLE aibg_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  url TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'background' 或 'color'
  style TEXT NOT NULL, -- 背景样式或颜色值
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 4. 资产记录 (assets 表)
```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- R2 存储键
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id),
  metadata TEXT, -- JSON 字符串
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 前端展示方式

#### 1. 历史记录卡片
- **布局**: 网格布局 (2-6 列响应式)
- **卡片结构**:
  - 图片预览 (aspect-square)
  - 模式标识 (Background Style / Solid Color)
  - 样式名称/颜色值
  - 创建日期
  - 操作按钮 (下载/删除)

#### 2. 图片预览弹窗
- **尺寸**: max-w-7xl w-[95vw] h-[95vh]
- **背景**: 渐变黑色背景
- **头部**: 标题 + 模式信息 + 关闭按钮
- **主体**: 居中图片显示
- **底部**: 下载按钮 + 关闭按钮

#### 3. 交互功能
- **点击放大**: 历史记录图片点击打开预览
- **悬停效果**: 图片悬停时轻微缩放
- **下载功能**: 支持全尺寸图片下载
- **删除功能**: 确认对话框删除历史记录

---

## ProductShot 功能

### 功能概述
AI 产品摄影场景生成，支持多种预设场景和自定义描述。

### 存储方案

#### 1. 图片存储流程
```
用户上传图片 → 选择场景 → AI 生成 → R2 存储 → 数据库记录 → 历史记录显示
```

#### 2. R2 存储结构
- **路径格式**: `productshot/{uuid}.png`
- **文件类型**: PNG 格式
- **命名规则**: 基于时间戳和随机 UUID

#### 3. 数据库记录 (productshot_history 表)
```sql
CREATE TABLE productshot_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  url TEXT NOT NULL,
  scene TEXT NOT NULL, -- 场景类型
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 前端展示方式

#### 1. 历史记录卡片
- **布局**: 网格布局 (2-6 列响应式)
- **卡片结构**:
  - 图片预览 (aspect-square)
  - 场景名称
  - 创建日期
  - 操作按钮 (下载/删除)

#### 2. 图片预览弹窗
- **尺寸**: max-w-7xl w-[95vw] h-[95vh]
- **背景**: 渐变黑色背景
- **头部**: 标题 + 场景信息 + 关闭按钮
- **主体**: 居中图片显示
- **底部**: 下载按钮 + 关闭按钮

---

## Image to Sticker 功能

### 功能概述
将图片转换为贴纸风格，支持多种艺术风格。

### 存储方案

#### 1. 图片存储流程
```
用户上传图片 → 选择风格 → AI 生成 → R2 存储 → 数据库记录 → 历史记录显示
```

#### 2. 数据库记录 (sticker_history 表)
```sql
CREATE TABLE sticker_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  url TEXT NOT NULL,
  style TEXT NOT NULL, -- 艺术风格
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 前端展示方式

#### 1. 历史记录卡片
- **布局**: 网格布局 (2-6 列响应式)
- **卡片结构**:
  - 图片预览 (aspect-square)
  - 风格名称
  - 创建日期
  - 操作按钮 (下载/删除)

---

## 数据库架构

### 核心表结构

#### 1. 用户表 (user)
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL,
  image TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  role TEXT,
  banned BOOLEAN,
  ban_reason TEXT,
  ban_expires TIMESTAMP,
  customer_id TEXT,
  credits INTEGER NOT NULL DEFAULT 10
);
```

#### 2. 会话表 (session)
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id),
  impersonated_by TEXT
);
```

#### 3. 支付表 (payment)
```sql
CREATE TABLE payment (
  id TEXT PRIMARY KEY,
  price_id TEXT NOT NULL,
  type TEXT NOT NULL,
  interval TEXT,
  user_id TEXT NOT NULL REFERENCES user(id),
  customer_id TEXT NOT NULL,
  subscription_id TEXT,
  status TEXT NOT NULL,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 历史记录表

#### 1. 贴纸历史 (sticker_history)
- **用途**: 存储贴纸生成历史
- **关联**: 与用户表一对一关联
- **索引**: user_id 用于快速查询

#### 2. 产品摄影历史 (productshot_history)
- **用途**: 存储产品摄影生成历史
- **关联**: 与用户表一对一关联
- **索引**: user_id 用于快速查询

#### 3. AI 背景历史 (aibg_history)
- **用途**: 存储 AI 背景生成历史
- **关联**: 与用户表一对一关联
- **索引**: user_id 用于快速查询

### 资产表 (assets)
- **用途**: 存储 R2 上传的图片信息
- **关联**: 与用户表一对一关联
- **索引**: key 唯一索引，user_id 用于权限控制

---

## 存储架构

### R2 存储结构

#### 1. 目录组织
```
/
├── aibg/           # AI Background 图片
├── productshot/    # ProductShot 图片
├── sticker/        # Sticker 图片
└── uploads/        # 用户上传的原始图片
```

#### 2. 文件命名规则
- **格式**: `{uuid}.{extension}`
- **UUID**: 32 位随机字符串
- **扩展名**: 根据文件类型确定

#### 3. 访问控制
- **签名 URL**: 24 小时有效期
- **权限验证**: 用户只能访问自己的图片
- **CORS 配置**: 支持跨域访问

### 本地存储

#### 1. 浏览器存储
- **LocalStorage**: 存储用户偏好设置
- **SessionStorage**: 存储临时会话数据
- **IndexedDB**: 存储大量历史记录数据

#### 2. 缓存策略
- **图片缓存**: 使用 Next.js Image 组件优化
- **API 缓存**: 实现请求去重和缓存
- **状态缓存**: 使用 Zustand 进行状态管理

---

## 前端架构

### 组件结构

#### 1. 页面组件
- **AI Background**: `/aibackground`
- **ProductShot**: `/productshot`
- **Sticker**: `/sticker`
- **历史记录**: 每个功能页面底部

#### 2. 通用组件
- **图片上传**: 拖拽上传 + 文件选择
- **历史记录**: 网格布局 + 卡片组件
- **图片预览**: 弹窗 + 下载功能
- **确认对话框**: 删除确认 + 清空确认

### 状态管理

#### 1. 本地状态
- **useState**: 组件内部状态
- **useEffect**: 副作用处理
- **useCallback**: 函数记忆化

#### 2. 全局状态
- **Zustand**: 用户信息、积分等
- **React Query**: API 数据缓存
- **Context**: 主题、语言等

### 数据流

#### 1. 图片生成流程
```
用户操作 → 状态更新 → API 调用 → 响应处理 → 状态更新 → UI 渲染
```

#### 2. 历史记录流程
```
组件挂载 → 加载历史 → 渲染列表 → 用户交互 → 状态更新 → UI 更新
```

#### 3. 图片预览流程
```
点击图片 → 设置预览状态 → 打开弹窗 → 渲染大图 → 用户操作 → 关闭弹窗
```

### 响应式设计

#### 1. 断点设置
- **xs**: 0px - 640px
- **sm**: 640px - 768px
- **md**: 768px - 1024px
- **lg**: 1024px - 1280px
- **xl**: 1280px+

#### 2. 网格布局
- **xs**: 2 列
- **sm**: 3 列
- **md**: 4 列
- **lg**: 6 列

#### 3. 图片尺寸
- **移动端**: 100% 宽度
- **平板**: 最大宽度限制
- **桌面**: 固定宽度

---

## 技术栈

### 后端技术
- **框架**: Next.js 15 (App Router)
- **数据库**: PostgreSQL + Drizzle ORM
- **存储**: Cloudflare R2
- **认证**: Better Auth
- **API**: RESTful API

### 前端技术
- **框架**: React 19 + TypeScript
- **样式**: Tailwind CSS
- **组件**: Radix UI
- **状态**: Zustand
- **表单**: React Hook Form

### 部署技术
- **平台**: Vercel
- **数据库**: Neon PostgreSQL
- **CDN**: Cloudflare
- **监控**: Vercel Analytics

---

## 性能优化

### 1. 图片优化
- **格式**: WebP 优先，PNG 备用
- **压缩**: 自动压缩和优化
- **懒加载**: 图片懒加载和预加载
- **缓存**: 浏览器缓存和 CDN 缓存

### 2. 数据库优化
- **索引**: 用户 ID 和创建时间索引
- **查询**: 分页查询和限制结果
- **连接**: 连接池和连接复用

### 3. 前端优化
- **代码分割**: 路由级别代码分割
- **组件懒加载**: 动态导入组件
- **状态优化**: 状态更新优化和防抖

---

## 安全措施

### 1. 认证安全
- **JWT 令牌**: 安全的身份验证
- **权限控制**: 用户只能访问自己的数据
- **会话管理**: 安全的会话处理

### 2. 数据安全
- **输入验证**: 严格的输入验证
- **SQL 注入防护**: 使用参数化查询
- **XSS 防护**: 输出编码和 CSP

### 3. 存储安全
- **签名 URL**: 时间限制的访问链接
- **权限验证**: 每次访问都验证权限
- **加密传输**: HTTPS 加密传输

---

## 监控和日志

### 1. 性能监控
- **页面加载**: 页面加载时间监控
- **API 响应**: API 响应时间监控
- **错误率**: 错误率和成功率监控

### 2. 用户行为
- **功能使用**: 各功能的使用统计
- **用户路径**: 用户操作路径分析
- **转化率**: 功能完成率统计

### 3. 系统健康
- **数据库**: 数据库连接和查询监控
- **存储**: R2 存储使用情况监控
- **API**: API 可用性和性能监控
