# ProductShot API Parameters Guide

## 🎯 Overview

This guide details parameters for controlling ProductShot image generation using the FLUX.1-Kontext-dev model via SiliconFlow API.

⚠️ **Important**: SiliconFlow's official documentation doesn't detail all FLUX.1-Kontext parameters. Some parameters listed here require testing to verify support.

## 📋 Complete Parameter Reference

### **Core Parameters (Required) ✅**

| Parameter | Type | Status | Description | Example |
|-----------|------|--------|-------------|---------|
| `productDescription` | `string` | ✅ **CONFIRMED** | Product description text | `"red cotton t-shirt"` |
| `sceneType` | `SceneType` | ✅ **CONFIRMED** | Photography scene type | `"studio-model"` |

### **Basic Controls (Optional) ✅**

| Parameter | Type | Status | Default | Description |
|-----------|------|--------|---------|-------------|
| `additionalContext` | `string` | ✅ **CONFIRMED** | `undefined` | Extra context for scene |
| `quality` | `string` | ✅ **CONFIRMED** | `"standard"` | Generation quality preset |

### **Advanced Generation Controls (Needs Verification) 🧪**

| Parameter | Type | Status | Default | Description | Impact |
|-----------|------|--------|---------|-------------|--------|
| `steps` | `number` | 🧪 **TESTING** | `28` | Inference steps | **Quality**: More steps = higher quality |
| `seed` | `number` | 🧪 **TESTING** | `random` | Random seed | **Consistency**: Same seed = same result |
| `guidance_scale` | `number` | 🧪 **TESTING** | `3.5` | CFG guidance scale | **Prompt Adherence**: Higher = more strict |
| `num_images` | `number` | 🧪 **TESTING** | `1` | Number of images | **Variants**: Generate multiple variations |
| `size` | `string` | 🧪 **TESTING** | `"1024x1024"` | Output dimensions | **Resolution** |
| `output_format` | `string` | 🧪 **TESTING** | `"jpeg"` | Output format | **File Type** |

### **Image Input (For Image-to-Image) 🧪**

| Parameter | Type | Status | Description | Usage |
|-----------|------|--------|-------------|-------|
| `image_input` | `string` | 🧪 **TESTING** | Base64 encoded input image | Upload product image for enhanced context |
| `uploaded_image` | `File` | ✅ **CONFIRMED** | Product image file (frontend) | Converted to base64 for API |

## 🎨 Scene Types

| Scene ID | Name | Best For | Typical Settings |
|----------|------|----------|------------------|
| `studio-model` | Professional Model | Fashion, clothing | `guidance_scale: 4.0` |
| `lifestyle-casual` | Casual Lifestyle | Everyday products | `guidance_scale: 3.5` |
| `outdoor-adventure` | Outdoor Adventure | Sports gear | `guidance_scale: 4.5` |
| `elegant-evening` | Elegant Evening | Luxury items | `guidance_scale: 3.8` |
| `street-style` | Street Style | Urban fashion | `guidance_scale: 4.2` |
| `minimalist-clean` | Minimalist Clean | Tech products | `guidance_scale: 3.0` |

## 📐 Supported Image Sizes

| Size | Dimensions | Aspect Ratio | Use Case |
|------|------------|--------------|----------|
| `"1024x1024"` | 1024×1024 | 1:1 | Square (Instagram, general) |
| `"1024x768"` | 1024×768 | 4:3 | Landscape (web, print) |
| `"768x1024"` | 768×1024 | 3:4 | Portrait (mobile, story) |
| `"1216x832"` | 1216×832 | 3:2 | Widescreen |
| `"832x1216"` | 832×1216 | 2:3 | Tall portrait |

## 🎛️ Parameter Effects on Output

### **Steps (Inference Steps)**
```typescript
// Quick generation (lower quality)
steps: 20-30          // ~10-15 seconds

// Balanced (recommended)
steps: 28-35          // ~15-20 seconds

// High quality
steps: 40-50          // ~25-35 seconds

// Maximum quality
steps: 50-80          // ~35-60 seconds
```

### **Guidance Scale Effects**
```typescript
// Creative, less literal
guidance_scale: 1.0-2.5    // More artistic interpretation

// Balanced (recommended)
guidance_scale: 3.0-4.0    // Good prompt following

// Strict adherence
guidance_scale: 4.5-6.0    // Very literal to prompt

// Over-guided (may reduce quality)
guidance_scale: 7.0+       // Too rigid, may cause artifacts
```

### **Seed Control**
```typescript
// Random generation
seed: -1               // Different result each time

// Reproducible generation
seed: 123456           // Same result every time

// Variations of same concept
seed: 123456 + offset  // Similar but different results
```

## 📝 API Request Examples

