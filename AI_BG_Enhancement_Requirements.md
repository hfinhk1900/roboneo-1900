# AI Background 功能增强需求文档

## 项目概述

**项目名称**: AI Background 智能背景替换功能增强  
**当前状态**: 基础背景移除 + 颜色替换  
**目标状态**: 智能背景替换 + 场景生成  
**技术基础**: SiliconFlow FLUX.1-Kontext-dev API  

## 现状分析

### 当前功能
- ✅ 图片上传 (拖拽/点击上传)
- ✅ 背景移除处理
- ✅ 纯色背景替换 (8种预设颜色 + 自定义颜色)
- ✅ Before/After 对比预览
- ✅ 图片下载功能
- ✅ 进度显示和加载状态
- ✅ Credits 消费管理

### 技术现状
- **API 提供商**: SiliconFlow
- **AI 模型**: FLUX.1-Kontext-dev
- **API 能力**: 支持 image-to-image 生成，支持复杂 prompt
- **存储**: R2 云存储
- **前端框架**: React + Next.js

### 问题分析
1. **功能单一**: 仅支持纯色背景，缺乏场景化背景
2. **创意限制**: 无法生成复杂的背景环境
3. **用户体验**: 相比 Product Shots 功能较为基础
4. **API 能力未充分利用**: FLUX.1-Kontext-dev 支持复杂场景生成但未被使用

## 功能增强需求

### 1. 背景类型扩展

#### 1.1 背景模式选择
```
┌─ Solid Colors (Existing Feature)
│  ├─ Preset Colors (Red, Purple, Blue, Green, White, Black, Transparent)
│  └─ Custom Color (Color Picker)
│
└─ Background Styles (New Feature) ⭐
   ├─ Preset Background Styles (8 types)
   └─ Custom Background Description
```

#### 1.2 预设背景场景配置
专门为背景替换优化的场景选择，不同于 Product Shots 的摄影场景：

| Background Type | Icon | UI Display Name | Description (Internal) | Prompt Template |
|---------|------|----------|------|-------------|
| `gradient-abstract` | 🌈 | Abstract Gradient | Modern gradient colors | `smooth gradient background, modern abstract colors, soft transitions, clean aesthetic` |
| `texture-fabric` | 🧵 | Fabric Texture | Fabric/paper texture | `subtle texture background, fabric or paper texture, neutral tones, soft material feel` |
| `nature-blur` | 🌸 | Nature Blur | Natural landscape blur | `natural blurred background, bokeh effect, soft focus nature scene, warm ambient light` |
| `urban-blur` | 🏙️ | Urban Blur | City street blur | `blurred urban background, soft city lights, bokeh street scene, modern atmosphere` |
| `wood-surface` | 🪵 | Wood Surface | Wood grain texture | `wooden surface background, natural wood grain texture, warm brown tones, table surface` |
| `marble-stone` | 🪨 | Marble Stone | Marble stone texture | `marble stone background, elegant natural patterns, luxury surface texture, neutral colors` |
| `fabric-cloth` | 🧶 | Soft Fabric | Silk/cotton fabric | `soft fabric background, silk or cotton texture, gentle folds and draping, elegant material` |
| `paper-vintage` | 📜 | Vintage Paper | Aged paper texture | `vintage paper background, aged texture, warm cream tones, subtle aging effects` |
| `custom` | 🎨 | Custom Background | User custom description | User input description |

### 2. 用户界面设计

#### 2.1 背景选择区域布局
```
┌─────────────────────────────┐
│ Background Type             │
├─────────────────────────────┤
│ ○ Solid Color  ● Background│  <- Radio buttons
├─────────────────────────────┤
│ [Background Style Grid]     │
│ 🌈 🧵 🌸 🏙️                │
│ 🪵 🪨 🧶 📜                 │
│ 🎨 (Custom)                 │
└─────────────────────────────┘
```

#### 2.2 Custom Background Input (UI Copy)
```
┌─────────────────────────────┐
│ Custom Background           │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Describe your desired   │ │
│ │ background style, e.g., │ │
│ │ "soft pink gradient     │ │
│ │ with golden sparkles"   │ │
│ │ or "blurred garden with │ │
│ │ warm sunlight"          │ │
│ └─────────────────────────┘ │
│ 156/300 characters          │
└─────────────────────────────┘
```

**UI Labels and Text (All English):**
- Section Title: "Background Color" (existing) / "Background Style" (new)
- Tab Labels: "Solid Color" | "Background Style"
- Custom Input Label: "Custom Background Description"
- Placeholder: "Describe your desired background style, e.g., 'soft pink gradient with golden sparkles' or 'blurred garden with warm sunlight'"
- Button Text: "Remove Background (10 credits)" → "Generate Background (10 credits)"
- Character Counter: "156/300 characters"

### 3. 技术实现方案

#### 3.1 前端组件结构
```
AIBackgroundGeneratorSection
├── ImageUpload (现有)
├── BackgroundSelector (新增)
│   ├── BackgroundTypeTabs
│   │   ├── SolidColorTab (现有功能)
│   │   └── BackgroundStyleTab (新增)
│   ├── BackgroundStyleGrid (新增)
│   └── CustomBackgroundInput (新增)
├── ProcessButton (现有)
└── ResultPreview (现有)
```

