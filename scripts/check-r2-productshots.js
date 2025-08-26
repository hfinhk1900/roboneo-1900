// 检查 R2 中的 ProductShot 文件
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function checkR2Productshots() {
  console.log('🔍 检查 R2 中的 ProductShot 文件...\n');

  try {
    // 初始化 S3 客户端（用于 R2）
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // 列出 productshots 文件夹中的所有文件
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'productshots/',
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      console.log(`📊 R2 中总共有 ${response.Contents.length} 个 ProductShot 文件`);

      // 按文件大小分组
      const sizeGroups = {};
      let totalSize = 0;

      response.Contents.forEach(obj => {
        const sizeInMB = Math.round(obj.Size / (1024 * 1024) * 100) / 100;
        totalSize += obj.Size;

        if (!sizeGroups[sizeInMB]) {
          sizeGroups[sizeInMB] = [];
        }
        sizeGroups[sizeInMB].push(obj.Key);
      });

      console.log(`💾 总存储大小: ${Math.round(totalSize / (1024 * 1024) * 100) / 100} MB`);

      console.log('\n📁 文件大小分布:');
      Object.entries(sizeGroups).forEach(([size, files]) => {
        console.log(`  ${size} MB: ${files.length} 个文件`);
      });

      // 显示最近的文件
      const recentFiles = response.Contents
        .sort((a, b) => b.LastModified - a.LastModified)
        .slice(0, 10);

      console.log('\n🕒 最近 10 个文件:');
      recentFiles.forEach((file, index) => {
        const date = new Date(file.LastModified).toLocaleString();
        const sizeInMB = Math.round(file.Size / (1024 * 1024) * 100) / 100;
        console.log(`  ${index + 1}. ${file.Key} (${sizeInMB} MB) - ${date}`);
      });

    } else {
      console.log('📭 R2 中没有找到 ProductShot 文件');
    }

  } catch (error) {
    console.error('❌ 检查 R2 时发生错误:', error);
  }
}

// 运行检查
checkR2Productshots();
