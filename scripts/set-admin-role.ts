import 'dotenv/config';
import { getDb } from '../src/db';
import { user } from '../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 将用户设置为管理员
 * 使用方法: npx tsx scripts/set-admin-role.ts your-email@example.com
 */
async function setAdminRole() {
  const email = process.argv[2];

  if (!email) {
    console.error('请提供用户邮箱作为参数');
    console.error('示例: npx tsx scripts/set-admin-role.ts your-email@example.com');
    process.exit(1);
  }

  try {
    console.log(`正在将用户 ${email} 设置为管理员...`);

    const db = await getDb();

    // 检查用户是否存在
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userResult.length === 0) {
      console.error(`用户 ${email} 不存在`);
      process.exit(1);
    }

    const userData = userResult[0];
    console.log(`找到用户: ${userData.name} (${userData.email})`);

    // 更新用户角色为admin
    await db
      .update(user)
      .set({
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(user.email, email));

    console.log(`✅ 用户 ${email} 已成功设置为管理员`);
    console.log(`现在你可以访问 /[locale]/admin/users 页面`);
  } catch (error) {
    console.error('设置管理员失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

setAdminRole();
