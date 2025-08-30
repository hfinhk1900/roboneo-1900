import { getDb } from '@/db';
import { aibgHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { deleteAsset, extractAssetIdFromHistoryItem } from '@/lib/asset-deletion';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // 1. 先获取历史记录，以便提取资产信息
    const historyRecord = await db
      .select()
      .from(aibgHistory)
      .where(
        and(
          eq(aibgHistory.id, id),
          eq(aibgHistory.userId, session.user.id)
        )
      )
      .limit(1);

    if (historyRecord.length === 0) {
      return NextResponse.json({ error: 'History item not found' }, { status: 404 });
    }

    const historyItem = historyRecord[0];
    
    // 2. 尝试删除关联的资产文件
    const assetId = extractAssetIdFromHistoryItem(historyItem);
    if (assetId) {
      console.log(`🗑️ Deleting associated asset: ${assetId}`);
      const assetDeletionResult = await deleteAsset(assetId, session.user.id);
      if (!assetDeletionResult.success) {
        console.warn(`⚠️ Failed to delete asset ${assetId}:`, assetDeletionResult.error);
        // 继续删除历史记录，即使资产删除失败
      }
    } else {
      console.log('📝 No asset_id found in history item, skipping asset deletion');
    }

    // 3. 删除历史记录
    await db
      .delete(aibgHistory)
      .where(
        and(
          eq(aibgHistory.id, id),
          eq(aibgHistory.userId, session.user.id)
        )
      );

    console.log(`✅ AI Background history item ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting aibg history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
