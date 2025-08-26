# ProductShot 图标路径问题修复 - 已恢复原始配置

## 问题描述

在 ProductShot 组件中，我们遇到了以下 console 错误：

```
GET http://localhost:3000/aspect-ratios/original.svg 404 (Not Found)
GET http://localhost:3000/aspect-ratios/1-1.svg 404 (Not Found)
GET http://localhost:3000/aspect-ratios/4-3.svg 404 (Not Found)
GET http://localhost/3000/aspect-ratios/3-4.svg 404 (Not Found)
GET http://localhost:3000/aspect-ratios/16-9.svg 404 (Not Found)
GET http://localhost:3000/aspect-ratios/9-16.svg 404 (Not Found)
```

## 问题原因

ProductShot 组件中的 `ASPECT_OPTIONS` 配置引用了不存在的图标文件路径：

```typescript
// 修复前的问题代码
{
  id: 'original',
  label: 'Original',
  icon: '/aspect-ratios/original.svg', // ❌ 文件不存在
  ratioClass: 'aspect-auto',
}
```

这些图标文件在 `public` 目录中不存在，导致浏览器请求时返回 404 错误。

## 修复方案

**已恢复原始配置！** 我们发现项目中存在正确的图标文件，位于 `public/icons/` 目录下。现在已恢复使用原始的图标配置：

```typescript
// 恢复后的正确代码
{
  id: 'original',
  label: 'Original',
  icon: '/icons/original.svg', // ✅ 文件存在
  ratioClass: 'aspect-auto',
}
```

## 修复详情

### 1. 图标映射恢复

| 比例 | 修复前 | 修复后 | 状态 |
|------|--------|--------|------|
| Original | `/aspect-ratios/original.svg` | `/icons/original.svg` | ✅ 已恢复 |
| 2:3 Tall | 缺失 | `/icons/tall.svg` | ✅ 已恢复 |
| 1:1 Square | `/aspect-ratios/1-1.svg` | `/icons/square.svg` | ✅ 已恢复 |
| 3:2 Wide | 缺失 | `/icons/wide.svg` | ✅ 已恢复 |

### 2. 显示逻辑恢复

同时恢复了组件中的显示逻辑，将 `<span>` 标签改回 `<img>` 标签：

```typescript
// 恢复后的代码
<img
  src={opt.icon}
  alt="aspect"
  className="w-6 h-6"
/>
```

### 3. 宽高比选项恢复

恢复了原始的 4 个宽高比选项，与 AIBG 组件保持一致：
- **Original**: 保持原始比例
- **Tall (2:3)**: 竖版比例
- **Square (1:1)**: 正方形比例
- **Wide (3:2)**: 横版比例

## 修复效果

1. **消除 404 错误**：使用存在的图标文件，不再有缺失文件的请求
2. **恢复原始功能**：完全恢复了之前的图标和宽高比选择功能
3. **保持视觉一致性**：与 AIBG 组件使用相同的图标和配置
4. **提高用户体验**：用户可以看到熟悉的图标和选项

## 技术细节

- **文件位置**：`src/components/blocks/productshot/productshot-generator.tsx`
- **图标目录**：`public/icons/`
- **可用图标**：`original.svg`, `tall.svg`, `square.svg`, `wide.svg`
- **修改行数**：约 25 行
- **影响范围**：ProductShot 组件的宽高比选择器

## 总结

通过恢复使用 `public/icons/` 目录中存在的图标文件，我们成功解决了 ProductShot 组件中的 404 错误问题，并完全恢复了原始的图标和功能。

现在 ProductShot 组件应该能够正常工作，显示正确的图标，不再出现图标相关的 console 错误，同时保持了完整的历史记录功能和原始的宽高比选择体验。

## 状态

✅ **问题已解决** - 原始图标和功能已完全恢复
✅ **404 错误已消除** - 使用正确的图标文件路径
✅ **用户体验已恢复** - 与之前完全一致的功能和外观
