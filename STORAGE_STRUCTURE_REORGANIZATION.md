# Storage Structure Reorganization

## 概述
本次更新重新组织了所有AI功能生成图片的R2存储结构，创建了统一的 `all-generated-images` 主文件夹，并为每个AI功能分配了专门的子文件夹。

## 新的存储结构

### 主文件夹
```
all-generated-images/
├── ai-backgrounds/         # AI Background (Background Style)
├── ai-backgrounds-solid/   # AI Background (Solid Color)
├── productshots/          # Productshot (产品摄影)
├── profile-pictures/      # Profile Picture (头像生成)
├── stickers/              # Sticker Generator (贴纸生成)
└── watermarks/            # Watermark Removal (水印去除)
```

## 存储路径变更对照表

| AI功能 | 旧路径 | 新路径 |
|--------|--------|--------|
| AI Background (Background Style) | `aibackgrounds/` | `all-generated-images/ai-backgrounds/` |
| AI Background (Solid Color) | `aibg/` | `all-generated-images/ai-backgrounds-solid/` |
| Productshot | `productshots/` | `all-generated-images/productshots/` |
| Profile Picture | `profile-pictures/` | `all-generated-images/profile-pictures/` |
| Sticker Generator | `stickers/` | `all-generated-images/stickers/` |
| Watermark Removal | `watermarks/` | `all-generated-images/watermarks/` |

## 修改的文件

### API路由文件
1. **src/app/api/aibackgrounds/generate/route.ts**
   - 更新 `storageFolder: 'all-generated-images/ai-backgrounds'`

2. **src/app/api/upload/image/route.ts**
   - 更新为 `'all-generated-images/ai-backgrounds-solid'`
   - 修复了lint错误：添加了变量类型声明

3. **src/app/api/profile-picture/generate/route.ts**
   - 更新 `storageFolder: 'all-generated-images/profile-pictures'`

4. **src/app/api/watermark/remove/route.ts**
   - 更新 `storageFolder: 'all-generated-images/watermarks'`

5. **src/app/api/image-to-sticker/route.ts**
   - 更新为 `'all-generated-images/stickers'`

### AI Provider文件
6. **src/ai/image/providers/siliconflow.ts**
   - 更新默认存储文件夹为 `'all-generated-images/productshots'`
   - 更新所有硬编码的 productshots 路径
   - 更新文档注释中的默认值说明

## 向后兼容性
- ✅ 现有的图片访问不会受到影响，因为使用的是asset ID访问
- ✅ 数据库中的资产记录保持不变
- ✅ 签名URL系统继续正常工作
- ✅ 旧文件夹中的图片依然可以正常访问

## 优势
1. **更好的组织结构**: 所有AI生成的图片都在统一的主文件夹下
2. **便于管理**: 管理员可以更容易地查看和管理不同功能的图片
3. **扩展性**: 未来添加新的AI功能时，可以很容易地在主文件夹下创建新的子文件夹
4. **成本监控**: 便于分析不同功能的存储使用情况
5. **备份策略**: 可以更灵活地制定不同功能的备份策略

## 注意事项
- 本次更改只影响新生成的图片存储路径
- 旧路径的图片文件不会被移动，继续存在于原位置
- 如果需要迁移旧图片到新结构，需要单独的迁移脚本

## 技术细节
- 使用 `uploadFile()` 函数的第4个参数指定存储文件夹
- 所有API都通过 `storageFolder` 参数传递文件夹路径
- SiliconFlow Provider 支持自定义存储文件夹，默认为 productshots

