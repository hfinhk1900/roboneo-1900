import { getDb } from '@/db';
import { auth } from '@/lib/auth';
import { sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    const currentUser = session?.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const diagnostics: any = {};

    // 1. 检查重复的user ID
    console.log('🔍 Checking for duplicate user IDs...');
    const duplicateIds = await db.execute(sql`
      SELECT 
        id,
        COUNT(*) as duplicate_count
      FROM "user"
      GROUP BY id
      HAVING COUNT(*) > 1
    `);
    diagnostics.duplicateUserIds = {
      description: 'Duplicate User IDs (should be empty)',
      count: duplicateIds.length,
      data: duplicateIds,
      status: duplicateIds.length === 0 ? 'OK' : 'ERROR',
    };

    // 2. 检查NULL或空的user ID
    console.log('🔍 Checking for NULL/empty user IDs...');
    const nullIds = await db.execute(sql`
      SELECT 
        id,
        name,
        email,
        created_at
      FROM "user"
      WHERE id IS NULL 
         OR id = ''
         OR LENGTH(TRIM(id)) = 0
    `);
    diagnostics.nullOrEmptyIds = {
      description: 'NULL or empty User IDs (should be empty)',
      count: nullIds.length,
      data: nullIds,
      status: nullIds.length === 0 ? 'OK' : 'ERROR',
    };

    // 3. 检查email重复
    console.log('🔍 Checking for duplicate emails...');
    const duplicateEmails = await db.execute(sql`
      SELECT 
        email,
        COUNT(*) as duplicate_count,
        STRING_AGG(id, ', ') as user_ids,
        STRING_AGG(name, ', ') as names
      FROM "user"
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    diagnostics.duplicateEmails = {
      description: 'Duplicate emails (should be empty)',
      count: duplicateEmails.length,
      data: duplicateEmails,
      status: duplicateEmails.length === 0 ? 'OK' : 'ERROR',
    };

    // 4. 检查用户注册完整性
    console.log('🔍 Checking user registration integrity...');
    const incompleteUsers = await db.execute(sql`
      SELECT 
        id,
        name,
        email,
        email_verified,
        created_at,
        CASE 
          WHEN name IS NULL OR name = '' THEN 'Missing Name'
          WHEN email IS NULL OR email = '' THEN 'Missing Email'
          WHEN email_verified IS NULL THEN 'Missing Email Verification Status'
          WHEN created_at IS NULL THEN 'Missing Created Date'
          ELSE 'OK'
        END as issue
      FROM "user"
      WHERE name IS NULL 
         OR name = ''
         OR email IS NULL 
         OR email = ''
         OR email_verified IS NULL
         OR created_at IS NULL
    `);
    diagnostics.incompleteUsers = {
      description: 'Users with missing required fields (should be empty)',
      count: incompleteUsers.length,
      data: incompleteUsers,
      status: incompleteUsers.length === 0 ? 'OK' : 'WARNING',
    };

    // 5. 检查孤立的assets
    console.log('🔍 Checking for orphaned assets...');
    const orphanedAssets = await db.execute(sql`
      SELECT 
        a.id as asset_id,
        a.user_id,
        a.filename,
        a.created_at as asset_created
      FROM assets a
      LEFT JOIN "user" u ON a.user_id = u.id
      WHERE u.id IS NULL
      LIMIT 10
    `);
    diagnostics.orphanedAssets = {
      description: 'Assets without corresponding users (should be empty)',
      count: orphanedAssets.length,
      data: orphanedAssets,
      status: orphanedAssets.length === 0 ? 'OK' : 'WARNING',
    };

    // 6. 用户统计概览
    console.log('🔍 Getting user statistics...');
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(DISTINCT id) as unique_ids,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users,
        MIN(created_at) as first_user_registered,
        MAX(created_at) as last_user_registered
      FROM "user"
    `);
    diagnostics.userStatistics = {
      description: 'Overall user statistics',
      data: userStats[0],
      status:
        userStats[0]?.total_users === userStats[0]?.unique_ids &&
        userStats[0]?.total_users === userStats[0]?.unique_emails
          ? 'OK'
          : 'WARNING',
    };

    // 7. ID长度分布
    console.log('🔍 Analyzing user ID length distribution...');
    const idLengthDistribution = await db.execute(sql`
      SELECT 
        LENGTH(id) as id_length,
        COUNT(*) as user_count,
        MIN(created_at) as earliest_user,
        MAX(created_at) as latest_user
      FROM "user"
      GROUP BY LENGTH(id)
      ORDER BY user_count DESC
      LIMIT 10
    `);
    diagnostics.idLengthDistribution = {
      description: 'Distribution of user ID lengths',
      data: idLengthDistribution,
      status: 'INFO',
    };

    // 8. 最近注册的用户 (检查ID生成)
    console.log('🔍 Checking recent user registrations...');
    const recentUsers = await db.execute(sql`
      SELECT 
        id,
        LENGTH(id) as id_length,
        name,
        email,
        email_verified,
        created_at
      FROM "user"
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    diagnostics.recentUsers = {
      description: 'Recent user registrations (last 7 days)',
      count: recentUsers.length,
      data: recentUsers,
      status: 'INFO',
    };

    // 9. Better Auth表一致性检查
    console.log('🔍 Checking Better Auth table consistency...');
    const orphanedSessions = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM session s
      LEFT JOIN "user" u ON s.user_id = u.id
      WHERE u.id IS NULL
    `);

    const orphanedAccounts = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM account a
      LEFT JOIN "user" u ON a.user_id = u.id
      WHERE u.id IS NULL
    `);

    diagnostics.authConsistency = {
      description: 'Better Auth table consistency',
      data: {
        orphanedSessions: orphanedSessions[0]?.count || 0,
        orphanedAccounts: orphanedAccounts[0]?.count || 0,
      },
      status:
        (orphanedSessions[0]?.count || 0) === 0 &&
        (orphanedAccounts[0]?.count || 0) === 0
          ? 'OK'
          : 'WARNING',
    };

    // 总体健康评分
    const errorCount = Object.values(diagnostics).filter(
      (d: any) => d.status === 'ERROR'
    ).length;
    const warningCount = Object.values(diagnostics).filter(
      (d: any) => d.status === 'WARNING'
    ).length;

    const overallHealth = {
      status:
        errorCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'HEALTHY',
      errorCount,
      warningCount,
      summary:
        errorCount > 0
          ? 'Database integrity issues detected!'
          : warningCount > 0
            ? 'Minor issues detected, review recommended'
            : 'Database appears healthy',
    };

    console.log('✅ User integrity diagnostics completed');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallHealth,
      diagnostics,
      instructions: {
        message: 'User ID and database integrity diagnostic results',
        keyFindings: [
          `Total users: ${userStats[0]?.total_users}`,
          `Unique IDs: ${userStats[0]?.unique_ids}`,
          `Unique emails: ${userStats[0]?.unique_emails}`,
          `Verified users: ${userStats[0]?.verified_users}`,
          `Recent registrations: ${recentUsers.length}`,
        ],
      },
    });
  } catch (error) {
    console.error('❌ User integrity diagnostic error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
