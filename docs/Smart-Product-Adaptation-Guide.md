# 🎯 智能产品适配系统 (Smart Product Adaptation)

## 📖 概述

为了解决只支持服装类产品的局限性，我们实现了**智能产品适配系统**，能够根据产品类型自动选择合适的交互动词和场景描述。

---

## 🔍 产品类型检测

系统通过关键词匹配自动识别产品类型：

### **👕 服装类 (Clothing)**
**关键词:** `shirt`, `dress`, `pants`, `jeans`, `jacket`, `coat`, `sweater`, `hoodie`, `top`, `bottom`, `clothing`, `apparel`, `wear`, `outfit`, `fashion`

**交互动词:** `wearing`, `dressed in`, `styled with`

### **📱 电子产品 (Electronics)**
**关键词:** `phone`, `iphone`, `android`, `laptop`, `computer`, `tablet`, `headphones`, `earbuds`, `airpods`, `camera`, `watch`, `smartwatch`, `tv`, `monitor`

**交互动词:** `using`, `holding`, `with`, `featuring`

### **🍔 食品 (Food)**
**关键词:** `food`, `burger`, `pizza`, `sandwich`, `cake`, `bread`, `snack`, `meal`, `dish`, `cuisine`

**交互动词:** `enjoying`, `with`, `featuring`, `presenting`

### **☕ 饮品 (Drink)**
**关键词:** `coffee`, `tea`, `water`, `juice`, `soda`, `beer`, `wine`, `drink`, `beverage`, `cup`, `bottle`, `glass`

**交互动词:** `drinking`, `holding`, `with`, `enjoying`

### **💄 美容产品 (Beauty)**
**关键词:** `lipstick`, `makeup`, `cosmetics`, `perfume`, `skincare`, `beauty`, `cream`, `lotion`, `mascara`, `foundation`

**交互动词:** `using`, `applying`, `with`, `showcasing`

### **⚽ 体育用品 (Sports)**
**关键词:** `ball`, `basketball`, `football`, `tennis`, `sports`, `fitness`, `gym`, `exercise`, `workout`, `athletic`

**交互动词:** `using`, `holding`, `with`, `training with`

### **🏠 家居用品 (Home)**
**关键词:** `lamp`, `vase`, `pillow`, `decoration`, `furniture`, `home`, `house`, `kitchen`, `decor`

**交互动词:** `using`, `with`, `featuring`, `displaying`

### **🔧 默认类型 (Default)**
**未匹配任何特定类型时的默认处理**

**交互动词:** `with`, `featuring`, `using`, `holding`

---

## 🎬 场景适配示例

### **Studio Model 场景**

#### **👕 服装示例:**
```
输入: "red cotton t-shirt"
检测类型: clothing
生成Prompt: "professional model wearing red cotton t-shirt in a clean studio setting, high-end product photography, perfect lighting, commercial quality"
```

#### **📱 电子产品示例:**
```
输入: "iPhone 15 Pro"
检测类型: electronics
生成Prompt: "professional model using iPhone 15 Pro in a clean studio setting, high-end product photography, perfect lighting, commercial quality"
```

#### **☕ 饮品示例:**
```
输入: "artisan coffee cup"
检测类型: drink
生成Prompt: "professional model drinking artisan coffee cup in a clean studio setting, high-end product photography, perfect lighting, commercial quality"
```

#### **💄 美容产品示例:**
```
输入: "luxury lipstick"
检测类型: beauty
生成Prompt: "professional model using luxury lipstick in a clean studio setting, high-end product photography, perfect lighting, commercial quality"
```

### **Lifestyle Casual 场景**

#### **🎧 耳机示例:**
```
输入: "wireless headphones"
检测类型: electronics
生成Prompt: "person using wireless headphones in a casual lifestyle setting, natural lighting, comfortable environment, everyday use"
```

#### **⚽ 体育用品示例:**
```
输入: "basketball"
检测类型: sports
生成Prompt: "person using basketball in a casual lifestyle setting, natural lighting, comfortable environment, everyday use"
```

### **Outdoor Adventure 场景**

#### **🏃 运动鞋示例:**
```
输入: "running shoes"
检测类型: clothing (含sports属性)
生成Prompt: "athletic person wearing running shoes during outdoor activities, dynamic action shot, nature background"
```

#### **📷 相机示例:**
```
输入: "action camera"
检测类型: electronics
生成Prompt: "athletic person using action camera during outdoor activities, dynamic action shot, nature background"
```

---

## ✨ 智能适配优势

### **✅ 解决的问题:**
1. **多样化产品支持** - 不再局限于服装类产品
2. **自然语言描述** - 避免"wearing iPhone"等不合理表达
3. **上下文适配** - 根据产品类型选择最合适的交互方式
4. **用户体验提升** - 无需手动选择产品类型

### **🎯 适用产品范围:**
- **服装配饰** - 衣服、鞋子、包包、首饰等
- **电子产品** - 手机、电脑、耳机、相机等
- **食品饮料** - 咖啡、食物、酒水等
- **美容护理** - 化妆品、护肤品、香水等
- **体育健身** - 球类、器材、装备等
- **家居生活** - 装饰品、家具、用品等
- **其他产品** - 文具、玩具、工具等

### **🚀 技术特点:**
- **零配置** - 用户无需额外设置
- **自动检测** - 基于关键词智能识别
- **可扩展** - 易于添加新的产品类型
- **向后兼容** - 完全兼容现有服装类产品

---

## 🔧 技术实现

### **检测函数示例:**
```typescript
function detectProductType(productDescription: string): ProductType {
  const desc = productDescription.toLowerCase();

  if (desc.match(/\b(phone|iphone|laptop|camera)\b/)) {
    return 'electronics';
  }
  // ... 其他检测逻辑

  return 'default';
}
```

### **交互动词选择:**
```typescript
function getProductInteraction(productType: ProductType): string {
  const interactions = PRODUCT_INTERACTIONS[productType];
  return interactions[0]; // 使用最合适的交互动词
}
```

### **Prompt构建:**
```typescript
basePrompt = sceneConfig.prompt
  .replace('{interaction}', interaction)
  .replace('{product}', productDescription);
```

---

## 🎨 自定义场景支持

对于**Custom Scene**，用户可以完全自定义场景描述，系统会智能处理：

```
用户输入产品: "vintage camera"
自定义场景: "cozy coffee shop with warm lighting and books"
最终Prompt: "vintage camera in cozy coffee shop with warm lighting and books"
```

---

## 📈 未来扩展

### **计划改进:**
1. **更精确的AI检测** - 使用机器学习提升识别准确率
2. **多语言支持** - 支持中文产品描述检测
3. **用户反馈学习** - 根据用户反馈优化检测规则
4. **产品细分** - 更细粒度的产品类型分类

这个智能产品适配系统让ProductShot功能真正做到了**万能产品展示**，为用户提供更自然、更专业的产品摄影体验！ 🎯✨
