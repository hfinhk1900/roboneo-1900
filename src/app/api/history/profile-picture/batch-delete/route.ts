import { getDb } from '@/db';
import { profilePictureHistory } from '@/db/schema';
import {
  deleteAsset,
  extractAssetIdFromHistoryItem,
} from '@/lib/asset-deletion';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // 1. 先获取所有要删除的历史记录
    const historyRecords = await db
      .select()
      .from(profilePictureHistory)
      .where(eq(profilePictureHistory.userId, session.user.id));

    console.log(
      `🗑️ Batch deleting ${historyRecords.length} ProfilePicture history items`
    );

    // 2. 尝试删除关联的资产文件
    for (const historyItem of historyRecords) {
      const assetId = extractAssetIdFromHistoryItem(historyItem);
      if (assetId) {
        console.log(`🗑️ Deleting associated ProfilePicture asset: ${assetId}`);
        const assetDeletionResult = await deleteAsset(assetId, session.user.id);
        if (!assetDeletionResult.success) {
          console.warn(
            `⚠️ Failed to delete ProfilePicture asset ${assetId}:`,
            assetDeletionResult.error
          );
          // 继续删除历史记录，即使资产删除失败
        }
      }
    }

    // 3. 删除所有历史记录
    const deleted = await db
      .delete(profilePictureHistory)
      .where(eq(profilePictureHistory.userId, session.user.id))
      .returning();

    console.log(
      `✅ ProfilePicture batch delete completed: ${deleted.length} items deleted`
    );
    return NextResponse.json({
      success: true,
      deleted: deleted.length,
    });
  } catch (error) {
    console.error('Error batch deleting profile picture history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
