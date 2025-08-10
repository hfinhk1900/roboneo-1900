/**
 * Advanced AI Image-to-Sticker API - GPT-4o Implementation
 * Endpoint: /api/image-to-sticker-ai
 *
 * Features:
 * - Asynchronous task processing with taskId
 * - Multiple image inputs via URLs
 * - Flexible prompt-based generation
 * - Multiple aspect ratios and variants
 * - Callback URL support
 * - Fallback model support
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import fs from 'fs/promises';
import path from 'path';

// Task status enum
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Task data interface
export interface TaskData {
  taskId: string;
  kieTaskId?: string;  // KIE AI task ID for callback matching
  status: TaskStatus;
  prompt?: string;
  filesUrl?: string[];
  size: string;
  nVariants: number;
  style?: StickerStyle;  // Add style support
  userId: string;
  createdAt: Date;
  completedAt?: Date;
  resultUrls?: string[];  // URLs of generated images (may be KIE or R2)
  error?: string;
  callbackUrl?: string;
  // R2 optimization fields
  r2Key?: string;        // R2 storage key for future upload
  r2Pending?: boolean;   // Whether R2 upload is pending
  r2Urls?: string[];     // Final R2 CDN URLs (after upload)
}

// In-memory task storage (in production, use Redis or database)
export const taskStorage = new Map<string, TaskData>();

// Request deduplication cache (prevents duplicate submissions)
const requestCache = new Map<string, string>(); // hash -> taskId

/**
 * Generate request hash for deduplication
 */
