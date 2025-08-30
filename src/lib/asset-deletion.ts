import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 通用资产删除服务
 * 负责同步删除数据库记录和R2存储文件
 */

export interface AssetDeletionResult {
  success: boolean;
  deleted_from_db: boolean;
  deleted_from_r2: boolean;
  error?: string;
}

/**
 * 从R2删除文件
 */
async function deleteFromR2(storageKey: string): Promise<boolean> {
  try {
    // 检查是否配置了R2环境变量
    const R2_ENDPOINT = process.env.R2_ENDPOINT;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.warn('⚠️ R2 configuration missing, skipping file deletion');
      return false;
    }

    // 使用AWS SDK兼容的S3客户端
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    });

    await s3Client.send(deleteCommand);
    console.log(`✅ Successfully deleted file from R2: ${storageKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete file from R2: ${storageKey}`, error);
    return false;
  }
}

/**
 * 删除单个资产（数据库记录 + R2文件）
 */
export async function deleteAsset(assetId: string, userId?: string): Promise<AssetDeletionResult> {
  const result: AssetDeletionResult = {
    success: false,
    deleted_from_db: false,
    deleted_from_r2: false,
  };

  try {
    const db = await getDb();

    // 先获取资产信息
    const whereConditions = userId
      ? and(eq(assets.id, assetId), eq(assets.user_id, userId))
      : eq(assets.id, assetId);

    const assetRecord = await db.select().from(assets).where(whereConditions).limit(1);

    if (assetRecord.length === 0) {
      result.error = 'Asset not found or access denied';
      return result;
    }

    const asset = assetRecord[0];
    console.log(`🗑️ Deleting asset: ${assetId} (key: ${asset.key})`);

    // 1. 从R2删除文件
    if (asset.key) {
      result.deleted_from_r2 = await deleteFromR2(asset.key);
    } else {
      console.warn(`⚠️ Asset ${assetId} has no storage key, skipping R2 deletion`);
      result.deleted_from_r2 = true; // 没有key就当作成功
    }

    // 2. 从数据库删除记录
    const deleteWhereConditions = userId
      ? and(eq(assets.id, assetId), eq(assets.user_id, userId))
      : eq(assets.id, assetId);

    const deletedRows = await db.delete(assets).where(deleteWhereConditions).returning();


    result.deleted_from_db = deletedRows.length > 0;

    result.success = result.deleted_from_db; // 数据库删除成功即可

    if (result.success) {
      console.log(`✅ Asset ${assetId} deleted successfully (DB: ${result.deleted_from_db}, R2: ${result.deleted_from_r2})`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Error deleting asset ${assetId}:`, error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * 批量删除资产
 */
export async function deleteAssets(assetIds: string[], userId?: string): Promise<{
  success: boolean;
  results: Record<string, AssetDeletionResult>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const results: Record<string, AssetDeletionResult> = {};

  console.log(`🗑️ Batch deleting ${assetIds.length} assets...`);

  // 并行删除（限制并发数）
  const BATCH_SIZE = 5;
  for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
    const batch = assetIds.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (assetId) => {
      const result = await deleteAsset(assetId, userId);
      results[assetId] = result;
    });

    await Promise.all(batchPromises);
  }

  const successful = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success).length;

  console.log(`✅ Batch deletion complete: ${successful} successful, ${failed} failed`);

  return {
    success: failed === 0,
    results,
    summary: {
      total: assetIds.length,
      successful,
      failed,
    },
  };
}

/**
 * 从历史记录项获取资产ID
 * 支持不同类型的历史记录格式
 */
export function extractAssetIdFromHistoryItem(item: any): string | null {
  // 尝试直接获取asset_id
  if (item.asset_id && typeof item.asset_id === 'string') {
    return item.asset_id;
  }

  // 尝试从URL解析asset_id（适用于签名URL）
  if (item.url && typeof item.url === 'string') {
    try {
      if (item.url.startsWith('/api/assets/download')) {
        const urlObj = new URL(item.url, 'http://localhost');
        return urlObj.searchParams.get('asset_id');
      }
    } catch (error) {
      console.warn('Failed to extract asset_id from URL:', item.url);
    }
  }

  return null;
}
