// 测试 AI Background 历史记录 API
console.log('🧪 测试 AI Background 历史记录 API...\n');

// 测试 GET 请求
async function testGetHistory() {
  console.log('📥 测试获取历史记录...');
  try {
    const response = await fetch('/api/history/aibg', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET 成功:', data);
      console.log(`📊 历史记录数量: ${data.items?.length || 0}`);
    } else {
      console.log('❌ GET 失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ GET 请求错误:', error);
  }
}

// 测试 POST 请求
async function testCreateHistory() {
  console.log('\n📤 测试创建历史记录...');
  try {
    const testItem = {
      url: 'https://example.com/test-image.png',
      mode: 'background',
      style: 'marble-stone',
    };

    const response = await fetch('/api/history/aibg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testItem),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ POST 成功:', data);
      return data.id; // 返回创建的记录ID用于删除测试
    }
    console.log('❌ POST 失败:', response.status, response.statusText);
    const errorData = await response.text();
    console.log('错误详情:', errorData);
  } catch (error) {
    console.error('❌ POST 请求错误:', error);
  }
  return null;
}

// 测试 DELETE 请求
async function testDeleteHistory(id) {
  if (!id) {
    console.log('\n⏭️  跳过删除测试（没有有效的记录ID）');
    return;
  }

  console.log(`\n🗑️  测试删除历史记录 (ID: ${id})...`);
  try {
    const response = await fetch(`/api/history/aibg/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      console.log('✅ DELETE 成功');
    } else {
      console.log('❌ DELETE 失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ DELETE 请求错误:', error);
  }
}

// 运行测试
async function runTests() {
  await testGetHistory();
  const createdId = await testCreateHistory();
  await testDeleteHistory(createdId);

  console.log('\n🎉 测试完成！');
}

// 执行测试
runTests();