function generateRequestHash(userId: string, filesUrl: string[] = [], prompt: string = '', style: string = ''): string {
  const crypto = require('crypto');
  const content = `${userId}:${filesUrl.join(',')}:${prompt}:${style}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Clean expired cache entries (cleanup every hour)
 */
setInterval(() => {
  const now = Date.now();
  for (const [hash, taskId] of requestCache.entries()) {
    const task = taskStorage.get(taskId);
    if (!task || (now - task.createdAt.getTime()) > 60 * 60 * 1000) { // 1 hour
      requestCache.delete(hash);
    }
  }
}, 60 * 60 * 1000);

// Response codes based on API documentation
export const RESPONSE_CODES = {
  SUCCESS: 200,
  FORMAT_ERROR: 400,
  UNAUTHORIZED: 401,
  INSUFFICIENT_CREDITS: 402,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  SERVICE_UNAVAILABLE: 455,
  SERVER_ERROR: 500,
  CONNECTION_DENIED: 550
} as const;

// Supported sizes (restricted to lowest cost option for testing)
const SUPPORTED_SIZES = ['1:1'] as const; // Only square images (lowest pixel count)
type SupportedSize = typeof SUPPORTED_SIZES[number];

// Supported variants (restricted to lowest cost option for testing)
const SUPPORTED_VARIANTS = [1] as const; // Only single variant (lowest cost)
type SupportedVariant = typeof SUPPORTED_VARIANTS[number];

// Test mode cost optimization settings
const TEST_MODE_SETTINGS = {
  maxInputImages: 1,        // Limit to 1 input image
  forceSize: '1:1' as const, // Force square format
  forceVariants: 1,         // Force single variant
  disableEnhance: true,     // Disable enhancement
  disableFallback: true,    // Disable fallback models
  forceModel: 'FLUX_MAX' as const // Use default model
};

// Fallback models
const FALLBACK_MODELS = ['GPT_IMAGE_1', 'FLUX_MAX'] as const;
type FallbackModel = typeof FALLBACK_MODELS[number];

// Style definitions (matching image-to-sticker-improved)
export const STICKER_STYLES = {
  ios: {
    name: 'iOS Sticker',
    userPrompt:
      "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people's body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove all background completely, making it fully transparent. Include only the full figures with no background elements, ensuring the final image looks like an official iOS emoji sticker with transparent background.",
    imageUrl: '/styles/ios.png',
  },
  pixel: {
    name: 'Pixel Art',
    userPrompt:
      'Transform the people in this photo into a die-cut sticker in a retro pixel art style. Keep all the original details of the people - their poses, expressions, clothing, and accessories - but render them in a blocky, pixelated aesthetic with a limited color palette and visible grid structure. Remove all background completely, making it fully transparent. The sticker should have clean edges with no background elements, giving it a die-cut appearance.',
    imageUrl: '/styles/pixel.png',
  },
  lego: {
    name: 'LEGO',
    userPrompt:
      'Learn the LEGO Minifigure style and turn the people in the photo into sticker avatars in this style. Mimic the body shape, face shape, skin tone, facial features and expressions. Keep the facial decorations, hairstyle and hair accessories, clothing, accessories, expressions, and poses consistent with the original image. Remove background and include only the complete figure, ensuring the final image looks like a character in LEGO Minifigure style.',
    imageUrl: '/styles/lego.png',
  },
  snoopy: {
    name: 'Snoopy',
    userPrompt:
      "Learn the Peanuts comic strip style and turn the person in the photo into a sticker avatar in that style. Recreate the person's body shape, face shape, skin tone, facial features, and expression. Keep all the details in the image—facial accessories, hairstyle and hair accessories, clothing, other accessories, facial expression, and pose—the same. Remove background and include only the full figure to ensure the final image looks like an official Peanuts-style character.",
    imageUrl: '/styles/snoopy.png',
  },
} as const;

// Supported styles
export const SUPPORTED_STYLES = Object.keys(STICKER_STYLES) as Array<keyof typeof STICKER_STYLES>;
export type StickerStyle = keyof typeof STICKER_STYLES;

// Request interface
interface ImageToStickerRequest {
  prompt?: string;
  filesUrl?: string[];
  size: SupportedSize;
  nVariants?: SupportedVariant;
  style?: StickerStyle;  // Add style support
  maskUrl?: string;
  callBackUrl?: string;
  isEnhance?: boolean;
  uploadCn?: boolean;
  enableFallback?: boolean;
  fallbackModel?: FallbackModel;
  fileUrl?: string; // deprecated
}

// Response interface
interface ApiResponse {
  code: number;
  msg: string;
  data?: any; // Allow flexible data structure for different response types
}

/*
 * Note: Bearer token validation is no longer used.
 * This API now uses session-based authentication for consistency with other APIs.
 *
 * Previous Bearer token validation kept for reference:
 * - Used special 'test-token' for development
 * - Fell back to session-based auth in production
 */

/**
 * Convert size ratio to pixel dimensions (optimized for lowest cost)
 */
function getPixelDimensions(size: SupportedSize): { width: number; height: number } {
  const baseSize = 1024;
  // Only support 1:1 ratio for cost optimization
  return { width: baseSize, height: baseSize };
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Download an image from KIE AI and save it to R2 cloud storage
 */
export async function downloadAndSaveImage(url: string, filename: string): Promise<string> {
  try {
    console.log(`📥 Downloading image from KIE AI: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to R2 cloud storage with specific folder
    console.log(`☁️  Uploading to R2 cloud storage: ${filename}`);
    const uploadResult = await uploadFile(
      buffer,
      filename,
      'image/png',
      'roboneo/generated-stickers' // 生成的贴纸专用文件夹
    );

    console.log(`✅ Image saved to R2 cloud storage: ${uploadResult.url}`);
    console.log(`🔑 Storage key: ${uploadResult.key}`);

    return uploadResult.url; // 返回R2的公网URL
  } catch (error) {
    console.error(`❌ Failed to download and save image to R2:`, error);
    throw error;
  }
}

/**
 * Query KIE AI task status and get results using the official API endpoint
 */
