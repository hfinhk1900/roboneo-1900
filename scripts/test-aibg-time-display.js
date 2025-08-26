// 测试 AI Background 历史记录时间显示
console.log('🧪 测试 AI Background 历史记录时间显示...\n');

// 测试时间格式化
function testTimeDisplay() {
  console.log('📅 测试时间格式化...');

  // 测试不同的时间格式
  const testCases = [
    { name: '当前时间戳', value: Date.now() },
    { name: '字符串时间戳', value: '1756178532000' },
    { name: 'ISO 字符串', value: '2025-01-26T10:35:32.000Z' },
    { name: 'Date 对象', value: new Date() },
    { name: '无效值', value: 'invalid' },
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
  ];

  testCases.forEach(({ name, value }) => {
    try {
      let timestamp;
      if (value === null || value === undefined) {
        timestamp = Date.now();
      } else if (typeof value === 'string') {
        if (value === 'invalid') {
          timestamp = Date.now();
        } else {
          timestamp = new Date(value).getTime();
        }
      } else if (value instanceof Date) {
        timestamp = value.getTime();
      } else {
        timestamp = value;
      }

      const dateString = new Date(timestamp).toLocaleDateString();
      console.log(`✅ ${name}: ${dateString} (${timestamp})`);
    } catch (error) {
      console.log(`❌ ${name}: 错误 - ${error.message}`);
    }
  });
}

// 测试本地存储中的时间
function testLocalStorageTime() {
  console.log('\n💾 测试本地存储中的时间...');

  try {
    const aibgHistoryKey = 'roboneo_aibg_history_v1';
    const raw = localStorage.getItem(aibgHistoryKey);

    if (raw) {
      const history = JSON.parse(raw);
      console.log(`📊 找到 ${history.length} 条历史记录`);

      history.forEach((item, index) => {
        const dateString = new Date(item.createdAt).toLocaleDateString();
        console.log(`  ${index + 1}. ${item.mode} - ${item.style}: ${dateString} (${item.createdAt})`);
      });
    } else {
      console.log('📭 本地存储中没有历史记录');
    }
  } catch (error) {
    console.error('❌ 读取本地存储失败:', error);
  }
}

// 测试服务器时间格式
async function testServerTime() {
  console.log('\n🌐 测试服务器时间格式...');

  try {
    const response = await fetch('/api/history/aibg', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 服务器返回 ${data.items?.length || 0} 条记录`);

      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          console.log(`  ${index + 1}. createdAt 字段:`, item.createdAt);
          console.log(`     类型: ${typeof item.createdAt}`);
          console.log(`     值: ${item.createdAt}`);

          try {
            const timestamp = typeof item.createdAt === 'string'
              ? new Date(item.createdAt).getTime()
              : item.createdAt;
            const dateString = new Date(timestamp).toLocaleDateString();
            console.log(`     格式化后: ${dateString}`);
          } catch (error) {
            console.log(`     ❌ 格式化失败: ${error.message}`);
          }
        });
      }
    } else {
      console.log('❌ 服务器请求失败:', response.status);
    }
  } catch (error) {
    console.error('❌ 服务器请求错误:', error);
  }
}

// 运行所有测试
async function runAllTests() {
  testTimeDisplay();
  testLocalStorageTime();
  await testServerTime();

  console.log('\n🎉 时间显示测试完成！');
}

// 执行测试
runAllTests();