#### 3.2 状态管理
```typescript
interface BackgroundState {
  // 现有状态
  selectedBackgroundColor: string;
  showColorPicker: boolean;
  customColor: string;
  
  // 新增状态
  backgroundMode: 'color' | 'background';
  selectedBackground: BackgroundType | '';
  customBackgroundDescription: string;
  showBackgroundInput: boolean;
}

type BackgroundType = 
  | 'gradient-abstract' 
  | 'texture-fabric' 
  | 'nature-blur' 
  | 'urban-blur' 
  | 'wood-surface' 
  | 'marble-stone' 
  | 'fabric-cloth' 
  | 'paper-vintage' 
  | 'custom';
```

#### 3.3 API 调用修改
```typescript
// 现有调用方式 (仅背景移除)
const prompt = "remove background from uploaded image";

// 新增调用方式 (背景替换)
const backgroundPrompt = getBackgroundPrompt(selectedBackground, customBackgroundDescription);
const finalPrompt = `remove background and replace with ${backgroundPrompt}, keep the main subject clear and well-defined, seamless background integration`;
```

### 4. 用户体验优化

#### 4.1 Interaction Experience
- **Progressive disclosure**: Default to solid color mode, allow switching to background style mode
- **Real-time preview**: Update button style hints immediately after background selection
- **Smart suggestions**: Provide input suggestions and examples for custom backgrounds (in English)
- **One-click toggle**: Support quick switching between solid color and background style modes

#### 4.2 Visual Design (UI Copy Requirements)
- **Background icons**: Use intuitive emoji icons for different background styles
- **Preview thumbnails**: Optional small-size background effect previews
- **Status feedback**: Clear selected state and loading state indicators
- **Responsive layout**: Adapt to mobile and desktop
- **All UI text must be in English**: Labels, buttons, placeholders, error messages

### 5. 开发优先级

#### Phase 1: Core Features (High Priority)
- [ ] Background mode toggle UI (English labels)
- [ ] Preset background style selector
- [ ] Custom background description input
- [ ] API call logic modification
- [ ] Basic testing and debugging

#### Phase 2: Experience Optimization (Medium Priority)
- [ ] Background style preview generation
- [ ] Smart background description hints (English)
- [ ] Error handling and user feedback (English)
- [ ] Responsive design optimization
- [ ] Performance optimization

#### Phase 3: Advanced Features (Low Priority)
- [ ] Background style library expansion
- [ ] User custom background saving
- [ ] Batch processing functionality
- [ ] Advanced background parameter controls

### 6. 技术风险与考量

#### 6.1 技术风险
- **API 调用成本**: 背景替换可能比纯背景移除消耗更多 credits
- **生成质量**: 复杂背景可能影响生成质量和一致性
- **处理时间**: 背景生成可能需要更长处理时间
- **模型限制**: FLUX.1-Kontext-dev 对某些背景描述的理解能力

#### 6.2 缓解方案
- **渐进式引入**: 先实现基础背景样式，再逐步扩展
- **质量监控**: 建立背景替换效果评估机制
- **用户教育**: 提供背景描述最佳实践指南
- **降级策略**: 复杂背景失败时回退到纯色背景

### 7. 成功指标

#### 7.1 功能指标
- [ ] 背景替换生成成功率 > 85%
- [ ] 用户背景样式模式使用率 > 30%
- [ ] 自定义背景使用率 > 10%
- [ ] 整体功能完成度 100%

#### 7.2 性能指标
- [ ] 背景替换平均耗时 < 30秒
- [ ] 界面响应时间 < 200ms
- [ ] 移动端适配完成度 100%
- [ ] 错误率 < 5%

#### 7.3 用户体验指标
- [ ] 用户满意度评分 > 4.0/5.0
- [ ] 功能使用转化率 > 60%
- [ ] 用户反馈收集和处理

### 8. 时间规划

| 阶段 | 预估时间 | 主要交付物 |
|------|---------|-----------|
| 需求确认 | 1 天 | 确认的需求文档 |
| UI/UX 设计 | 2 天 | 界面设计稿和交互原型 |
| 前端开发 | 3-4 天 | 完整的前端功能实现 |
| API 集成 | 1-2 天 | 后端 API 调整和集成 |
| 测试优化 | 2 天 | 功能测试和性能优化 |
| 部署上线 | 1 天 | 生产环境部署 |
| **总计** | **10-12 天** | 完整的增强功能 |

### 9. UI Copy Reference & Related Files

**English UI Copy Examples from Existing Components:**
- Button text: "Remove Background (10 credits)", "Download", "Before", "After"
- Labels: "Product Image (Required)", "Background Color", "Custom Color"
- Placeholders: "Click or drag & drop to upload"
- Messages: "Demo image loaded successfully!", "Background removal completed!"

**Related Documentation:**
- [Product Shots Feature Reference](./src/components/blocks/productshot/)
- [SiliconFlow API Documentation](./src/ai/image/providers/siliconflow.ts)
- [Current AI BG Implementation](./src/components/blocks/aibg/aibg-generator.tsx)
- [Color Picker Component](./src/components/ui/color-picker.tsx)

**UI Copy Consistency Rules:**
- All user-facing text must be in English
- Use consistent terminology across components
- Follow existing button text patterns ("Action Name (X credits)")
- Maintain professional, clear, and concise copy

---

**文档版本**: v1.0  
**创建日期**: 2025-08-22  
**最后更新**: 2025-08-22  
**负责人**: 产品开发团队  