async function queryKieAITask(taskId: string, apiKey: string): Promise<{ status: string; imageUrls?: string[] }> {
  const baseUrl = process.env.KIE_AI_BASE_URL || 'https://api.kie.ai';

  // Use the correct endpoint from the official KIE AI documentation
  const queryUrl = `${baseUrl}/api/v1/gpt4o-image/record-info?taskId=${taskId}`;

  console.log(`🔍 Querying KIE AI task status: ${taskId}`);
  console.log(`🔗 Using official endpoint: ${queryUrl}`);

  try {
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ KIE AI task query failed:', errorText);
      throw new Error(`KIE AI task query failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`📋 KIE AI response:`, JSON.stringify(data, null, 2));

    // Parse the response according to KIE AI documentation
    if (data.code !== 200) {
      console.error(`❌ KIE AI API error: ${data.msg}`);
      throw new Error(`KIE AI API error: ${data.msg}`);
    }

    if (!data.data) {
      console.error('❌ No task data in response');
      throw new Error('No task data in KIE AI response');
    }

    const taskData = data.data;
    console.log(`🎯 Task status: ${taskData.status}, Progress: ${taskData.progress || 'unknown'}`);

    // Check task status based on KIE AI documentation
    if (taskData.status === 'SUCCESS' || taskData.successFlag === 1) {
      // Task completed successfully
      const imageUrls = taskData.response?.resultUrls || [];
      console.log(`✅ Task completed with ${imageUrls.length} images:`, imageUrls);

      if (imageUrls.length === 0) {
        console.log('⚠️ Task completed but no images found in resultUrls');
        console.log('📋 Full taskData:', JSON.stringify(taskData, null, 2));
      }

      return {
        status: 'completed',
        imageUrls
      };
    } else if (taskData.status === 'GENERATING' || taskData.status === 'RUNNING' || (!taskData.status && taskData.progress < 1)) {
      // Task is still in progress
      console.log(`⏳ Task is still generating... Progress: ${taskData.progress || 'unknown'}`);
      return { status: 'running' };
    } else if (taskData.status === 'CREATE_TASK_FAILED' || taskData.status === 'GENERATE_FAILED' || taskData.status === 'FAILED' || taskData.errorMessage) {
      // Task failed
      const errorMsg = taskData.errorMessage || taskData.errorCode || `Task ${taskData.status}`;
      console.error(`❌ Task failed: ${errorMsg}`);
      throw new Error(`KIE AI task failed: ${errorMsg}`);
    } else {
      // Unknown status, check progress
      const progress = parseFloat(taskData.progress || '0');
      if (progress >= 1.0) {
        // Progress is complete, treat as success even if status is unclear
        const imageUrls = taskData.response?.resultUrls || [];
        console.log(`✅ Task completed by progress (${progress}) with ${imageUrls.length} images`);
        return {
          status: 'completed',
          imageUrls
        };
      } else {
        console.log(`⚠️ Unknown status: ${taskData.status}, progress: ${progress}, defaulting to running`);
        return { status: 'running' };
      }
    }

  } catch (error) {
    console.error('❌ Error querying KIE AI task:', error);
    throw error;
  }
}

/**
 * Test KIE AI API connectivity
 * NOTE: This function is no longer used to avoid unnecessary API calls
 * Connection issues will be handled directly in the main request
 */
/* DEPRECATED - No longer used for better efficiency
async function testKieAIConnectivity(apiKey: string): Promise<boolean> {
  const baseUrl = process.env.KIE_AI_BASE_URL || 'https://api.kie.ai';

  try {
    console.log('🔍 Testing KIE AI API connectivity...');

    // Try to make a simple request to test connectivity
    // We'll use the generate endpoint with minimal parameters to test auth and connectivity
    const testResponse = await fetch(`${baseUrl}/api/v1/gpt4o-image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: 'test connectivity',
        size: '1:1',
        nVariants: 1
      })
    });

    if (testResponse.status === 401) {
      console.log('❌ KIE AI API authentication failed - invalid API key');
      return false;
    }

    if (testResponse.status === 429) {
      console.log('⚠️ KIE AI API rate limited - but connectivity is working');
      return true; // Rate limited means the API is reachable and auth is working
    }

    if (testResponse.ok) {
      const testData = await testResponse.json();
      if (testData.code === 200) {
        console.log('✅ KIE AI API connectivity test passed');
        return true;
      } else if (testData.code === 402) {
        console.log('⚠️ KIE AI API insufficient credits - but connectivity is working');
        return true; // Insufficient credits means API is reachable and auth is working
      }
    }

    console.log(`⚠️ KIE AI API connectivity test returned: ${testResponse.status}`);
    return false;
  } catch (error) {
    console.error('❌ KIE AI API connectivity test failed:', error);
    return false;
  }
}
*/

/**
 * Generate images using KIE AI API (with callback for async results)
 *
 * 🚀 最便宜方案：使用回调URL，只需要1次API调用！
 */
