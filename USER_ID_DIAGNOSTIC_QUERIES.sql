-- =================================================================
-- USER ID 诊断查询 - 检测重复ID和注册完整性问题
-- =================================================================

-- 1. 检查是否有重复的user ID (理论上不应该有，因为是主键)
-- =================================================================
SELECT 
  id,
  COUNT(*) as duplicate_count
FROM "user"
GROUP BY id
HAVING COUNT(*) > 1;

-- 期望结果: 空结果集 (没有重复)
-- 如果有结果，说明数据完整性被破坏


-- 2. 检查是否有NULL或空字符串的user ID
-- =================================================================
SELECT 
  id,
  name,
  email,
  created_at
FROM "user"
WHERE id IS NULL 
   OR id = ''
   OR LENGTH(TRIM(id)) = 0;

-- 期望结果: 空结果集 (没有NULL或空ID)


-- 3. 检查user ID的长度和格式异常
-- =================================================================
SELECT 
  id,
  LENGTH(id) as id_length,
  name,
  email,
  created_at
FROM "user"
WHERE LENGTH(id) < 10  -- 正常ID应该比较长
   OR LENGTH(id) > 255  -- 异常长的ID
   OR id !~ '^[a-zA-Z0-9_-]+$'  -- 包含特殊字符的ID
ORDER BY id_length ASC;

-- 期望结果: 可能为空，或者显示格式异常的ID


-- 4. 检查用户注册完整性 - 缺少必要字段
-- =================================================================
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
   OR created_at IS NULL;

-- 期望结果: 空结果集 (所有用户都有完整信息)


-- 5. 检查email重复问题 (应该唯一)
-- =================================================================
SELECT 
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(id, ', ') as user_ids,
  STRING_AGG(name, ', ') as names
FROM "user"
GROUP BY email
HAVING COUNT(*) > 1;

-- 期望结果: 空结果集 (没有重复邮箱)
-- 如果有结果，说明可能有重复注册或数据问题


-- 6. 查找孤立的sessions (没有对应用户)
-- =================================================================
SELECT 
  s.id as session_id,
  s.user_id,
  s.created_at as session_created,
  'No matching user' as issue
FROM "session" s
LEFT JOIN "user" u ON s.user_id = u.id
WHERE u.id IS NULL;

-- 期望结果: 空结果集 (所有session都有对应用户)


-- 7. 查找孤立的assets (没有对应用户)
-- =================================================================
SELECT 
  a.id as asset_id,
  a.user_id,
  a.filename,
  a.created_at as asset_created,
  'No matching user' as issue
FROM assets a
LEFT JOIN "user" u ON a.user_id = u.id
WHERE u.id IS NULL;

-- 期望结果: 空结果集 (所有assets都有对应用户)


-- 8. 检查最近注册的用户 (确认ID生成正常)
-- =================================================================
SELECT 
  id,
  LENGTH(id) as id_length,
  name,
  email,
  email_verified,
  created_at,
  CASE 
    WHEN LENGTH(id) < 20 THEN 'Short ID (可能异常)'
    WHEN LENGTH(id) > 50 THEN 'Long ID (可能异常)'
    ELSE 'Normal'
  END as id_status
FROM "user"
WHERE created_at > NOW() - INTERVAL '7 days'  -- 最近7天注册的用户
ORDER BY created_at DESC
LIMIT 20;

-- 期望结果: 显示最近用户，ID长度应该相对一致


-- 9. 统计用户ID长度分布
-- =================================================================
SELECT 
  LENGTH(id) as id_length,
  COUNT(*) as user_count,
  MIN(created_at) as earliest_user,
  MAX(created_at) as latest_user
FROM "user"
GROUP BY LENGTH(id)
ORDER BY user_count DESC;

-- 期望结果: 显示ID长度分布，大多数应该长度相似


-- 10. 检查用户表的整体健康状况
-- =================================================================
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT email) as unique_emails,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users,
  MIN(created_at) as first_user_registered,
  MAX(created_at) as last_user_registered
FROM "user";

-- 期望结果: total_users = unique_ids = unique_emails (完全一致)


-- 11. 查找可能的重复用户 (相同name和email)
-- =================================================================
SELECT 
  name,
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(id, ', ') as user_ids,
  STRING_AGG(created_at::text, ', ') as created_times
FROM "user"
GROUP BY name, email
HAVING COUNT(*) > 1;

-- 期望结果: 空结果集 (没有重复用户)


-- 12. 检查Better Auth相关表的一致性
-- =================================================================
SELECT 
  'accounts_without_users' as issue_type,
  COUNT(*) as count
FROM account a
LEFT JOIN "user" u ON a.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'sessions_without_users' as issue_type,
  COUNT(*) as count
FROM session s
LEFT JOIN "user" u ON s.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'users_without_credits' as issue_type,
  COUNT(*) as count
FROM "user" u
WHERE u.credits IS NULL;

-- 期望结果: 所有count都应该是0
