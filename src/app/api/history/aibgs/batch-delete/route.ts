import { getDb } from '@/db';
import { aibgHistory } from '@/db/schema';
import {
  deleteAssets,
  extractAssetIdFromHistoryItem,
} from '@/lib/asset-deletion';
import { auth } from '@/lib/auth';
import { and, eq, inArray } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty ids array' },
        { status: 400 }
      );
    }

    console.log(
      `🗑️ Batch deleting ${ids.length} AI Background history items...`
    );

    const db = await getDb();

    // 1. 先获取所有历史记录，以便提取资产信息
    const historyRecords = await db
      .select()
      .from(aibgHistory)
      .where(
        and(
          inArray(aibgHistory.id, ids),
          eq(aibgHistory.userId, session.user.id)
        )
      );

    if (historyRecords.length === 0) {
      return NextResponse.json(
        { error: 'No history items found' },
        { status: 404 }
      );
    }

    // 2. 提取资产ID
    const assetIds = historyRecords
      .map((item) => extractAssetIdFromHistoryItem(item))
      .filter((id): id is string => id !== null);

    console.log(
      `📂 Found ${assetIds.length} assets to delete from ${historyRecords.length} history items`
    );

    // 3. 批量删除资产文件
    let assetDeletionResult = null;
    if (assetIds.length > 0) {
      assetDeletionResult = await deleteAssets(assetIds, session.user.id);
      console.log('📊 Asset deletion summary:', assetDeletionResult.summary);
    }

    // 4. 删除历史记录（只删除找到的记录）
    const foundIds = historyRecords.map((record) => record.id);
    await db
      .delete(aibgHistory)
      .where(
        and(
          inArray(aibgHistory.id, foundIds),
          eq(aibgHistory.userId, session.user.id)
        )
      );

    console.log(
      `✅ Batch deletion completed: ${foundIds.length} history items deleted`
    );

    return NextResponse.json({
      success: true,
      deleted_count: foundIds.length,
      requested_count: ids.length,
      asset_deletion_summary: assetDeletionResult?.summary || {
        total: 0,
        successful: 0,
        failed: 0,
      },
    });
  } catch (error) {
    console.error('Error batch deleting aibg history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
