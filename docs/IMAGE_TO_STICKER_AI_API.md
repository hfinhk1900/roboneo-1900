# Image-to-Sticker AI API Documentation

## Overview

The `image-to-sticker-ai` API is an advanced, asynchronous image generation service that transforms images into stickers using GPT-4o technology. This API provides enhanced features compared to the traditional synchronous `image-to-sticker-improved` API.

## API Endpoints

### Base URL
```
http://localhost:3000/api/image-to-sticker-ai
```

## Environment Setup

Before using the API, configure the required environment variables in your `.env.local` file:

```bash
# KIE AI API configuration
KIE_AI_API_KEY="your-kie-ai-api-key-here"
KIE_AI_BASE_URL="https://api.kie.ai"  # Optional, defaults to https://api.kie.ai
```

To get your KIE AI API key:
1. Visit [KIE AI API Key Management](https://kie.ai/api-key)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key to your environment variables

## Authentication

The API uses Bearer Token authentication. Include the authorization header in all requests:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Create Generation Task (POST)

Creates a new image-to-sticker generation task.

**Endpoint:** `POST /api/image-to-sticker-ai`

**Request Body:**
```json
{
  "prompt": "Transform this image into a cute anime sticker style with transparent background",
  "filesUrl": [
    "https://example.com/image1.png",
    "https://example.com/image2.jpg"
  ],
  "size": "1:1",
  "nVariants": 2,
  "isEnhance": true,
  "enableFallback": true,
  "fallbackModel": "FLUX_MAX"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Conditional | Text prompt for image generation. Required if `filesUrl` not provided |
| `filesUrl` | string[] | Conditional | Array of image URLs (max 1 in test mode for cost optimization). Required if `prompt` not provided |
| `size` | string | Yes | Aspect ratio: `"1:1"` (restricted to lowest cost option in test mode) |
| `nVariants` | number | No | Number of variants to generate: `1` (restricted to lowest cost option in test mode) |
| `style` | string | No | Predefined style: `"ios"`, `"pixel"`, `"lego"`, or `"snoopy"`. Overrides `prompt` with style-specific prompts |
| `maskUrl` | string | No | Mask image URL for selective editing |
| `callBackUrl` | string | No | URL to receive completion notifications |
| `isEnhance` | boolean | No | Enable prompt enhancement. **Forced to `false` in test mode for cost optimization** |
| `uploadCn` | boolean | No | Use China servers for upload. **Forced to `false` in test mode** |
| `enableFallback` | boolean | No | Enable fallback models. **Forced to `false` in test mode for cost optimization** |
| `fallbackModel` | string | No | Fallback model. **Forced to `"FLUX_MAX"` in test mode for cost optimization** |

**Success Response (200):**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_abc123"
  }
}
```

**Error Responses:**

- **401 Unauthorized:**
```json
{
  "code": 401,
  "msg": "Authentication credentials are missing or invalid"
}
```

- **402 Insufficient Credits:**
```json
{
  "code": 402,
  "msg": "Account does not have enough credits to perform the operation",
  "data": {
    "required": 4,
    "current": 2
  }
}
```

- **422 Validation Error:**
```json
{
  "code": 422,
  "msg": "Size is required and must be one of: 1:1, 3:2, 2:3"
}
```

### 2. Check Task Status (GET)

Retrieves the status and results of a generation task.

**Endpoint:** `GET /api/image-to-sticker-ai?taskId=<TASK_ID>` or `GET /api/image-to-sticker-ai?styles=true`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Conditional | The task ID returned from task creation (required for status check) |
| `styles` | string | Conditional | Set to `"true"` to get available styles list |

**Success Response (200):**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_abc123",
    "status": "completed",
    "resultUrls": [
      "https://example.com/generated-sticker-1.png",
      "https://example.com/generated-sticker-2.png"
    ],
    "createdAt": "2024-01-01T12:00:00Z",
    "completedAt": "2024-01-01T12:00:30Z"
  }
}
```

**Task Status Values:**
- `pending`: Task queued for processing
- `processing`: Task currently being processed
- `completed`: Task finished successfully
- `failed`: Task encountered an error

**Error Response (404):**
```json
{
  "code": 404,
  "msg": "Task not found"
}
```

**Get Available Styles:**
```javascript
// GET /api/image-to-sticker-ai?styles=true
{
  "code": 200,
  "msg": "success",
  "data": {
    "styles": [
      {
        "id": "ios",
        "name": "iOS Sticker",
        "imageUrl": "/styles/ios.png",
        "description": "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars..."
      },
      {
        "id": "pixel",
        "name": "Pixel Art",
        "imageUrl": "/styles/pixel.png",
        "description": "Transform the people in this photo into a die-cut sticker in a retro pixel art style..."
      },
      {
        "id": "lego",
        "name": "LEGO",
        "imageUrl": "/styles/lego.png",
        "description": "Transform the people in this photo into LEGO minifigure style stickers..."
      },
      {
        "id": "snoopy",
        "name": "Snoopy",
        "imageUrl": "/styles/snoopy.png",
        "description": "Transform the people in this photo into stickers in the charming, hand-drawn art style..."
      }
    ]
  }
}
```

## Usage Examples

### Example 1: Using Predefined Styles

```javascript
// iOS Style Sticker
const response = await fetch('/api/image-to-sticker-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    filesUrl: ["https://example.com/photo.jpg"],
    style: "ios",  // 3D iOS emoji style
    size: "1:1"
  })
});

