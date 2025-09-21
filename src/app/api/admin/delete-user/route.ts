import { getDb } from '@/db';
import {
  account,
  aibgHistory,
  ailogHistory,
  assets,
  creditsTransaction,
  payment,
  productshotHistory,
  profilePictureHistory,
  session,
  stickerHistory,
  user,
  watermarkHistory,
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 管理员删除用户账户 - 完全清理所有相关数据
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 2. 获取要删除的用户ID
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // 3. 防止删除管理员账户
    const db = await getDb();
    const targetUserData = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUserData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isAdmin(targetUserData[0])) {
      return NextResponse.json(
        { error: 'Cannot delete admin user' },
        { status: 403 }
      );
    }

    console.log(
      `🗑️ Starting deletion of user: ${targetUserId} (${targetUserData[0].email})`
    );

    // 4. 获取用户的所有资产以删除R2文件
    const userAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.user_id, targetUserId));

    console.log(`📁 Found ${userAssets.length} assets to delete`);

    // 5. 删除R2存储文件
    if (userAssets.length > 0) {
      try {
        const { deleteFile } = await import('@/storage');

        for (const asset of userAssets) {
          try {
            await deleteFile(asset.key);
            console.log(`✅ Deleted R2 file: ${asset.key}`);
          } catch (error) {
            console.warn(`⚠️ Failed to delete R2 file: ${asset.key}`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️ R2 deletion failed:', error);
      }
    }

    // 6. 数据库事务删除 (CASCADE会自动清理相关数据)
    await db.transaction(async (tx) => {
      // 删除用户记录 (CASCADE会自动删除相关表的记录)
      await tx.delete(user).where(eq(user.id, targetUserId));

      console.log(
        `✅ User ${targetUserId} and all related data deleted from database`
      );
    });

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      message: `User ${targetUserData[0].email} completely deleted`,
      deletedData: {
        userId: targetUserId,
        email: targetUserData[0].email,
        assetsDeleted: userAssets.length,
      },
    });
  } catch (error) {
    console.error('❌ User deletion failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 获取用户删除预览信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 获取用户基本信息
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 统计用户数据
    const [
      assetCount,
      aibgCount,
      profileCount,
      stickerCount,
      productshotCount,
      watermarkCount,
      transactionCount,
    ] = await Promise.all([
      db.select().from(assets).where(eq(assets.user_id, targetUserId)),
      db.select().from(aibgHistory).where(eq(aibgHistory.userId, targetUserId)),
      db
        .select()
        .from(profilePictureHistory)
        .where(eq(profilePictureHistory.userId, targetUserId)),
      db
        .select()
        .from(stickerHistory)
        .where(eq(stickerHistory.userId, targetUserId)),
      db
        .select()
        .from(productshotHistory)
        .where(eq(productshotHistory.userId, targetUserId)),
      db
        .select()
        .from(watermarkHistory)
        .where(eq(watermarkHistory.userId, targetUserId)),
      db
        .select()
        .from(creditsTransaction)
        .where(eq(creditsTransaction.user_id, targetUserId)),
    ]);

    return NextResponse.json({
      user: userData[0],
      dataToDelete: {
        assets: assetCount.length,
        aibgHistory: aibgCount.length,
        profilePictureHistory: profileCount.length,
        stickerHistory: stickerCount.length,
        productshotHistory: productshotCount.length,
        watermarkHistory: watermarkCount.length,
        creditsTransactions: transactionCount.length,
        totalRecords:
          assetCount.length +
          aibgCount.length +
          profileCount.length +
          stickerCount.length +
          productshotCount.length +
          watermarkCount.length +
          transactionCount.length,
      },
      isAdmin: isAdmin(userData[0]),
      canDelete: !isAdmin(userData[0]),
    });
  } catch (error) {
    console.error('❌ Failed to get user deletion preview:', error);
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}
