const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function getSessionCookie() {
  // 优先使用环境变量传入的 session token
  if (process.env.SESSION_TOKEN) {
    return `better-auth.session_token=${process.env.SESSION_TOKEN}`;
  }

  // fallback：尝试从 /api/auth/session 获取（需要本地已有登录状态）
  try {
    const resp = await fetch('http://localhost:3000/api/auth/session');
    const setCookie = resp.headers.get('set-cookie');
    if (setCookie) return setCookie;
  } catch {}
  return '';
}

async function testProductShotCredits() {
  console.log('🧪 Testing ProductShot Credits System...\n');

  try {
    // 1) 读取测试图片
    const imagePath = 'public/productshots/productshot44.png';
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Test image not found: ${imagePath}`);
      return;
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // 2) 获取会话 Cookie
    const cookie = await getSessionCookie();
    if (!cookie) {
      console.log('❌ No session cookie found. Please login and set SESSION_TOKEN env var.');
      console.log('提示：在浏览器登录后，运行 get-session-token.js 拿到 token，然后执行：');
      console.log('SESSION_TOKEN=<paste_token_here> node test-productshot-credits.js');
      return;
    }

    // 3) 发送生成请求（场景2：lifestyle-casual）
    const scene = process.env.SCENE || 'lifestyle-casual';
    console.log(`➡️  Scene: ${scene}`);

    const response = await fetch('http://localhost:3000/api/productshot/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
      body: JSON.stringify({
        sceneType: scene,
        image_input: base64Image,
        productTypeHint: 'small',
        additionalContext: 'small perfume bottle',
        quality: 'standard'
      }),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (response.status === 402) {
      console.log(`💳 Insufficient credits. Required: ${result.required}, Current: ${result.current}`);
    } else if (response.ok) {
      console.log(`✅ Success. Credits used: ${result.credits_used}. Remaining: ${result.remaining_credits}`);
      console.log(`🖼️ URL: ${result.resultUrl}`);
    } else {
      console.log('❌ Failed:', result.error || 'Unknown error');
    }
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testProductShotCredits();
