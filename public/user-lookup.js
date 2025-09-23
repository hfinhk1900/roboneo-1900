/**
 * 用户查找工具
 * 用于快速查找邮箱和用户ID的对应关系
 */

// 根据邮箱查找用户ID
async function findUserByEmail(email) {
  console.log(`🔍 正在查找邮箱: ${email}`);
  
  try {
    const response = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'findUserByEmail', 
        email: email 
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.found) {
      console.log('✅ 找到用户:');
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   邮箱: ${data.user.email}`);
      console.log(`   姓名: ${data.user.name}`);
      console.log(`   角色: ${data.user.role}`);
      console.log(`   注册时间: ${data.user.createdAt}`);
      console.log(`   订阅状态: ${data.subscriptionSummary.hasActiveSubscription ? '有活跃订阅' : '无活跃订阅'}`);
      console.log(`   支付记录数: ${data.subscriptionSummary.totalPayments}`);
      
      // 返回用户ID以便后续使用
      return data.user.id;
    } else {
      console.log(`❌ 未找到邮箱为 ${email} 的用户`);
      return null;
    }
  } catch (error) {
    console.error('❌ 查找出错:', error);
    return null;
  }
}

// 搜索用户（支持邮箱、姓名、用户ID）
async function searchUsers(searchTerm) {
  console.log(`🔍 正在搜索: ${searchTerm}`);
  
  try {
    const response = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'searchUsers', 
        searchTerm: searchTerm 
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ 找到 ${data.totalFound} 个用户:`);
      
      data.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   用户ID: ${user.id}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   注册时间: ${user.createdAt}`);
        console.log(`   订阅状态: ${user.subscriptionSummary.hasActiveSubscription ? '有活跃订阅' : '无活跃订阅'}`);
        console.log(`   支付记录数: ${user.subscriptionSummary.totalPayments}`);
        if (user.subscriptionSummary.latestSubscriptionId) {
          console.log(`   最新订阅ID: ${user.subscriptionSummary.latestSubscriptionId}`);
        }
        console.log('---');
      });
      
      return data.users;
    } else {
      console.log(`❌ 搜索失败:`, data);
      return [];
    }
  } catch (error) {
    console.error('❌ 搜索出错:', error);
    return [];
  }
}

// 快速诊断用户订阅状态
async function quickDiagnose(emailOrId) {
  console.log(`🚀 开始快速诊断: ${emailOrId}`);
  
  let userId = emailOrId;
  
  // 如果输入的是邮箱格式，先查找用户ID
  if (emailOrId.includes('@')) {
    console.log('检测到邮箱格式，先查找用户ID...');
    userId = await findUserByEmail(emailOrId);
    if (!userId) {
      console.log('❌ 无法找到用户，诊断终止');
      return;
    }
  }
  
  console.log(`\n📋 诊断用户ID: ${userId}`);
  
  try {
    // 获取活跃订阅
    const activeSubResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userId, 
        action: 'getActiveSubscription' 
      })
    });
    
    if (activeSubResponse.ok) {
      const activeSubData = await activeSubResponse.json();
      console.log('\n✅ 活跃订阅状态:');
      console.log('   有活跃订阅:', activeSubData.hasActiveSubscription);
      if (activeSubData.subscriptionDetails) {
        console.log('   订阅详情:', activeSubData.subscriptionDetails);
      }
    }
    
    // 获取所有支付记录
    const paymentsResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userId, 
        action: 'getAllPayments' 
      })
    });
    
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log(`\n📊 支付记录 (共${paymentsData.totalRecords}条):`);
      paymentsData.payments.forEach((payment, index) => {
        console.log(`${index + 1}. 状态: ${payment.status} | 类型: ${payment.type} | 创建: ${payment.createdAt}`);
        if (payment.subscriptionId) {
          console.log(`   订阅ID: ${payment.subscriptionId}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ 诊断出错:', error);
  }
}

// 批量查找邮箱对应的用户ID
async function batchFindUsers(emails) {
  console.log(`🔄 批量查找 ${emails.length} 个邮箱的用户ID...`);
  
  const results = [];
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`\n${i + 1}/${emails.length} 查找: ${email}`);
    
    const userId = await findUserByEmail(email);
    results.push({
      email: email,
      userId: userId,
      found: !!userId
    });
    
    // 避免请求过快
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n📋 批量查找结果汇总:');
  console.table(results);
  
  return results;
}

// 使用说明
console.log(`
🔧 用户查找工具已加载

可用函数:
1. findUserByEmail('user@example.com') - 根据邮箱查找用户ID
2. searchUsers('搜索词') - 搜索用户（支持邮箱、姓名、ID部分匹配）
3. quickDiagnose('user@example.com') - 快速诊断用户订阅状态
4. batchFindUsers(['email1@example.com', 'email2@example.com']) - 批量查找

示例:
findUserByEmail('user@example.com');
searchUsers('john');
quickDiagnose('user@example.com');
`);

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    findUserByEmail, 
    searchUsers, 
    quickDiagnose, 
    batchFindUsers 
  };
}
