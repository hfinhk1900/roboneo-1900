import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { aibgHistory } from '../src/db/schema';

type AibgRow = typeof aibgHistory.$inferSelect;

async function cleanupDuplicateAibg() {
  console.log('🧹 开始清理重复的 AI Background 历史记录...\n');

  try {
    const db = await getDb();

    // 获取所有历史记录
    const allHistory = await db.select().from(aibgHistory);
    console.log(`📊 总共有 ${allHistory.length} 条历史记录`);

    // 按用户分组
    const userGroups: Record<string, AibgRow[]> = {};
    allHistory.forEach((record: AibgRow) => {
      if (!userGroups[record.userId]) {
        userGroups[record.userId] = [];
      }
      userGroups[record.userId].push(record);
    });

    let totalDeleted = 0;

    // 处理每个用户的历史记录
    for (const [userId, records] of Object.entries(userGroups)) {
      console.log(`\n👤 用户 ${userId}: ${records.length} 条记录`);

      // 按模式和样式分组
      const modeStyleGroups: Record<string, AibgRow[]> = {};
      (records as AibgRow[]).forEach((record) => {
        const key = `${record.mode}-${record.style}`;
        if (!modeStyleGroups[key]) {
          modeStyleGroups[key] = [];
        }
        modeStyleGroups[key].push(record);
      });

      // 处理每个模式-样式组合的记录
      for (const [key, styleRecords] of Object.entries(modeStyleGroups)) {
        if (styleRecords.length > 1) {
          const [mode, style] = key.split('-');
          console.log(
            `  🎨 模式 "${mode}" 样式 "${style}": ${styleRecords.length} 条记录`
          );

          // 按创建时间排序，保留最新的（使用 getTime 避免 TS 算术类型报错）
          styleRecords.sort((a, b) => {
            const bt = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
            const at = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
            return at - bt;
          });

          // 删除除最新一条外的所有记录
          const toDelete = styleRecords.slice(1);
          console.log(`    🗑️  删除 ${toDelete.length} 条重复记录`);

          for (const record of toDelete) {
            await db.delete(aibgHistory).where(eq(aibgHistory.id, record.id));
            totalDeleted++;
          }
        }
      }
    }

    console.log(`\n✅ 清理完成！总共删除了 ${totalDeleted} 条重复记录`);

    // 显示清理后的统计
    const remainingHistory = await db.select().from(aibgHistory);
    console.log(`📊 清理后剩余 ${remainingHistory.length} 条记录`);
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
  }
}

// 运行清理
cleanupDuplicateAibg()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('清理失败:', error);
    process.exit(1);
  });
