/**
 * Optimized KIE AI Image-to-Sticker API for Vercel + Cloudflare
 * 
 * Key Optimizations:
 * 1. Polling instead of callbacks (eliminates callback URL complexity)
 * 2. Direct URL returns (no image downloading through Vercel)
 * 3. Cloudflare Worker for R2 uploads (offloads bandwidth from Vercel)
 * 4. Efficient task caching with Redis/KV Store
 * 5. Minimal response payloads
 * 
 * Deployment Strategy:
 * - Vercel: API endpoints only (minimal bandwidth)
 * - Cloudflare: R2 storage + Workers for image processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// ==================== Configuration ====================

const IS_MOCK_MODE = process.env.MOCK_KIE_API === 'true' || 
  (process.env.NODE_ENV === 'development' && !process.env.KIE_AI_API_KEY);

const KIE_CONFIG = {
  baseUrl: process.env.KIE_AI_BASE_URL || 'https://api.kie.ai',
  apiKey: process.env.KIE_AI_API_KEY || 'mock-api-key',
  maxPollingAttempts: 30, // 30 attempts × 10 seconds = 5 minutes max
  pollingInterval: 10000, // 10 seconds between polls
};

const CLOUDFLARE_CONFIG = {
  r2WorkerUrl: process.env.R2_WORKER_URL || '', // Cloudflare Worker URL for R2 uploads
  kvNamespace: process.env.KV_NAMESPACE || '', // For task caching
};

// Response codes
const RESPONSE_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INSUFFICIENT_CREDITS: 402,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;

// Supported configurations (minimal for cost optimization)
const SUPPORTED_SIZES = ['1:1'] as const;
const SUPPORTED_VARIANTS = [1] as const;

// ==================== Types ====================

interface OptimizedRequest {
  prompt?: string;
  filesUrl?: string[];
  style?: 'ios' | 'pixel' | 'lego' | 'snoopy';
  // Simplified - always use optimal settings
}

interface OptimizedResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string; // Single URL for simplicity
  error?: string;
  progress?: number;
}

interface KieApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    status?: string;
    response?: {
      result_urls?: string[];
    };
    errorMessage?: string;
    progress?: string;
  };
}

// Style prompts
const STYLE_PROMPTS = {
  ios: "Transform into iOS emoji-style 3D sticker with transparent background, maintaining all original details",
  pixel: "Convert to pixel art sticker style with transparent background, keeping original poses and details",
  lego: "Transform into LEGO Minifigure style sticker with transparent background",
  snoopy: "Convert to Peanuts comic strip style character with transparent background",
};

// Mock images for different styles (using placeholder service)
const MOCK_STYLE_IMAGES = {
  ios: 'https://placehold.co/1024x1024/9333ea/ffffff/png?text=iOS+Style+Sticker+✨',
  pixel: 'https://placehold.co/1024x1024/16a34a/ffffff/png?text=Pixel+Art+🎮',
  lego: 'https://placehold.co/1024x1024/dc2626/ffffff/png?text=LEGO+Style+🧱',
  snoopy: 'https://placehold.co/1024x1024/2563eb/ffffff/png?text=Snoopy+Style+🐕',
  default: 'https://placehold.co/1024x1024/6b7280/ffffff/png?text=AI+Sticker+🎨',
};

// ==================== Mock Storage ====================

// 模拟任务存储（本地测试用）
const mockTaskStorage = new Map<string, {
  kieTaskId: string;
  localTaskId: string;
  status: string;
  progress: number;
  resultUrl?: string;
  error?: string;
  completionTime?: number;
}>();

// ==================== Utility Functions ====================

/**
 * Simple in-memory cache for development
 * In production, use Redis or Cloudflare KV
 */
const taskCache = new Map<string, OptimizedResponse>();

/**
 * Store task in cache
 */
async function cacheTask(taskId: string, data: OptimizedResponse): Promise<void> {
  if (CLOUDFLARE_CONFIG.kvNamespace) {
    // TODO: Implement Cloudflare KV storage
    // await kvNamespace.put(taskId, JSON.stringify(data), { expirationTtl: 3600 });
  } else {
    // Fallback to in-memory cache
    taskCache.set(taskId, data);
    
    // Clean up old entries after 1 hour
    setTimeout(() => taskCache.delete(taskId), 3600000);
  }
}

