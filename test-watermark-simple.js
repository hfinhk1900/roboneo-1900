/**
 * 简化版水印去除测试脚本
 * 使用 curl 命令进行快速测试
 */

const fs = require('fs');
const { execSync } = require('child_process');

// 配置
const TEST_IMAGE = './public/remove-watermark/watermark0proof.jpg';
const API_URL = 'http://localhost:3000/api/watermark/remove';

function log(message, emoji = '📝') {
  console.log(`${emoji} ${message}`);
}

function checkImage() {
  if (!fs.existsSync(TEST_IMAGE)) {
    log(`测试图片不存在: ${TEST_IMAGE}`, '❌');
    process.exit(1);
  }
  
  const stats = fs.statSync(TEST_IMAGE);
  log(`找到测试图片: ${(stats.size / 1024).toFixed(1)}KB`, '✅');
}

function imageToBase64() {
  log('转换图片为 base64...', '🔄');
  const imageBuffer = fs.readFileSync(TEST_IMAGE);
  return imageBuffer.toString('base64');
}

async function testAPI() {
  checkImage();
  const base64 = imageToBase64();
  
  log('准备测试数据...', '⚡');
  
  const testData = {
    image_input: base64,
    quality: 'standard',
    steps: 20,
    output_format: 'png'
  };
  
  // 保存测试数据到临时文件
  const tempFile = './temp-test-data.json';
  fs.writeFileSync(tempFile, JSON.stringify(testData));
  
  log('发送 API 请求...', '🚀');
  
  try {
    const curlCommand = `curl -X POST "${API_URL}" \\
      -H "Content-Type: application/json" \\
      -d @${tempFile} \\
      -w "HTTP_STATUS:%{http_code}\\nTIME:%{time_total}s\\n" \\
      -s`;
    
    const result = execSync(curlCommand, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
    
    // 清理临时文件
    fs.unlinkSync(tempFile);
    
    // 解析结果
    const lines = result.split('\n');
    const statusLine = lines.find(line => line.startsWith('HTTP_STATUS:'));
    const timeLine = lines.find(line => line.startsWith('TIME:'));
    
    const status = statusLine ? statusLine.split(':')[1] : 'unknown';
    const time = timeLine ? timeLine.split(':')[1] : 'unknown';
    
    // 获取响应体
    const responseBody = lines.filter(line => 
      !line.startsWith('HTTP_STATUS:') && 
      !line.startsWith('TIME:') && 
      line.trim()
    ).join('\n');
    
    log(`响应状态: ${status}`, status === '200' ? '✅' : '❌');
    log(`响应时间: ${time}`, '⏱️');
    
    if (responseBody.trim()) {
      try {
        const response = JSON.parse(responseBody);
        
        if (response.success) {
          log('水印去除成功!', '🎉');
          log(`结果 URL: ${response.public_url}`, '🖼️');
          log(`使用积分: ${response.credits_used}`, '💰');
          log(`剩余积分: ${response.remaining_credits}`, '💳');
        } else {
          log(`处理失败: ${response.error}`, '❌');
        }
      } catch (e) {
        log('无法解析响应 JSON', '⚠️');
        console.log('原始响应:', responseBody);
      }
    }
    
  } catch (error) {
    log(`测试失败: ${error.message}`, '💥');
    
    // 清理临时文件
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// 运行测试
if (require.main === module) {
  log('开始水印去除 API 测试', '🧪');
  testAPI().catch(console.error);
}
