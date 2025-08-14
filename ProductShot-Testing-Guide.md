# ProductShot Feature Testing Guide

## 🎯 Overview

This guide explains how to test the new ProductShot feature powered by SiliconFlow's FLUX.1-Kontext-dev model.

## 🔧 Setup Requirements

### 1. Environment Configuration
Ensure your `.env.local` file contains:
```bash
SILICONFLOW_API_KEY="your-siliconflow-api-key-here"
```

### 2. Getting SiliconFlow API Key
1. Visit [SiliconFlow](https://siliconflow.com/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Add the key to your environment variables

## 🚀 Testing the ProductShot Feature

### Access the Feature
1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3000/productshot`

### Test Scenarios

#### ✅ Scenario 1: Basic Text-to-Scene Generation
1. **Input**: Enter a product description
   - Example: "red cotton t-shirt"
2. **Scene Selection**: Choose "Professional Model"
3. **Quality**: Select "Standard (20 credits)"
4. **Expected Result**: Professional studio photo with model wearing red t-shirt

#### ✅ Scenario 2: Lifestyle Scene Generation
1. **Input**: "hiking boots"
2. **Scene**: "Outdoor Adventure"
3. **Additional Context**: "rugged mountain trail"
4. **Expected Result**: Boots in outdoor hiking environment

#### ✅ Scenario 3: Image Upload + Scene
1. **Upload**: Product image (optional)
2. **Description**: "leather jacket"
3. **Scene**: "Street Style"
4. **Expected Result**: Enhanced context understanding from uploaded image

#### ✅ Scenario 4: High-Quality Generation
1. **Input**: "silk evening dress"
2. **Scene**: "Elegant Evening"
3. **Quality**: "HD (30 credits)"
4. **Expected Result**: High-resolution formal setting image

### Available Scene Types

| Scene ID | Name | Best For |
|----------|------|----------|
| `studio-model` | Professional Model | Fashion items, clothing |
| `lifestyle-casual` | Casual Lifestyle | Everyday products |
| `outdoor-adventure` | Outdoor Adventure | Sports/outdoor gear |
| `elegant-evening` | Elegant Evening | Formal wear, luxury items |
| `street-style` | Street Style | Urban fashion, accessories |
| `minimalist-clean` | Minimalist Clean | Tech products, simple items |

## 🧪 API Testing

### Direct API Testing

#### 1. Get Available Scenes
```bash
curl -X GET http://localhost:3000/api/productshot/generate \
  -H "Content-Type: application/json"
```

#### 2. Generate Product Scene
```bash
curl -X POST http://localhost:3000/api/productshot/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-session-token" \
  -d '{
    "productDescription": "blue denim jacket",
    "sceneType": "street-style",
    "additionalContext": "urban setting",
    "quality": "standard"
  }'
```

### Expected API Response
```json
{
  "success": true,
  "taskId": "sf_1234567890",
  "resultUrl": "https://siliconflow-cdn.com/generated-image.png",
  "sceneType": "street-style",
  "sceneConfig": {
    "name": "Street Style",
    "category": "urban"
  },
  "processingTime": 15000,
  "model": "FLUX.1-Kontext-dev",
  "provider": "SiliconFlow",
  "credits_used": 20
}
```

## 🔍 Testing Checklist

### Frontend Tests
- [ ] Product description input validation
- [ ] Scene selector displays all options
- [ ] Image upload works (PNG/JPG, <5MB)
- [ ] Image preview displays correctly
- [ ] Additional context input accepts text
- [ ] Quality selector shows credit costs
- [ ] Generate button shows loading state
- [ ] Result displays with image and metadata
- [ ] Download functionality works
- [ ] Error messages display appropriately

### Backend Tests
- [ ] Authentication validation
- [ ] Parameter validation
- [ ] SiliconFlow API integration
- [ ] Credits system integration (when enabled)
- [ ] Prompt construction for different scenes
- [ ] Error handling for API failures
- [ ] Response formatting

### Integration Tests
- [ ] End-to-end generation flow
- [ ] Different scene types work correctly
- [ ] Image upload enhances results
- [ ] Quality settings affect output
- [ ] Credits are properly deducted
- [ ] Error scenarios handled gracefully

## 🚨 Common Issues & Solutions

### Issue: "AI service temporarily unavailable"
**Solution**: Check if `SILICONFLOW_API_KEY` is properly set

### Issue: "Unauthorized" error
**Solution**: Ensure user is logged in and session is valid

### Issue: "Invalid scene type"
**Solution**: Verify scene ID matches predefined types

### Issue: Image upload fails
**Solution**: Check file size (<5MB) and format (PNG/JPG)

## 📊 Performance Metrics

### Expected Performance
- **Generation Time**: 15-25 seconds
- **Image Quality**: 1024x1024 pixels
- **Success Rate**: >95%
- **Credits Cost**: 20 (standard) / 30 (HD)

### Monitoring
- Check browser console for errors
- Monitor network requests in DevTools
- Verify API response times
- Check image loading performance

## 🔄 Development Mode

For development testing without API calls:
```bash
# Set in .env.local
NODE_ENV=development
MOCK_API=true
```

This will return mock responses for faster development iteration.

## 📈 Success Criteria

A successful test should demonstrate:
1. ✅ Smooth user experience from input to result
2. ✅ High-quality image generation
3. ✅ Appropriate scene context matching
4. ✅ Fast response times (<30 seconds)
5. ✅ Proper error handling
6. ✅ Credits integration working
7. ✅ All scene types functional

## 🎨 Visual Testing Examples

### Good Results
- Model/product clearly visible
- Appropriate scene context
- Professional lighting/composition
- Realistic proportions
- Clear product details

### Issues to Watch For
- Blurry or distorted products
- Inappropriate scene context
- Poor lighting/composition
- Unrealistic proportions
- Missing product features

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Feature**: ProductShot MVP with FLUX.1-Kontext
