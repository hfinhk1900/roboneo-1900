// 完整的 ProductShot 重复记录清理脚本
// 在浏览器控制台中运行此代码

(() => {
  console.log('🧹 开始清理 ProductShot 重复记录...\n');

  try {
    // 检查 ProductShot 历史记录（使用正确的键名）
    const productshotHistoryKey = 'roboneo_productshot_history_v1';
    const rawHistory = localStorage.getItem(productshotHistoryKey);

    if (!rawHistory) {
      console.log('📭 本地存储中没有 ProductShot 历史记录');
      return;
    }

    const history = JSON.parse(rawHistory);
    console.log(`📊 本地存储中有 ${history.length} 条 ProductShot 记录`);

    // 按场景分组
    const sceneGroups = {};
    history.forEach((record) => {
      if (!sceneGroups[record.scene]) {
        sceneGroups[record.scene] = [];
      }
      sceneGroups[record.scene].push(record);
    });

    let totalDuplicates = 0;
    let totalRecords = 0;

    // 检查每个场景的重复记录
    Object.entries(sceneGroups).forEach(([scene, records]) => {
      totalRecords += records.length;

      if (records.length > 1) {
        console.log(`\n📸 场景 "${scene}": ${records.length} 条记录`);

        // 按时间排序
        records.sort((a, b) => b.createdAt - a.createdAt);

        // 显示重复记录
        records.forEach((record, index) => {
          const date = new Date(record.createdAt).toLocaleString();
          const urlPreview = record.url.substring(0, 50) + '...';
          console.log(`  ${index + 1}. ${urlPreview} - ${date}`);
        });

        totalDuplicates += records.length - 1;
      } else {
        console.log(`\n📸 场景 "${scene}": ${records.length} 条记录 (无重复)`);
      }
    });

    if (totalDuplicates > 0) {
      console.log(`\n⚠️  发现 ${totalDuplicates} 条重复记录`);
      console.log('🧹 开始清理重复记录...');

      // 清理重复记录
      const cleanedHistory = [];
      Object.entries(sceneGroups).forEach(([scene, records]) => {
        if (records.length > 1) {
          // 保留最新的记录
          records.sort((a, b) => b.createdAt - a.createdAt);
          cleanedHistory.push(records[0]);
          console.log(
            `  ✅ 场景 "${scene}": 保留最新记录，删除 ${records.length - 1} 条重复`
          );
        } else {
          cleanedHistory.push(records[0]);
        }
      });

      // 保存清理后的记录
      localStorage.setItem(
        productshotHistoryKey,
        JSON.stringify(cleanedHistory)
      );

      console.log(`\n🎉 清理完成！`);
      console.log(`📊 清理前: ${totalRecords} 条记录`);
      console.log(`📊 清理后: ${cleanedHistory.length} 条记录`);
      console.log(`🗑️  删除了: ${totalDuplicates} 条重复记录`);
      console.log(
        `💾 节省了: ${Math.round(totalDuplicates * 0.1 * 100) / 100} KB 存储空间`
      );

      console.log('\n🔄 页面将在 3 秒后自动刷新...');

      setTimeout(() => {
        location.reload();
      }, 3000);
    } else {
      console.log('\n✅ 没有发现重复记录，无需清理');
    }
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
    console.log('💡 如果遇到错误，可以尝试手动清除：');
    console.log(
      '   localStorage.removeItem("roboneo_productshot_history_v1");'
    );
    console.log('   location.reload();');
  }
})();