### **Basic Request**
```json
{
  "productDescription": "blue denim jacket",
  "sceneType": "street-style",
  "quality": "standard"
}
```

### **Advanced Request**
```json
{
  "productDescription": "luxury silk evening dress",
  "sceneType": "elegant-evening",
  "additionalContext": "golden hour lighting, sophisticated atmosphere",
  "quality": "hd",
  "steps": 45,
  "seed": 42,
  "guidance_scale": 4.2,
  "num_images": 2,
  "size": "768x1024",
  "output_format": "png"
}
```

### **Image-to-Image Request**
```json
{
  "productDescription": "vintage leather boots",
  "sceneType": "outdoor-adventure",
  "image_input": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "additionalContext": "rugged mountain terrain",
  "steps": 35,
  "guidance_scale": 3.8
}
```

## 💰 Credits Consumption

| Quality + Settings | Credits Cost | Generation Time |
|-------------------|--------------|-----------------|
| Standard (28 steps) | 20 credits | ~15 seconds |
| HD (50 steps) | 30 credits | ~25 seconds |
| Custom (35+ steps) | 25 credits | ~20 seconds |
| Multiple images (×2) | Cost × 2 | Time × 1.5 |
| Image-to-image | +5 credits | +5 seconds |

## 🎯 Best Practices

### **For Fashion Products**
```json
{
  "sceneType": "studio-model",
  "steps": 35,
  "guidance_scale": 4.0,
  "output_format": "png",
  "size": "768x1024"
}
```

### **For Tech Products**
```json
{
  "sceneType": "minimalist-clean",
  "steps": 30,
  "guidance_scale": 3.2,
  "output_format": "jpeg",
  "size": "1024x1024"
}
```

### **For Sports Gear**
```json
{
  "sceneType": "outdoor-adventure",
  "steps": 40,
  "guidance_scale": 4.5,
  "additionalContext": "dynamic action, natural lighting",
  "size": "1216x832"
}
```

## 🚨 Parameter Validation

### **Valid Ranges**
- `steps`: 20-100 (recommended: 28-50)
- `guidance_scale`: 1.0-10.0 (recommended: 3.0-5.0)
- `num_images`: 1-4
- `seed`: -1 or any 32-bit integer

### **Invalid Combinations**
- `steps > 80` with `num_images > 2` (too slow)
- `guidance_scale > 8.0` (may cause artifacts)
- `size` not in supported list

## 🔧 Testing Parameters

### **Quick Test Setup**
```bash
# Test with minimal parameters
curl -X POST /api/productshot/generate \
  -H "Content-Type: application/json" \
  -d '{
    "productDescription": "red sneakers",
    "sceneType": "street-style"
  }'
```

### **Advanced Test Setup**
```bash
# Test with all parameters
curl -X POST /api/productshot/generate \
  -H "Content-Type: application/json" \
  -d '{
    "productDescription": "vintage watch",
    "sceneType": "minimalist-clean",
    "steps": 35,
    "seed": 12345,
    "guidance_scale": 3.8,
    "size": "1024x1024",
    "output_format": "png"
  }'
```

## 📊 Performance Optimization

### **Fast Generation (5-15 seconds)**
- `steps`: 20-28
- `guidance_scale`: 3.0-3.5
- `num_images`: 1
- `size`: "1024x1024"

### **Quality Generation (15-25 seconds)**
- `steps`: 35-45
- `guidance_scale`: 3.5-4.5
- `output_format`: "png"

### **Maximum Quality (25-40 seconds)**
- `steps`: 45-60
- `guidance_scale`: 4.0-5.0
- `size`: larger dimensions
- `output_format`: "png"

## ⚠️ Important: Parameter Verification Required

**Current Implementation Status**: Our ProductShot feature uses a **conservative approach** that adds parameters conditionally:

```typescript
// Safe implementation - only adds parameters if provided
const requestBody: any = {
  model: 'black-forest-labs/FLUX.1-Kontext-dev',
  prompt: prompt
};

// Add optional parameters only if they exist
if (size) requestBody.size = size;
if (steps) requestBody.num_inference_steps = steps;
// ... etc
```

**This means**:
- ✅ **Won't break** if parameters are unsupported
- ✅ **Works** with whatever SiliconFlow supports
- 🧪 **Requires testing** to verify which parameters actually work
- 📝 **Documentation may be updated** based on testing results

**Next Steps**:
1. Test basic functionality with minimal parameters
2. Gradually test advanced parameters
3. Update implementation based on verified support
4. Optimize parameter defaults for best results

---

**Last Updated**: December 2024
**API Version**: v1.0
**Model**: FLUX.1-Kontext-dev via SiliconFlow
**Status**: 🧪 Awaiting parameter verification