async function generateWithKieAI(
  request: ImageToStickerRequest,
  apiKey: string,
  localTaskId: string
): Promise<{ kieTaskId: string }> {
  const baseUrl = process.env.KIE_AI_BASE_URL || 'https://api.kie.ai';
  const kieApiUrl = `${baseUrl}/api/v1/gpt4o-image/generate`;

  const requestBody = {
    prompt: request.prompt,
    filesUrl: request.filesUrl,
    size: request.size,
    nVariants: request.nVariants || 1,
    maskUrl: request.maskUrl,
    callBackUrl: request.callBackUrl,
    isEnhance: request.isEnhance || false,
    uploadCn: request.uploadCn || false,
    enableFallback: request.enableFallback || false,
    fallbackModel: request.fallbackModel || 'FLUX_MAX'
  };

  // Production: remove debug logs
  // console.log('🚀 Calling KIE AI API with:', JSON.stringify(requestBody, null, 2));

  // Step 1: Create task
  const response = await fetch(kieApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ KIE AI API failed:', errorText);
    throw new Error(`KIE AI API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`KIE AI API error: ${data.msg}`);
  }

  const kieTaskId = data.data.taskId;
  if (!kieTaskId) {
    throw new Error('No taskId returned from KIE AI API');
  }

  // Store the KIE AI task ID for callback matching
  const localTask = taskStorage.get(localTaskId);
  if (localTask) {
    localTask.kieTaskId = kieTaskId;
    taskStorage.set(localTaskId, localTask);

    // Save task to backup file
    saveTaskBackup(localTaskId, localTask).catch(console.warn);
  }

  // Return the KIE AI task ID (no polling, just 1 API call!)
  return { kieTaskId };
}

/**
 * Process the generation task asynchronously
 */
async function processTask(taskId: string): Promise<void> {
  const task = taskStorage.get(taskId);
  if (!task) {
    console.error(`Task ${taskId} not found`);
    return;
  }

    try {
    console.log(`🔄 Processing task ${taskId}...`);
    task.status = TaskStatus.PROCESSING;
    taskStorage.set(taskId, task);

    // Initialize result URLs array (will be populated in test mode or via callback)
    let resultUrls: string[] = [];

    // Get KIE AI API key
    const kieApiKey = process.env.KIE_AI_API_KEY;
    const isValidApiKey = kieApiKey && kieApiKey !== 'your-kie-ai-api-key-here' && kieApiKey.length > 10;

    // Force test mode via env flag or fallback to prior logic
    const forceTest = (process.env.KIE_FORCE_TEST_MODE || '').toLowerCase() === 'true' || process.env.KIE_FORCE_TEST_MODE === '1';
    const isTestMode = forceTest || (process.env.NODE_ENV === 'development' && !isValidApiKey);

    // Prepare request for KIE AI API
    const kieRequest: ImageToStickerRequest = {
      prompt: task.prompt,
      filesUrl: task.filesUrl,
      size: task.size as SupportedSize,
      nVariants: task.nVariants as SupportedVariant,
      style: task.style,  // Include style information
      callBackUrl: task.callbackUrl // Pass the callback URL from the task object
    };

    if (isTestMode) {
      // Test mode: simulate KIE flow and callback without real API calls
      console.log(`🧪 [TEST MODE${forceTest ? ' (FORCED)' : ''}] Simulating KIE AI API for task ${taskId}...`);
      console.log(`🎨 [TEST MODE] Style: ${task.style || 'custom prompt'}`);

      // Assign a fake KIE task id for mapping
      const fakeKieTaskId = `test_${nanoid()}`;
      task.kieTaskId = fakeKieTaskId;
      task.status = TaskStatus.PROCESSING;
      taskStorage.set(taskId, task);
      await saveTaskBackup(taskId, task);

      // Simulate KIE callback after a brief delay using a better mock image
      const callbackUrl = task.callbackUrl;
      // Use a nice placeholder image based on style
      const mockImages = {
        ios: 'https://placehold.co/1024x1024/6B46C1/FFF/png?text=iOS+Sticker+✨',
        pixel: 'https://placehold.co/1024x1024/16A34A/FFF/png?text=Pixel+Art+🎮',
        lego: 'https://placehold.co/1024x1024/DC2626/FFF/png?text=LEGO+Style+🧱',
        snoopy: 'https://placehold.co/1024x1024/2563EB/FFF/png?text=Snoopy+Style+🐕',
        default: 'https://placehold.co/1024x1024/6B7280/FFF/png?text=AI+Sticker+🎨'
      };
      const dummyImage = mockImages[task.style] || mockImages.default;
      if (callbackUrl) {
        setTimeout(async () => {
          try {
            const payload = {
              code: 200,
              msg: 'success',
              data: {
                taskId: fakeKieTaskId,
                info: { result_urls: [dummyImage] }
              }
            };
            console.log(`🧪 [TEST MODE] Posting simulated callback to ${callbackUrl}`);
            await fetch(callbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (e) {
            console.warn('🧪 [TEST MODE] Failed to post simulated callback:', e);
          }
        }, 800);
      } else {
        console.warn('🧪 [TEST MODE] No callbackUrl available to simulate callback');
      }

    } else {
      // Production mode: actual KIE AI API call
      console.log(`🤖 Calling real KIE AI API for task ${taskId}...`);
      console.log(`🎨 Style: ${task.style || 'custom prompt'}`);
      console.log(`🔗 Setting callback URL: ${kieRequest.callBackUrl}`);

      try {
        // Call the real KIE AI API (callback mode - only 1 API call!)
        const kieResult = await generateWithKieAI(kieRequest, kieApiKey!, taskId);
        console.log(`✅ KIE AI task created successfully: ${kieResult.kieTaskId}`);
        console.log(`🚀 Using callback mode - results will be delivered via callback URL`);

      } catch (error) {
        console.error(`❌ KIE AI API call failed for task ${taskId}:`, error);

        // Provide more specific error messages based on error type
        let errorMessage = 'KIE AI API failed: ';
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('after') && error.message.includes('attempts')) {
            errorMessage += 'Request timeout. The image generation is taking longer than expected. ';
            errorMessage += 'Please check your KIE AI dashboard to see if the task completed successfully. ';
            errorMessage += 'If it did complete, the generated images may be available there.';
          } else if (error.message.includes('404')) {
            errorMessage += 'Task not found. The task may have expired or the task ID is invalid.';
          } else if (error.message.includes('401') || error.message.includes('authentication')) {
            errorMessage += 'Authentication failed. Please check your API key.';
          } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            errorMessage += 'Rate limit exceeded. Please try again later.';
          } else if (error.message.includes('402') || error.message.includes('credits')) {
            errorMessage += 'Insufficient credits. Please add more credits to your KIE AI account.';
          } else {
            errorMessage += error.message;
          }
        } else {
          errorMessage += 'Unknown error occurred';
        }

        throw new Error(errorMessage);
      }
    }

    // In callback mode, task stays PROCESSING until callback arrives
    if (!isTestMode) {
      task.status = TaskStatus.PROCESSING;
      console.log(`⏳ Task ${taskId} is now PROCESSING, waiting for KIE AI callback...`);
    } else {
      // For TEST MODE, we already set PROCESSING and scheduled simulated callback above
    }

    taskStorage.set(taskId, task);

    // 【新增】备份任务到文件
    await saveTaskBackup(taskId, task);

    // Note: Do not POST to our own callback URL here. KIE AI will call our callback.

  } catch (error) {
    console.error(`❌ Task ${taskId} failed:`, error);
    task.status = TaskStatus.FAILED;
    task.error = error instanceof Error ? error.message : 'Unknown error';
    taskStorage.set(taskId, task);
  }
}

/**
 * Main API handler
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log(`[DEBUG] Loaded SITE_URL: ${process.env.SITE_URL}`);
    console.log('🚀 Starting AI image-to-sticker generation...');

    // 1. Check user authentication using session (consistent with improved API)
    const { getSession } = await import('@/lib/server');
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({
        code: RESPONSE_CODES.UNAUTHORIZED,
        msg: 'Authentication required'
      }, { status: 401 });
    }

    const user = session.user;

    // 2. Parse and validate request body
    let requestBody: ImageToStickerRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      return NextResponse.json({
        code: RESPONSE_CODES.FORMAT_ERROR,
        msg: 'The parameter is not in a valid JSON format'
      }, { status: 400 });
    }

    // 3. Validate required parameters
    if (!requestBody.size || !SUPPORTED_SIZES.includes(requestBody.size)) {
      return NextResponse.json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        msg: `Size is required and must be one of: ${SUPPORTED_SIZES.join(', ')}`
      }, { status: 422 });
    }

    if (!requestBody.prompt && !requestBody.filesUrl && !requestBody.fileUrl) {
      return NextResponse.json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        msg: 'At least one of prompt or filesUrl must be provided'
      }, { status: 422 });
    }

    if (requestBody.nVariants && !SUPPORTED_VARIANTS.includes(requestBody.nVariants)) {
      return NextResponse.json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        msg: `nVariants must be one of: ${SUPPORTED_VARIANTS.join(', ')}`
      }, { status: 422 });
    }

    // Validate style if provided
    if (requestBody.style && !SUPPORTED_STYLES.includes(requestBody.style)) {
      return NextResponse.json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        msg: `Style must be one of: ${SUPPORTED_STYLES.join(', ')}`
      }, { status: 422 });
    }

    // Test mode: restrict to single input image for cost optimization
    if (requestBody.filesUrl && requestBody.filesUrl.length > TEST_MODE_SETTINGS.maxInputImages) {
      return NextResponse.json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        msg: `[TEST MODE] Maximum ${TEST_MODE_SETTINGS.maxInputImages} input image allowed for cost optimization`
      }, { status: 422 });
    }

    // 4. Check user credits before processing
    const { canGenerateStickerAction } = await import('@/actions/credits-actions');
    const creditsCheck = await canGenerateStickerAction({
      requiredCredits: CREDITS_PER_IMAGE,
    });

    if (!creditsCheck?.data?.success || !creditsCheck.data.data?.canGenerate) {
      return NextResponse.json({
        code: RESPONSE_CODES.INSUFFICIENT_CREDITS,
        msg: 'Insufficient credits',
        required: CREDITS_PER_IMAGE,
        current: creditsCheck?.data?.data?.currentCredits || 0,
      }, { status: 402 });
    }

    console.log(`💳 User ${user.id} has ${creditsCheck.data.data.currentCredits} credits, proceeding with generation...`);

    // 5. Check KIE AI API key
    const kieApiKey = process.env.KIE_AI_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json({
        code: RESPONSE_CODES.SERVER_ERROR,
        msg: 'KIE AI API key not configured'
      }, { status: 500 });
    }

    // 6. Check for duplicate requests
    const requestHash = generateRequestHash(
      user.id,
      requestBody.filesUrl,
      requestBody.prompt,
      requestBody.style || ''
    );

    const existingTaskId = requestCache.get(requestHash);
    if (existingTaskId && taskStorage.has(existingTaskId)) {
      const existingTask = taskStorage.get(existingTaskId)!;
      console.log(`🔄 [DUPLICATE] Found existing task ${existingTaskId} for user ${user.id}`);

      return NextResponse.json({
        code: RESPONSE_CODES.SUCCESS,
        msg: 'Request already in progress',
        data: {
          taskId: existingTaskId,
          status: existingTask.status,
          duplicate: true
        }
      });
    }

    // 7. Apply cost optimization settings for test mode
    console.log(`🧪 [TEST MODE] Applying cost optimization settings for user ${user.id}`);

    // Apply style-specific prompt if style is provided
    let finalPrompt = requestBody.prompt;
    if (requestBody.style && STICKER_STYLES[requestBody.style]) {
      const styleConfig = STICKER_STYLES[requestBody.style];
      finalPrompt = styleConfig.userPrompt;
      console.log(`🎨 [STYLE] Applied ${requestBody.style} style: ${styleConfig.name}`);
    }

    // Force lowest cost settings
    const optimizedRequest = {
      ...requestBody,
      prompt: finalPrompt,                          // Apply style-specific prompt
      size: TEST_MODE_SETTINGS.forceSize,           // Force 1:1 ratio
      nVariants: TEST_MODE_SETTINGS.forceVariants,  // Force single variant
      isEnhance: false,                             // Disable enhancement
      enableFallback: false,                        // Disable fallback
      fallbackModel: TEST_MODE_SETTINGS.forceModel, // Use default model
      uploadCn: false                               // Use international servers
    };

    // Limit input images
    if (optimizedRequest.filesUrl && optimizedRequest.filesUrl.length > TEST_MODE_SETTINGS.maxInputImages) {
      optimizedRequest.filesUrl = optimizedRequest.filesUrl.slice(0, TEST_MODE_SETTINGS.maxInputImages);
      console.log(`🧪 [COST OPTIMIZATION] Reduced input images to ${TEST_MODE_SETTINGS.maxInputImages}`);
    }

    console.log(`🧪 [COST OPTIMIZATION] Settings applied:`, {
      style: requestBody.style || 'none',
      size: optimizedRequest.size,
      nVariants: optimizedRequest.nVariants,
      isEnhance: optimizedRequest.isEnhance,
      enableFallback: optimizedRequest.enableFallback,
      inputImages: optimizedRequest.filesUrl?.length || 0,
      promptApplied: !!finalPrompt
    });

    // 6. Create task with optimized settings
    const taskId = `task_${nanoid()}`;

    // Dynamically construct the callback URL from request headers for robustness
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const siteUrl = host ? `${protocol}://${host}` : undefined;

    if (!siteUrl) {
      console.error('❌ Could not determine site URL from request headers!');
    }
    const callbackUrl = siteUrl ? `${siteUrl}/api/kie-ai-callback` : undefined;
    console.log(`[DEBUG] Determined callback base URL: ${siteUrl}`);


    const task: TaskData = {
      taskId,
      status: TaskStatus.PENDING,
      prompt: optimizedRequest.prompt,
      filesUrl: optimizedRequest.filesUrl,
      size: optimizedRequest.size,
      nVariants: optimizedRequest.nVariants,
      style: requestBody.style,  // Store original style selection
      userId: user.id,
      createdAt: new Date(),
      callbackUrl: callbackUrl // Use the dynamically constructed URL
    };

    taskStorage.set(taskId, task);
    requestCache.set(requestHash, taskId); // Cache for deduplication

    // Save task to backup file BEFORE processing
    await saveTaskBackup(taskId, task);

    // 8. Deduct credits after task creation (pre-deduction to prevent abuse)
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: user.id,
      amount: CREDITS_PER_IMAGE,
    });

    if (deductResult?.data?.success) {
      console.log(`💰 Deducted ${CREDITS_PER_IMAGE} credits from user ${user.id}. Remaining: ${deductResult.data.data?.remainingCredits}`);
    } else {
      console.warn(`⚠️ Failed to deduct credits from user ${user.id}, but task was created successfully`);
    }

    // 9. Start async processing, but DO NOT await it
    processTask(taskId).catch(error => {
      console.error(`Failed to process task ${taskId}:`, error);
    });

    // 10. Return success response
    return NextResponse.json({
      code: RESPONSE_CODES.SUCCESS,
      msg: 'success',
      data: { taskId }
    });

  } catch (error) {
    console.error('❌ AI sticker generation failed:', error);
    return NextResponse.json({
      code: RESPONSE_CODES.SERVER_ERROR,
      msg: error instanceof Error ? error.message : 'An unexpected error occurred while processing the request'
    }, { status: 500 });
  }
}

