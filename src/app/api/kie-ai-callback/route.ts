import { NextRequest, NextResponse } from 'next/server';
import { downloadAndSaveImage, taskStorage, TaskStatus, TaskData, StickerStyle } from '../image-to-sticker-ai/route';
import fs from 'fs/promises';
import path from 'path';

// Task backup helpers
const TASKS_BACKUP_FILE = path.join(process.cwd(), '.tasks-backup.json');
const ORPHANED_RESULTS_FILE = path.join(process.cwd(), '.orphaned-results.json');

async function saveTaskBackup(taskId: string, task: any): Promise<void> {
  try {
    let backupData: Record<string, any> = {};

    try {
      const existing = await fs.readFile(TASKS_BACKUP_FILE, 'utf-8');
      backupData = JSON.parse(existing);
    } catch (error) {
      // File does not exist or is corrupted, start with an empty object
    }

    backupData[taskId] = {
      ...task,
      createdAt: task.createdAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };

    await fs.writeFile(TASKS_BACKUP_FILE, JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.warn('⚠️ Failed to save task backup in callback:', error);
  }
}

/**
 * KIE AI Callback Endpoint - Optimized for Vercel
 * 
 * Key optimizations:
 * 1. Immediate response (< 1 second) to avoid KIE AI timeout
 * 2. Async processing using waitUntil (Vercel Edge Runtime)
 * 3. No image download through Vercel to save bandwidth
 * 4. Direct URL storage for frontend access
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Quick parse - minimal processing
    const callbackData = await req.json();
    const { code, msg, data } = callbackData;
    const { taskId, info } = data || {};

    // Immediate validation
    if (!taskId) {
      console.log('⚠️ Callback missing taskId, acknowledging anyway');
      return NextResponse.json({ status: 'received' }, { status: 200 });
    }

    // Log callback received (for monitoring)
    console.log(`📥 Callback received for KIE task ${taskId} in ${Date.now() - startTime}ms`);

    // CRITICAL: Return immediately to avoid timeout
    // Use Vercel's waitUntil for async processing
    const response = NextResponse.json({ status: 'received' }, { status: 200 });
    
    // Process asynchronously without blocking response
    // Note: waitUntil is not available in all environments
    // Fallback to fire-and-forget pattern
    processCallbackAsync(taskId, code, msg, info).catch(err => {
      console.error(`❌ Async processing failed for ${taskId}:`, err);
    });

    return response;

  } catch (error) {
    console.error('❌ Callback processing error:', error);
    // Always return 200 to prevent KIE AI retries
    return NextResponse.json({ status: 'received', error: true }, { status: 200 });
  }
}

/**
 * Process callback asynchronously - runs after response is sent
 */
async function processCallbackAsync(
  kieTaskId: string, 
  code: number, 
  msg: string, 
  info: any
): Promise<void> {
  const processingStart = Date.now();
  
  try {
    // Find local task with better retry strategy
    // Increase retries and delay because task creation and callback can race
    const localTask = await findTaskWithRetries(kieTaskId, 10, 500); // More retries
    
    if (!localTask) {
      console.warn(`⚠️ No local task found for KIE ${kieTaskId} after retries`);
      
      // Fallback: Try to handle orphaned successful callbacks
      if (code === 200 && info?.result_urls?.length > 0) {
        console.log(`🔧 Attempting to save orphaned successful result for KIE ${kieTaskId}`);
        
        // Store the result in a special orphaned results map
        // This can be retrieved later if the task is found
        const orphanedResult = {
          kieTaskId,
          resultUrls: info.result_urls,
          completedAt: new Date(),
          code,
          msg
        };
        
        // Save to backup for recovery
        await saveOrphanedResult(kieTaskId, orphanedResult);
        console.log(`💾 Saved orphaned result for future recovery: ${kieTaskId}`);
      }
      return;
    }

    console.log(`🔄 Processing callback for local task ${localTask.taskId}`);

    if (code === 200 && info?.result_urls?.length > 0) {
      // SUCCESS: Save URLs directly without downloading
      // This saves bandwidth and processing time
      
      const kieImageUrls = info.result_urls.slice(0, 1); // Limit to 1 image
      console.log(`✅ Task ${localTask.taskId} completed with ${kieImageUrls.length} image(s)`);

      // Option 1: Store KIE URLs directly (temporary, may expire)
      localTask.status = TaskStatus.COMPLETED;
      localTask.completedAt = new Date();
      localTask.resultUrls = kieImageUrls; // Direct KIE URLs
      localTask.error = undefined;
      
      // Option 2: Schedule background R2 upload (non-blocking)
      // This can be done via a separate worker or cron job
      scheduleR2Upload(localTask.taskId, kieImageUrls[0]).catch(console.error);
      
    } else if (code === 200) {
      // Success but no images
      localTask.status = TaskStatus.FAILED;
      localTask.error = 'Task completed but no images received';
      localTask.completedAt = new Date();
      
    } else {
      // Failure with specific error handling
      localTask.status = TaskStatus.FAILED;
      localTask.completedAt = new Date();
      
      // Provide user-friendly error messages
      switch (code) {
        case 400:
          localTask.error = 'Content violated policies or invalid parameters';
          break;
        case 451:
          localTask.error = 'Failed to download source image';
          break;
        case 500:
          localTask.error = 'Server error, please try again';
          break;
        default:
          localTask.error = msg || 'Generation failed';
      }
    }

    // Update task in memory
    taskStorage.set(localTask.taskId, localTask);
    
    // Save backup asynchronously (non-blocking)
    saveTaskBackup(localTask.taskId, localTask).catch(err => {
      console.warn(`⚠️ Failed to save backup for ${localTask.taskId}:`, err);
    });

    console.log(`✅ Callback processed for ${localTask.taskId} in ${Date.now() - processingStart}ms`);
    
  } catch (error) {
    console.error(`❌ Failed to process callback for ${kieTaskId}:`, error);
  }
}

/**
 * Schedule R2 upload in background (non-blocking)
 * This runs separately to avoid blocking the callback response
 */
async function scheduleR2Upload(taskId: string, kieUrl: string): Promise<void> {
  // TODO: Implement R2 upload via Cloudflare Worker or separate endpoint
  // For now, just log the intent
  console.log(`📋 Scheduled R2 upload for task ${taskId}: ${kieUrl}`);
  
  // Future implementation:
  // 1. Call Cloudflare Worker to download from KIE and upload to R2
  // 2. Update task with R2 URL when complete
  // 3. This avoids bandwidth usage on Vercel
}

/**
 * Finds a local task by its KIE AI task ID, with retries to handle race conditions.
 */
async function findTaskWithRetries(kieTaskId: string, retries = 5, delay = 500): Promise<TaskData | null> {
  for (let i = 0; i < retries; i++) {
    for (const task of taskStorage.values()) {
      if (task.kieTaskId === kieTaskId) {
        return task;
      }
    }
    if (i < retries - 1) {
      console.log(`⏳ Local task for KIE task ${kieTaskId} not found, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}


/**
 * Save orphaned callback results for later recovery
 */
async function saveOrphanedResult(kieTaskId: string, result: any): Promise<void> {
  try {
    let orphanedData: Record<string, any> = {};
    
    try {
      const existing = await fs.readFile(ORPHANED_RESULTS_FILE, 'utf-8');
      orphanedData = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    orphanedData[kieTaskId] = {
      ...result,
      savedAt: new Date().toISOString()
    };
    
    // Clean up old orphaned results (older than 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    Object.keys(orphanedData).forEach(key => {
      const savedAt = new Date(orphanedData[key].savedAt).getTime();
      if (savedAt < oneDayAgo) {
        delete orphanedData[key];
      }
    });
    
    await fs.writeFile(ORPHANED_RESULTS_FILE, JSON.stringify(orphanedData, null, 2));
  } catch (error) {
    console.error('Failed to save orphaned result:', error);
  }
}

/**
 * GET method for health checks
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'KIE AI callback endpoint is ready',
    timestamp: new Date().toISOString()
  });
}
