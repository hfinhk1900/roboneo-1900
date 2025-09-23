// 在浏览器控制台运行此脚本，将指定邮箱用户设为管理员
// 使用方法：在浏览器控制台粘贴并运行

async function makeUserAdmin(email) {
  try {
    console.log(`🔄 正在将用户 ${email} 设置为管理员...`);

    const response = await fetch('/api/debug/make-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 成功设置管理员:', result);
      console.log('🔄 正在刷新页面...');
      window.location.reload();
    } else {
      const error = await response.json();
      console.error('❌ 设置失败:', error);
    }
  } catch (error) {
    console.error('❌ 请求错误:', error);
  }
}

// 使用示例 (替换为你的邮箱):
// makeUserAdmin('your-email@example.com');

console.log('📝 使用方法: makeUserAdmin("your-email@example.com")');
