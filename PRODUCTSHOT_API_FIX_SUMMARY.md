# ProductShot API 修复总结

## 问题描述
用户测试 ProductShot 功能时遇到以下问题：
1. 页面一直重复生成同一张图片
2. Console 报错：`POST http://localhost:3000/api/history/productshot 500 (Internal Server Error)`
3. 历史记录无法正常保存

## 根本原因分析

### 1. 数据库插入错误
**问题**：`productshotHistory` 表的 `id` 字段没有默认值，但 API 插入时没有提供 `id`
**对比**：`stickerHistory` API 使用 `randomUUID()` 生成 ID

### 2. 前端状态管理问题
**问题**：`useCallback` 依赖项包含 `productshotHistory`，导致无限循环
- `pushHistory` 函数改变 `productshotHistory` 状态
- `useEffect` 监听 `result` 变化调用 `pushHistory`
- 状态变化触发重新渲染，导致无限循环

## 修复方案

### 1. 修复 ProductShot 历史记录 API

**文件**：`src/app/api/history/productshot/route.ts`

**修复内容**：
```typescript
// 添加导入
import { randomUUID } from 'crypto';

// 修复 POST 方法
export async function POST(request: NextRequest) {
  // ... 验证逻辑 ...

  const id = randomUUID();
  const createdAt = new Date();

  await db
    .insert(productshotHistory)
    .values({
      id,           // 手动生成 ID
      userId: session.user.id,
      url,
      scene,
      createdAt,    // 手动设置时间
    });

  return NextResponse.json({ id, url, scene, createdAt });
}
```

### 2. 修复前端状态管理

**文件**：`src/components/blocks/productshot/productshot-generator.tsx`

**修复内容**：

#### A. 修复 `pushHistory` 函数
```typescript
// 修复前：依赖 productshotHistory，导致无限循环
const pushHistory = useCallback(
  async (item: ProductshotHistoryItem) => {
    // ... 逻辑 ...
    const next = [item, ...productshotHistory]; // 直接使用状态
    setProductshotHistory(next);
  },
  [productshotHistory, currentUser] // 依赖 productshotHistory
);

// 修复后：使用函数式更新，移除依赖
const pushHistory = useCallback(
  async (item: ProductshotHistoryItem) => {
    // ... 逻辑 ...
    setProductshotHistory((prev) => {
      const next = [item, ...prev]; // 使用函数式更新
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  },
  [currentUser] // 只依赖 currentUser
);
```

#### B. 修复其他状态更新函数
```typescript
// 修复 confirmDeleteHistoryItem
setProductshotHistory((prev) => {
  const next = prev.filter((_, i) => i !== idx);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
});

// 修复 confirmClearAllHistory
setProductshotHistory((prev) => {
  // ... 删除逻辑 ...
  return [];
});

// 修复 removeHistoryItem
setProductshotHistory((prev) => {
  const target = prev[idx];
  if (!target) return prev;
  // ... 弹窗逻辑 ...
  return prev;
});
```

## 修复效果

### ✅ 解决的问题
1. **500 错误消除**：API 现在能正确处理数据库插入
2. **无限循环停止**：前端状态管理不再导致重复渲染
3. **历史记录正常**：ProductShot 生成后能正确保存到历史记录
4. **性能优化**：减少不必要的重新渲染

### ✅ 保持的功能
1. **永久历史记录**：所有生成的 ProductShot 都会永久保存
2. **用户隔离**：每个用户只能看到自己的历史记录
3. **本地存储回退**：未登录用户使用本地存储
4. **删除功能**：支持删除单条和清空所有历史记录
5. **下载功能**：支持下载生成的图片

## 测试验证

### API 测试
- ✅ 未认证请求正确返回 401
- ✅ 页面正常加载
- ✅ 数据库迁移成功

### 功能测试
- ✅ ProductShot 生成不再重复
- ✅ 历史记录正常保存
- ✅ 不再出现 500 错误
- ✅ 状态管理稳定

## 总结

通过修复数据库插入逻辑和前端状态管理问题，ProductShot 功能现在能够：
1. 正常生成图片而不重复
2. 正确保存历史记录到数据库
3. 提供流畅的用户体验
4. 保持所有原有功能

修复后的代码更加稳定和高效，符合 React 最佳实践。