/**
 * Get task status endpoint and styles retrieval
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const styles = searchParams.get('styles');

  // Return available styles
  if (styles === 'true') {
    return NextResponse.json({
      code: RESPONSE_CODES.SUCCESS,
      msg: 'success',
      data: {
        styles: Object.entries(STICKER_STYLES).map(([key, value]) => ({
          id: key,
          name: value.name,
          imageUrl: value.imageUrl,
          description: value.userPrompt.substring(0, 100) + '...'
        }))
      }
    });
  }

  // Check task status
  if (!taskId) {
    return NextResponse.json({
      code: RESPONSE_CODES.VALIDATION_ERROR,
      msg: 'taskId parameter is required'
    }, { status: 422 });
  }

  let task = taskStorage.get(taskId);

  // If task not found in memory, try to restore from backup
  if (!task) {
    try {
      await loadTaskBackup();
      task = taskStorage.get(taskId);
    } catch (error) {
      console.warn('Failed to load task backup:', error);
    }
  }

  if (!task) {
    return NextResponse.json({
      code: RESPONSE_CODES.NOT_FOUND,
      msg: 'Task not found'
    }, { status: 404 });
  }

  // Check for client type from headers (can be used to determine format)
  const acceptHeader = req.headers.get('accept');
  const userAgent = req.headers.get('user-agent');
  const wantsMinimal = req.headers.get('x-minimal-response') === 'true';
  
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isFailed = task.status === TaskStatus.FAILED;
  
  // Prepare response data
  let responseData: any;
  
  if (wantsMinimal) {
    // New minimal format (for optimized clients)
    responseData = {
      s: task.status,  // status
    };
    
    if (isCompleted && task.resultUrls?.length > 0) {
      responseData.u = task.resultUrls[0];  // url
      if (task.r2Urls?.length > 0) {
        responseData.u = task.r2Urls[0];
      }
    }
    
    if (isFailed && task.error) {
      responseData.e = task.error.substring(0, 100);  // error
    }
    
    if (task.status === TaskStatus.PROCESSING || task.status === TaskStatus.PENDING) {
      const elapsed = Date.now() - task.createdAt.getTime();
      const estimatedTotal = 120000; // 2 minutes average
      const progress = Math.min(Math.round((elapsed / estimatedTotal) * 100), 95);
      responseData.p = progress;  // progress percentage
    }
  } else {
    // Legacy format (for backward compatibility with current frontend)
    responseData = {
      status: task.status,
      resultUrls: task.resultUrls || [],
      error: task.error
    };
    
    // Include R2 URLs if available (preferred over KIE URLs)
    if (task.r2Urls?.length > 0) {
      responseData.resultUrls = task.r2Urls;
    }
    
    // Include progress for processing tasks
    if (task.status === TaskStatus.PROCESSING || task.status === TaskStatus.PENDING) {
      const elapsed = Date.now() - task.createdAt.getTime();
      const estimatedTotal = 120000; // 2 minutes average
      responseData.progress = Math.min(Math.round((elapsed / estimatedTotal) * 100), 95);
    }
    
    // Include creation time for timing purposes
    if (task.createdAt) {
      responseData.createdAt = task.createdAt;
    }
  }

  // Set appropriate cache headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Cache completed/failed tasks longer
  if (isCompleted || isFailed) {
    headers['Cache-Control'] = 'private, max-age=3600'; // 1 hour
  } else {
    headers['Cache-Control'] = 'private, max-age=5'; // 5 seconds for active tasks
  }

  return NextResponse.json({
    code: RESPONSE_CODES.SUCCESS,
    msg: 'success',
    data: responseData
  }, { headers });
}

// Task persistence helpers
const TASKS_BACKUP_FILE = path.join(process.cwd(), '.tasks-backup.json');

/**
 * 保存任务到文件备份
 */
