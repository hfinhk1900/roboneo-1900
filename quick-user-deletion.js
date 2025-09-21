/**
 * 🗑️ 快速用户删除工具
 *
 * 使用说明：
 * 1. 在浏览器控制台运行此脚本
 * 2. 确保以管理员身份登录
 * 3. 调用 deleteUserByEmail('user@example.com') 删除用户
 */

class UserDeletionTool {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * 通过邮箱删除用户
   */
  async deleteUserByEmail(email) {
    try {
      console.log(`🔍 正在查找用户: ${email}`);

      // 1. 查找用户ID
      const findResponse = await fetch(
        `${this.baseUrl}/api/admin/find-user?email=${encodeURIComponent(email)}`,
        {
          credentials: 'include',
        }
      );

      if (!findResponse.ok) {
        const error = await findResponse.json();
        console.error(`❌ 查找用户失败:`, error.error);
        return false;
      }

      const { userId, user } = await findResponse.json();
      console.log(`✅ 找到用户: ${user.name} (${user.email})`);

      // 2. 获取删除预览
      console.log(`📊 获取删除预览信息...`);
      const previewResponse = await fetch(
        `${this.baseUrl}/api/admin/delete-user?userId=${userId}`,
        {
          credentials: 'include',
        }
      );

      if (!previewResponse.ok) {
        const error = await previewResponse.json();
        console.error(`❌ 获取预览失败:`, error.error);
        return false;
      }

      const preview = await previewResponse.json();

      // 3. 显示删除预览
      console.log(`📋 删除预览:`);
      console.log(`  用户: ${preview.user.name} (${preview.user.email})`);
      console.log(`  积分: ${preview.user.credits}`);
      console.log(`  注册时间: ${preview.user.createdAt}`);
      console.log(`  是否管理员: ${preview.isAdmin ? '是' : '否'}`);
      console.log(`  待删除数据:`);
      console.log(`    - 资产文件: ${preview.dataToDelete.assets} 个`);
      console.log(`    - AI背景历史: ${preview.dataToDelete.aibgHistory} 条`);
      console.log(
        `    - 头像制作历史: ${preview.dataToDelete.profilePictureHistory} 条`
      );
      console.log(
        `    - 贴纸生成历史: ${preview.dataToDelete.stickerHistory} 条`
      );
      console.log(
        `    - 产品拍摄历史: ${preview.dataToDelete.productshotHistory} 条`
      );
      console.log(
        `    - 水印移除历史: ${preview.dataToDelete.watermarkHistory} 条`
      );
      console.log(
        `    - 积分交易记录: ${preview.dataToDelete.creditsTransactions} 条`
      );
      console.log(`    📊 总计: ${preview.dataToDelete.totalRecords} 条记录`);

      if (!preview.canDelete) {
        console.error(`❌ 无法删除此用户 (管理员保护)`);
        return false;
      }

      // 4. 确认删除
      const confirmed = confirm(
        `⚠️ 确认删除用户 ${user.email}？\n\n这将永久删除 ${preview.dataToDelete.totalRecords} 条记录和 ${preview.dataToDelete.assets} 个文件。\n\n此操作不可撤销！`
      );

      if (!confirmed) {
        console.log(`❌ 用户取消删除操作`);
        return false;
      }

      // 5. 执行删除
      console.log(`🗑️ 正在删除用户...`);
      const deleteResponse = await fetch(
        `${this.baseUrl}/api/admin/delete-user?userId=${userId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        console.error(`❌ 删除失败:`, error.error);
        return false;
      }

      const result = await deleteResponse.json();
      console.log(`🎉 用户删除成功!`);
      console.log(`✅ 删除信息:`, result.deletedData);

      // 6. 清理前端IndexedDB数据
      console.log(`🧹 清理前端IndexedDB数据...`);
      await this.cleanIndexedDB(userId);

      console.log(`✨ 用户 ${email} 完全删除完成！该邮箱现在可以重新注册。`);
      return true;
    } catch (error) {
      console.error(`💥 删除过程发生错误:`, error);
      return false;
    }
  }

  /**
   * 清理用户的IndexedDB数据
   */
  async cleanIndexedDB(userId) {
    const possibleDbNames = [
      `RoboneoImageLibrary_${userId}`,
      `RoboneoImageLibrary_Guest`, // 如果用户曾经以访客身份使用
    ];

    for (const dbName of possibleDbNames) {
      try {
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(dbName);

          deleteRequest.onsuccess = () => {
            console.log(`  ✅ IndexedDB删除成功: ${dbName}`);
            resolve();
          };

          deleteRequest.onerror = () => {
            console.log(`  ⚠️ IndexedDB删除失败或不存在: ${dbName}`);
            resolve(); // 不阻塞后续操作
          };

          deleteRequest.onblocked = () => {
            console.log(`  ⏳ IndexedDB删除被阻塞，等待中: ${dbName}`);
            setTimeout(resolve, 2000); // 2秒后继续
          };
        });
      } catch (error) {
        console.warn(`  ⚠️ IndexedDB清理异常: ${dbName}`, error);
      }
    }
  }

  /**
   * 批量删除多个用户
   */
  async batchDeleteUsers(emails) {
    console.log(`🚀 开始批量删除 ${emails.length} 个用户...`);

    const results = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n📋 [${i + 1}/${emails.length}] 处理用户: ${email}`);

      const success = await this.deleteUserByEmail(email);
      results.push({ email, success });

      if (i < emails.length - 1) {
        console.log(`⏳ 等待1秒后继续下一个用户...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 输出结果统计
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    console.log(`\n📊 批量删除完成:`);
    console.log(`  ✅ 成功: ${successful} 个`);
    console.log(`  ❌ 失败: ${failed} 个`);

    if (failed > 0) {
      const failedEmails = results
        .filter((r) => !r.success)
        .map((r) => r.email);
      console.log(`  失败的邮箱:`, failedEmails);
    }

    return results;
  }

  /**
   * 验证删除结果
   */
  async verifyDeletion(email) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/admin/find-user?email=${encodeURIComponent(email)}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 404) {
        console.log(`✅ 验证成功: 用户 ${email} 已不存在`);
        return true;
      } else {
        console.log(`❌ 验证失败: 用户 ${email} 仍然存在`);
        return false;
      }
    } catch (error) {
      console.error(`验证删除结果时发生错误:`, error);
      return false;
    }
  }
}

// 创建全局实例
window.userDeletionTool = new UserDeletionTool();

// 便捷函数
window.deleteUser = (email) => window.userDeletionTool.deleteUserByEmail(email);
window.batchDeleteUsers = (emails) =>
  window.userDeletionTool.batchDeleteUsers(emails);
window.verifyUserDeleted = (email) =>
  window.userDeletionTool.verifyDeletion(email);

console.log(`
🛠️ 用户删除工具已加载！

快速使用方法：
1. deleteUser('user@example.com') - 删除单个用户
2. batchDeleteUsers(['user1@example.com', 'user2@example.com']) - 批量删除
3. verifyUserDeleted('user@example.com') - 验证删除结果

示例：
await deleteUser('test@example.com');
await batchDeleteUsers(['test1@example.com', 'test2@example.com']);
await verifyUserDeleted('test@example.com');

⚠️ 注意：确保以管理员身份登录！
`);
