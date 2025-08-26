import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { productshotHistory } from '../src/db/schema';

async function cleanupDuplicateProductshots() {
  console.log('🧹 开始清理重复的 ProductShot 历史记录...\n');

  try {
    const db = await getDb();

    // 获取所有历史记录
    const allHistory = await db.select().from(productshotHistory);
    console.log(`📊 总共有 ${allHistory.length} 条历史记录`);

    // 按用户分组
    const userGroups = {};
    allHistory.forEach(record => {
      if (!userGroups[record.userId]) {
        userGroups[record.userId] = [];
      }
      userGroups[record.userId].push(record);
    });

    let totalDeleted = 0;

    // 处理每个用户的历史记录
    for (const [userId, records] of Object.entries(userGroups)) {
      console.log(`\n👤 用户 ${userId}: ${records.length} 条记录`);

      // 按场景分组
      const sceneGroups = {};
      records.forEach(record => {
        if (!sceneGroups[record.scene]) {
          sceneGroups[record.scene] = [];
        }
        sceneGroups[record.scene].push(record);
      });

      // 处理每个场景的记录
      for (const [scene, sceneRecords] of Object.entries(sceneGroups)) {
        if (sceneRecords.length > 1) {
          console.log(`  📸 场景 "${scene}": ${sceneRecords.length} 条记录`);

          // 按创建时间排序，保留最新的
          sceneRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // 删除除最新一条外的所有记录
          const toDelete = sceneRecords.slice(1);
          console.log(`    🗑️  删除 ${toDelete.length} 条重复记录`);

          for (const record of toDelete) {
            await db.delete(productshotHistory)
              .where(eq(productshotHistory.id, record.id));
            totalDeleted++;
          }
        }
      }
    }

    console.log(`\n✅ 清理完成！总共删除了 ${totalDeleted} 条重复记录`);

    // 显示清理后的统计
    const remainingHistory = await db.select().from(productshotHistory);
    console.log(`📊 清理后剩余 ${remainingHistory.length} 条记录`);

  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
  }
}

// 运行清理
cleanupDuplicateProductshots().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('清理失败:', error);
  process.exit(1);
});