async function saveTaskBackup(taskId: string, task: TaskData): Promise<void> {
  try {
    let backupData: Record<string, any> = {};

    // 尝试读取现有备份
    try {
      const existing = await fs.readFile(TASKS_BACKUP_FILE, 'utf-8');
      backupData = JSON.parse(existing);
    } catch (error) {
      // 文件不存在或损坏，使用空对象
    }

    // 更新任务数据
    backupData[taskId] = {
      ...task,
      createdAt: task.createdAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };

    // 清理过期任务 (超过24小时)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    Object.keys(backupData).forEach(key => {
      const taskCreatedAt = backupData[key].createdAt;
      if (taskCreatedAt && new Date(taskCreatedAt) < oneDayAgo) {
        delete backupData[key];
      }
    });

    // 保存到文件
    await fs.writeFile(TASKS_BACKUP_FILE, JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.warn('⚠️ Failed to save task backup:', error);
  }
}

/**
 * 从文件备份恢复任务
 */
async function loadTaskBackup(): Promise<void> {
  try {
    const data = await fs.readFile(TASKS_BACKUP_FILE, 'utf-8');
    const backupData = JSON.parse(data);

    let restoredCount = 0;
    Object.entries(backupData).forEach(([taskId, taskData]: [string, any]) => {
      if (!taskStorage.has(taskId)) {
        // 恢复日期对象
        const task: TaskData = {
          ...taskData,
          createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
          completedAt: taskData.completedAt ? new Date(taskData.completedAt) : undefined,
        };
        taskStorage.set(taskId, task);
        restoredCount++;
      }
    });

    if (restoredCount > 0) {
      console.log(`🔄 Restored ${restoredCount} tasks from backup`);
    }

  } catch (error) {
    console.log('📝 No task backup found or failed to load (this is normal on first run)');
  }
}

// Initialize task backup on startup
loadTaskBackup().catch(console.warn);
