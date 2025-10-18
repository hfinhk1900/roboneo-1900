require('dotenv').config({ path: '.env.local' });
const {
  S3Client,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.STORAGE_BUCKET_NAME;

// 功能1：列出所有ProductShot文件
async function listProductShotFiles() {
  console.log('📁 Current ProductShot files in R2:\n');

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'productshots/',
      MaxKeys: 50,
    });

    const response = await s3Client.send(listCommand);

    if (response.Contents && response.Contents.length > 0) {
      response.Contents.forEach((obj, index) => {
        const fileName = obj.Key.replace('productshots/', '');
        const fileSize = (obj.Size / 1024 / 1024).toFixed(2);
        const date = obj.LastModified.toLocaleString();
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${fileName}`);
        console.log(`    Size: ${fileSize} MB | Created: ${date}\n`);
      });

      console.log(`Total: ${response.Contents.length} files\n`);
      return response.Contents;
    }
    console.log('No ProductShot files found in R2\n');
    return [];
  } catch (error) {
    console.error('❌ Error listing files:', error.message);
    return [];
  }
}

// 功能2：检查特定文件是否存在
async function checkFileExists(fileName) {
  const key = `productshots/${fileName}`;

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(headCommand);
    console.log(`✅ File exists: ${fileName}`);
    console.log(
      `   Size: ${(response.ContentLength / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`   Type: ${response.ContentType}`);
    console.log(`   Modified: ${response.LastModified.toLocaleString()}\n`);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`❌ File NOT found: ${fileName}\n`);
      return false;
    }
    console.error(`❌ Error checking file: ${error.message}\n`);
    return false;
  }
}

// 功能3：生成删除测试指令
function generateTestInstructions(files) {
  console.log('🧪 MANUAL DELETION TEST INSTRUCTIONS:\n');

  if (files.length === 0) {
    console.log('⚠️  No files available for testing');
    console.log('💡 Please generate some ProductShot images first\n');
    return;
  }

  const testFile = files[0]; // 选择第一个文件进行测试
  const fileName = testFile.Key.replace('productshots/', '');

  console.log('📋 Follow these steps to test R2 sync deletion:\n');
  console.log('1. 🌐 Open your application in browser');
  console.log('2. 🔐 Log in to your account');
  console.log('3. 📸 Go to ProductShot feature page');
  console.log('4. 📜 Check your ProductShot history');
  console.log(`5. 🎯 Look for an image that corresponds to: ${fileName}`);
  console.log('6. 🗑️  Delete that image from the history');
  console.log('7. ⏳ Wait 5 seconds');
  console.log(`8. 🔍 Run: node test-productshot-r2-sync.js check ${fileName}`);
  console.log('9. ✅ If file is gone from R2, the sync deletion is working!\n');

  console.log('📝 Alternative quick test:');
  console.log(
    `   Before deletion: node test-productshot-r2-sync.js check ${fileName}`
  );
  console.log(
    `   After deletion:  node test-productshot-r2-sync.js check ${fileName}`
  );
  console.log('\n');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const fileName = args[1];

  console.log('🧪 ProductShot R2 Sync Deletion Tester\n');

  switch (command) {
    case 'list':
      await listProductShotFiles();
      break;

    case 'check':
      if (!fileName) {
        console.log('❌ Please provide a file name');
        console.log(
          'Usage: node test-productshot-r2-sync.js check <filename>\n'
        );
        return;
      }
      await checkFileExists(fileName);
      break;

    case 'test': {
      const files = await listProductShotFiles();
      generateTestInstructions(files);
      break;
    }

    default: {
      console.log('📖 USAGE:\n');
      console.log('List all files:     node test-productshot-r2-sync.js list');
      console.log(
        'Check specific file: node test-productshot-r2-sync.js check <filename>'
      );
      console.log('Generate test plan:  node test-productshot-r2-sync.js test');
      console.log('\nExample:');
      console.log(
        'node test-productshot-r2-sync.js check 05e632a6-b3e3-4c93-96bb-88c3f32482e3.png\n'
      );

      // 默认显示列表和测试指令
      const allFiles = await listProductShotFiles();
      generateTestInstructions(allFiles);
      break;
    }
  }
}

main().catch(console.error);
