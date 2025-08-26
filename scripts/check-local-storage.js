// 检查浏览器本地存储中的重复 ProductShot 记录
// 这个脚本需要在浏览器控制台中运行

function checkLocalStorageDuplicates() {
  console.log('🔍 检查本地存储中的重复 ProductShot 记录...\n');

  try {
    // 检查 ProductShot 历史记录
    const productshotHistoryKey = 'productshot_history';
    const rawHistory = localStorage.getItem(productshotHistoryKey);

    if (!rawHistory) {
      console.log('📭 本地存储中没有 ProductShot 历史记录');
      return;
    }

    const history = JSON.parse(rawHistory);
    console.log(`📊 本地存储中有 ${history.length} 条 ProductShot 记录`);

    // 按场景分组
    const sceneGroups = {};
    history.forEach(record => {
      if (!sceneGroups[record.scene]) {
        sceneGroups[record.scene] = [];
      }
      sceneGroups[record.scene].push(record);
    });

    let totalDuplicates = 0;

    // 检查每个场景的重复记录
    Object.entries(sceneGroups).forEach(([scene, records]) => {
      if (records.length > 1) {
        console.log(`\n📸 场景 "${scene}": ${records.length} 条记录`);

        // 按时间排序
        records.sort((a, b) => b.createdAt - a.createdAt);

        // 显示重复记录
        records.forEach((record, index) => {
          const date = new Date(record.createdAt).toLocaleString();
          console.log(`  ${index + 1}. ${record.url.substring(0, 50)}... - ${date}`);
        });

        totalDuplicates += records.length - 1;
      }
    });

    if (totalDuplicates > 0) {
      console.log(`\n⚠️  发现 ${totalDuplicates} 条重复记录`);
      console.log('💡 建议清理重复记录以节省存储空间');

      // 提供清理函数
      window.cleanupProductshotHistory = function() {
        const cleanedHistory = [];
        Object.entries(sceneGroups).forEach(([scene, records]) => {
          if (records.length > 1) {
            // 保留最新的记录
            records.sort((a, b) => b.createdAt - a.createdAt);
            cleanedHistory.push(records[0]);
          } else {
            cleanedHistory.push(records[0]);
          }
        });

        localStorage.setItem(productshotHistoryKey, JSON.stringify(cleanedHistory));
        console.log(`✅ 清理完成！保留 ${cleanedHistory.length} 条记录`);
        location.reload(); // 刷新页面以更新显示
      };

      console.log('🔧 运行 cleanupProductshotHistory() 来清理重复记录');
    } else {
      console.log('\n✅ 没有发现重复记录');
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

// 运行检查
checkLocalStorageDuplicates();
