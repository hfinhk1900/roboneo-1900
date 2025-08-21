// 在浏览器Console中运行此代码来获取session token
// 1. 访问 http://localhost:3000 并登录
// 2. 打开Dev Tools (F12)
// 3. 点击 Console 标签
// 4. 粘贴并运行下面的代码

function getSessionToken() {
  // 获取所有cookies
  const cookies = document.cookie.split(';');

  // 查找session token
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'better-auth.session_token') {
      console.log('✅ Session Token Found!');
      console.log('🔑 Token:', value);
      console.log('📋 Copy this token for testing:');
      console.log(
        '%c' + value,
        'background: #f0f0f0; padding: 5px; border-radius: 3px; font-family: monospace;'
      );

      // 尝试复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            console.log('✅ Token copied to clipboard!');
          })
          .catch(() => {
            console.log('⚠️ Could not copy to clipboard, please copy manually');
          });
      }

      return value;
    }
  }

  console.log('❌ Session token not found');
  console.log('🔄 Please make sure you are logged in');
  console.log('📋 Available cookies:', document.cookie);
  return null;
}

// 运行函数
getSessionToken();
