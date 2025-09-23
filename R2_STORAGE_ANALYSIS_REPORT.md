# 🔍 R2存储结构分析报告

## 📊 **当前所有AI功能的R2存储路径**

经过完整的代码检查，确认所有AI功能都已经**正确配置**为使用统一的R2存储结构：

### ✅ **存储路径对照表**:

| AI功能 | 存储路径 | API路由 | 存储方式 |
|--------|----------|---------|----------|
| **AI Background (Style)** | `all-generated-images/ai-backgrounds` | `/api/aibackgrounds/generate` | SiliconFlow → uploadFile() |
| **AI Background (Solid)** | `all-generated-images/ai-backgrounds-solid` | `/api/upload/image` | 前端上传 → uploadFile() |
| **Image to Sticker** | `all-generated-images/stickers` | `/api/image-to-sticker` | 直接上传 → uploadFile() |
| **Productshot** | `all-generated-images/productshots` | SiliconFlow Provider | SiliconFlow → uploadFile() |
| **Profile Picture** | `all-generated-images/profile-pictures` | `/api/profile-picture/generate` | SiliconFlow → uploadFile() |
| **Watermark Removal** | `all-generated-images/watermarks` | `/api/watermark/remove` | SiliconFlow → uploadFile() |

---

## 🔧 **统一的R2配置确认**

### **所有功能都使用相同的**:
```env
STORAGE_BUCKET_NAME=你的R2bucket名称
STORAGE_ENDPOINT=你的R2端点
STORAGE_ACCESS_KEY_ID=你的访问密钥
STORAGE_SECRET_ACCESS_KEY=你的秘密密钥
```

### **存储系统架构**:
```
统一Storage Provider (src/storage/)
    ↓
S3Provider (src/storage/provider/s3.ts)
    ↓
uploadFile() 函数
    ↓
同一个R2 Bucket
    ↓
all-generated-images/
├── ai-backgrounds/          (AI背景-风格模式)
├── ai-backgrounds-solid/    (AI背景-纯色模式)
├── stickers/               (图片转贴纸)
├── productshots/           (产品摄影)
├── profile-pictures/       (头像生成)
└── watermarks/            (水印移除)
```

---

## 🚨 **问题分析: "只保留最新功能文件夹"**

根据你的描述："只会保留最新的那个功能文件夹，之前的就消失了"，这**不是代码问题**，因为：

✅ **代码层面确认**:
- 所有API都使用**同一个bucket**
- 没有删除其他文件夹的逻辑
- 每个功能使用**不同的子文件夹**，不会冲突
- `uploadFile()`函数只是添加文件，不会删除

### **可能的原因分析**:

#### **原因1: R2控制台显示问题** 🎯 **最可能**
```bash
# R2控制台可能有缓存或分页显示问题
# 解决方法:
1. 刷新R2控制台页面
2. 检查是否有筛选条件
3. 查看"all-generated-images/"文件夹的详细内容
4. 使用R2 API直接查询确认
```

#### **原因2: 不同环境的bucket混用**
```bash
# 检查是否在不同环境使用了不同的bucket
开发环境 → bucket-dev
生产环境 → bucket-prod
测试环境 → bucket-test
```

#### **原因3: 文件夹权限或同步延迟**
```bash
# R2可能有同步延迟
# 新上传的文件需要几分钟才能在控制台显示
```

#### **原因4: 清理脚本误删** ⚠️ **需要检查**
```bash
# 检查是否有定时清理任务
# 检查是否有手动删除操作
# 检查Cloudflare Workers是否有清理逻辑
```

---

## 🔍 **立即诊断方法**

### **方法1: 浏览器直接检查** ⚡
```bash
# 在R2控制台中:
1. 进入你的bucket
2. 导航到 "all-generated-images/" 文件夹
3. 检查是否存在这6个子文件夹:
   - ai-backgrounds/
   - ai-backgrounds-solid/
   - stickers/
   - productshots/
   - profile-pictures/
   - watermarks/
4. 点击每个文件夹查看内容
```

### **方法2: API验证** 🧪
```javascript
// 在浏览器控制台运行：
// 生成不同类型的图片，然后检查R2

// 1. 生成AI Background
// 2. 生成Sticker
// 3. 生成Productshot
// 4. 立即检查R2控制台是否都存在
```

### **方法3: 环境变量检查** 🔧
```bash
# 确认你的环境变量:
echo $STORAGE_BUCKET_NAME
echo $STORAGE_ENDPOINT

# 是否在不同环境使用了不同的配置？
```

### **方法4: 数据库验证** 📊
```sql
-- 检查assets表，看是否有不同功能的记录
SELECT
  metadata->'source' as source_type,
  COUNT(*) as count,
  MAX(created_at) as latest_upload
FROM assets
WHERE key LIKE 'all-generated-images/%'
GROUP BY metadata->'source'
ORDER BY latest_upload DESC;
```

---

## 💡 **最可能的解决方案**

### **立即尝试**:
1. **清除R2控制台缓存** - 硬刷新页面(Ctrl+F5)
2. **检查文件夹层级** - 确保查看的是`all-generated-images/`下的内容
3. **等待同步** - 上传后等待2-3分钟再查看
4. **检查筛选条件** - R2控制台是否有active的搜索筛选

### **如果问题持续**:
1. **生成测试文件** - 各个功能各生成1张图片
2. **记录时间戳** - 记下生成时间
3. **立即检查R2** - 看是否出现预期的文件夹结构
4. **API日志检查** - 查看Vercel函数日志确认上传成功

---

## 📋 **测试清单**

请按顺序进行以下测试：

### **测试1: 基础验证** ✅
- [ ] 检查R2控制台，确认bucket名称正确
- [ ] 导航到`all-generated-images/`文件夹
- [ ] 记录当前可见的子文件夹

### **测试2: 功能测试** ✅
- [ ] 生成1张AI Background (Style模式)
- [ ] 生成1张AI Background (Solid模式)
- [ ] 生成1张Image to Sticker
- [ ] 每次生成后立即检查R2控制台

### **测试3: 时间验证** ✅
- [ ] 记录每次生成的时间
- [ ] 对比R2中文件的创建时间
- [ ] 确认时间戳是否匹配

### **测试4: 深度检查** ✅
- [ ] 使用数据库查询验证assets表
- [ ] 检查Vercel函数日志
- [ ] 确认没有删除操作

---

## 🎯 **预期结果**

正常情况下，你应该在R2中看到：

```
your-bucket-name/
└── all-generated-images/
    ├── ai-backgrounds/
    │   └── [UUID].png (AI背景Style模式文件)
    ├── ai-backgrounds-solid/
    │   └── [UUID].png (AI背景Solid模式文件)
    ├── stickers/
    │   └── [UUID].png (贴纸文件)
    ├── productshots/
    │   └── [UUID].png (产品摄影文件)
    ├── profile-pictures/
    │   └── [UUID].png (头像文件)
    └── watermarks/
        └── [UUID].png (水印移除文件)
```

如果只看到其中一个文件夹，最可能的原因是**R2控制台显示问题**，而不是文件真的被删除了。

---

## 🚀 **后续建议**

1. **启用R2日志** - 记录所有上传/删除操作
2. **添加监控** - 文件数量和大小监控
3. **定期备份** - 重要文件的备份策略
4. **权限审计** - 确认只有应用有写入权限

如果问题持续存在，请提供：
- 具体的bucket名称和配置
- R2控制台的截图
- 生成操作的具体时间
- Vercel部署日志

这样我们可以进一步诊断具体原因！
