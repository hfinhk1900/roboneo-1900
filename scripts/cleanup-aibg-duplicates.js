// 完整的 AI Background 重复记录清理脚本
// 在浏览器控制台中运行此代码

(() => {
  console.log('🧹 开始清理 AI Background 重复记录...\n');

  try {
    // 检查 AI Background 历史记录（使用正确的键名）
    const aibgHistoryKey = 'roboneo_aibg_history_v1';
    const rawHistory = localStorage.getItem(aibgHistoryKey);

    if (!rawHistory) {
      console.log('📭 本地存储中没有 AI Background 历史记录');
      return;
    }

    const history = JSON.parse(rawHistory);
    console.log(`📊 本地存储中有 ${history.length} 条 AI Background 记录`);

    // 按模式和样式分组
    const modeStyleGroups = {};
    history.forEach((record) => {
      const key = `${record.mode}-${record.style}`;
      if (!modeStyleGroups[key]) {
        modeStyleGroups[key] = [];
      }
      modeStyleGroups[key].push(record);
    });

    let totalDuplicates = 0;
    let totalRecords = 0;

    // 检查每个模式-样式组合的重复记录
    Object.entries(modeStyleGroups).forEach(([key, records]) => {
      totalRecords += records.length;
      const [mode, style] = key.split('-');

      if (records.length > 1) {
        console.log(
          `\n🎨 模式 "${mode}" 样式 "${style}": ${records.length} 条记录`
        );

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
        console.log(
          `\n🎨 模式 "${mode}" 样式 "${style}": ${records.length} 条记录 (无重复)`
        );
      }
    });

    if (totalDuplicates > 0) {
      console.log(`\n⚠️  发现 ${totalDuplicates} 条重复记录`);
      console.log('🧹 开始清理重复记录...');

      // 清理重复记录
      const cleanedHistory = [];
      Object.entries(modeStyleGroups).forEach(([key, records]) => {
        if (records.length > 1) {
          // 保留最新的记录
          records.sort((a, b) => b.createdAt - a.createdAt);
          cleanedHistory.push(records[0]);
          const [mode, style] = key.split('-');
          console.log(
            `  ✅ 模式 "${mode}" 样式 "${style}": 保留最新记录，删除 ${records.length - 1} 条重复`
          );
        } else {
          cleanedHistory.push(records[0]);
        }
      });

      // 保存清理后的记录
      localStorage.setItem(aibgHistoryKey, JSON.stringify(cleanedHistory));

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
    console.log('   localStorage.removeItem("roboneo_aibg_history_v1");');
    console.log('   location.reload();');
  }
})();