/**
 * Retrieve task from cache
 */
async function getCachedTask(taskId: string): Promise<OptimizedResponse | null> {
  if (CLOUDFLARE_CONFIG.kvNamespace) {
    // TODO: Implement Cloudflare KV retrieval
    // const data = await kvNamespace.get(taskId);
    // return data ? JSON.parse(data) : null;
    return null;
  } else {
    return taskCache.get(taskId) || null;
  }
}

/**
 * Create KIE AI task with minimal parameters
 */
async function createKieTask(
  prompt: string,
  filesUrl?: string[]
): Promise<{ taskId: string } | { error: string }> {
  try {
    const response = await fetch(`${KIE_CONFIG.baseUrl}/api/v1/gpt4o-image/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        filesUrl,
        size: '1:1', // Always use square for lowest cost
        nVariants: 1, // Single variant only
        isEnhance: false, // No enhancement
        enableFallback: false, // No fallback
      }),
    });

    const data: KieApiResponse = await response.json();

    if (data.code === 200 && data.data?.taskId) {
      return { taskId: data.data.taskId };
    }

    // Handle specific error codes
    if (data.code === 402) {
      return { error: 'Insufficient KIE AI credits' };
    }
    if (data.code === 401) {
      return { error: 'Invalid KIE AI API key' };
    }

    return { error: data.msg || 'Failed to create task' };
  } catch (error) {
    console.error('KIE AI create task error:', error);
    return { error: 'Network error creating task' };
  }
}

/**
 * Poll KIE AI task status (single poll, not loop)
 */
async function pollKieTask(taskId: string): Promise<KieApiResponse['data'] | null> {
  try {
    const response = await fetch(
      `${KIE_CONFIG.baseUrl}/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${KIE_CONFIG.apiKey}`,
        },
      }
    );

    const data: KieApiResponse = await response.json();

    if (data.code === 200) {
      return data.data || null;
    }

    return null;
  } catch (error) {
    console.error('KIE AI poll error:', error);
    return null;
  }
}

/**
 * Schedule R2 upload via Cloudflare Worker (non-blocking)
 */
async function scheduleR2Upload(imageUrl: string, taskId: string): Promise<string | null> {
  if (!CLOUDFLARE_CONFIG.r2WorkerUrl) {
    // No R2 worker configured, return original URL
    return imageUrl;
  }

  try {
    // Call Cloudflare Worker to handle the upload
    const response = await fetch(CLOUDFLARE_CONFIG.r2WorkerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: imageUrl,
        destinationKey: `stickers/${taskId}-${nanoid(6)}.png`,
      }),
    });

    if (response.ok) {
      const { url } = await response.json();
      return url;
    }
  } catch (error) {
    console.error('R2 upload scheduling failed:', error);
  }

  return imageUrl; // Fallback to original URL
}

// ==================== API Endpoints ====================

/**
 * POST /api/image-to-sticker-optimized
 * Create a new sticker generation task
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const { getSession } = await import('@/lib/server');
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { code: RESPONSE_CODES.UNAUTHORIZED, msg: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body: OptimizedRequest = await req.json();

    // 3. Validate request
    if (!body.prompt && !body.filesUrl?.length) {
      return NextResponse.json(
        { code: RESPONSE_CODES.BAD_REQUEST, msg: 'Prompt or filesUrl required' },
        { status: 400 }
      );
    }

    // 4. Check credits
    const { canGenerateStickerAction } = await import('@/actions/credits-actions');
    const creditsCheck = await canGenerateStickerAction({ requiredCredits: 1 });

    if (!creditsCheck?.data?.success) {
      return NextResponse.json(
        { code: RESPONSE_CODES.INSUFFICIENT_CREDITS, msg: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // 5. Apply style prompt if specified
    let finalPrompt = body.prompt || '';
    if (body.style && STYLE_PROMPTS[body.style]) {
      finalPrompt = STYLE_PROMPTS[body.style];
    }

    // 6. Create KIE task
    const kieResult = await createKieTask(finalPrompt, body.filesUrl);

    if ('error' in kieResult) {
      return NextResponse.json(
        { code: RESPONSE_CODES.SERVER_ERROR, msg: kieResult.error },
        { status: 500 }
      );
    }

    // 7. Create local task ID for tracking
    const localTaskId = `task_${nanoid(10)}`;

    // 8. Cache initial task state
    await cacheTask(localTaskId, {
      taskId: kieResult.taskId,
      status: 'processing',
    });

    // 9. Deduct credits
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    await deductCreditsAction({
      userId: session.user.id,
      amount: 1,
    });

    // 10. Return task ID immediately
    return NextResponse.json({
      code: RESPONSE_CODES.SUCCESS,
      msg: 'Task created',
      data: { taskId: localTaskId },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { code: RESPONSE_CODES.SERVER_ERROR, msg: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/image-to-sticker-optimized?taskId=xxx
 * Check task status (client polls this)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { code: RESPONSE_CODES.BAD_REQUEST, msg: 'Task ID required' },
        { status: 400 }
      );
    }

    // 1. Get cached task
    const cachedTask = await getCachedTask(taskId);

    if (!cachedTask) {
      return NextResponse.json(
        { code: RESPONSE_CODES.NOT_FOUND, msg: 'Task not found' },
        { status: 404 }
      );
    }

    // 2. If already completed/failed, return cached result
    if (cachedTask.status === 'completed' || cachedTask.status === 'failed') {
      return NextResponse.json({
        code: RESPONSE_CODES.SUCCESS,
        data: {
          status: cachedTask.status,
          resultUrl: cachedTask.resultUrl,
          error: cachedTask.error,
        },
      });
    }

    // 3. Poll KIE AI for status
    const kieStatus = await pollKieTask(cachedTask.taskId);

    if (!kieStatus) {
      // Polling failed, return current status
      return NextResponse.json({
        code: RESPONSE_CODES.SUCCESS,
        data: {
          status: 'processing',
          progress: cachedTask.progress || 0,
        },
      });
    }

    // 4. Update based on KIE status
    if (kieStatus.status === 'SUCCESS' && kieStatus.response?.result_urls?.length) {
      // Task completed successfully
      const imageUrl = kieStatus.response.result_urls[0];
      
      // Optional: Schedule R2 upload for permanent storage
      const permanentUrl = await scheduleR2Upload(imageUrl, taskId);

      const updatedTask: OptimizedResponse = {
        ...cachedTask,
        status: 'completed',
        resultUrl: permanentUrl || imageUrl,
      };

      await cacheTask(taskId, updatedTask);

      return NextResponse.json({
        code: RESPONSE_CODES.SUCCESS,
        data: {
          status: 'completed',
          resultUrl: updatedTask.resultUrl,
        },
      });
    }

    if (kieStatus.status === 'GENERATE_FAILED' || kieStatus.status === 'CREATE_TASK_FAILED') {
      // Task failed
      const updatedTask: OptimizedResponse = {
        ...cachedTask,
        status: 'failed',
        error: kieStatus.errorMessage || 'Generation failed',
      };

      await cacheTask(taskId, updatedTask);

      return NextResponse.json({
        code: RESPONSE_CODES.SUCCESS,
        data: {
          status: 'failed',
          error: updatedTask.error,
        },
      });
    }

    // 5. Still processing
    const progress = kieStatus.progress ? parseFloat(kieStatus.progress) * 100 : 0;
    
    const updatedTask: OptimizedResponse = {
      ...cachedTask,
      progress,
    };

    await cacheTask(taskId, updatedTask);

    return NextResponse.json({
      code: RESPONSE_CODES.SUCCESS,
      data: {
        status: 'processing',
        progress,
      },
    });

  } catch (error) {
    console.error('GET API error:', error);
    return NextResponse.json(
      { code: RESPONSE_CODES.SERVER_ERROR, msg: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