// Pixel Art Style
const pixelResponse = await fetch('/api/image-to-sticker-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    filesUrl: ["https://example.com/photo.jpg"],
    style: "pixel",  // Retro pixel art
    size: "1:1"
  })
});

const result = await response.json();
console.log('Task ID:', result.data.taskId);
```

### Example 2: Using Custom Prompts

```javascript
const response = await fetch('/api/image-to-sticker-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: "Transform into a cute cartoon sticker with transparent background",
    filesUrl: [
      "https://example.com/photo.jpg"
    ],
    size: "1:1"  // Note: restricted to 1:1 in test mode
  })
});

const result = await response.json();
const taskId = result.data.taskId;

// Poll for completion
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/image-to-sticker-ai?taskId=${taskId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  const status = await statusResponse.json();

  if (status.data.status === 'completed') {
    console.log('Generated images:', status.data.resultUrls);
  } else if (status.data.status === 'failed') {
    console.error('Generation failed:', status.data.error);
  } else {
    // Still processing, check again later
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

### Example 3: With Callback URL

```javascript
const response = await fetch('/api/image-to-sticker-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: "Convert to sticker format",
    filesUrl: ["https://example.com/image.png"],
    size: "1:1",
    callBackUrl: "https://your-app.com/webhook/sticker-complete"
  })
});
```

## Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Request processed successfully |
| 400 | Format Error | Invalid JSON format |
| 401 | Unauthorized | Missing or invalid authentication |
| 402 | Insufficient Credits | Not enough credits in account |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Request parameters failed validation |
| 429 | Rate Limited | Too many requests |
| 455 | Service Unavailable | System maintenance |
| 500 | Server Error | Internal server error |
| 550 | Connection Denied | Task rejected due to queue issues |

## Comparison with image-to-sticker-improved API

| Feature | image-to-sticker-improved | image-to-sticker-ai |
|---------|---------------------------|---------------------|
| **Processing** | Synchronous (wait for result) | Asynchronous (get taskId) |
| **Input Format** | FormData file upload | JSON with image URLs |
| **Authentication** | Session-based | Bearer Token |
| **Styles** | Predefined styles only | Predefined styles + Free-form prompts |
| **Image Sources** | File upload only | URL-based images |
| **Variants** | Single image | 1, 2, or 4 variants |
| **Aspect Ratios** | Square only (1024x1024) | 1:1, 3:2, 2:3 |
| **Callbacks** | None | Webhook support |
| **Fallback Models** | None | GPT_IMAGE_1, FLUX_MAX |
| **Enhancement** | None | Prompt enhancement |
| **Response Time** | Immediate (sync) | Task-based (async) |

## Credits and Billing

- Each variant costs the standard credit amount per image
- Credits are deducted when the task is created
- If generation fails, credits are not refunded (implement retry logic)
- Multiple variants multiply the credit cost (e.g., 4 variants = 4x credits)

## Testing

Use the provided test script to verify API functionality:

```bash
npx tsx scripts/test-image-to-sticker-ai.ts
```

This script tests:
- Task creation
- Status checking
- Polling for completion
- Cost-optimized parameter combinations

### ⚠️ Test Mode Cost Optimization

The API is currently configured for **lowest cost operation** with the following restrictions:

- **Size**: Only `1:1` (square format, 1024x1024 pixels)
- **Variants**: Only `1` variant per request
- **Input Images**: Maximum `1` image per request
- **Enhancements**: Disabled (`isEnhance: false`)
- **Fallback Models**: Disabled (`enableFallback: false`)
- **Model**: Fixed to `FLUX_MAX` (default option)

**These settings are automatically enforced** regardless of what parameters you send in the request.

## 🎨 Available Styles

The API supports four predefined styles that automatically apply optimized prompts:

| Style | Name | Description |
|-------|------|-------------|
| `ios` | iOS Sticker | 3D emoji-style stickers matching Apple iOS design |
| `pixel` | Pixel Art | Retro pixelated aesthetic with limited color palette |
| `lego` | LEGO | LEGO minifigure style with plastic appearance |
| `snoopy` | Snoopy | Hand-drawn Peanuts comic book style |

**Style vs Prompt Priority:**
- If `style` is provided, it overrides any custom `prompt`
- Style-specific prompts are professionally optimized for best results
- For custom results, omit the `style` parameter and use `prompt` instead

## Limitations

1. **Image URLs**: Must be publicly accessible
2. **File Size**: Maximum 25MB per image
3. **Formats**: Supports .jfif, .pjpeg, .jpeg, .pjp, .jpg, .png, .webp
4. **Queue**: Tasks may be rejected if queue is full
5. **Retention**: Generated images are stored for 14 days
6. **Rate Limits**: Apply based on account tier

## Production Considerations

1. **Environment Variables**: Ensure all required environment variables are set:
   - `KIE_AI_API_KEY`: Your KIE AI API key
   - `KIE_AI_BASE_URL`: KIE AI base URL (optional)
2. **Task Storage**: Current implementation uses in-memory storage. For production, use Redis or database
3. **API Keys**: Implement proper Bearer token validation
4. **Monitoring**: Add health checks and monitoring
5. **Scaling**: Consider queue management for high-volume usage
6. **Callbacks**: Implement retry logic for webhook delivery
7. **Security**: Validate image URLs and implement rate limiting
8. **Error Handling**: Monitor KIE AI API rate limits and quotas
