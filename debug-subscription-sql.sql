-- 订阅状态调试SQL查询
-- 用于直接在数据库中检查用户订阅状态

-- 0. 根据邮箱查找用户ID
-- 替换 'USER_EMAIL' 为实际的用户邮箱
SELECT 
    id as user_id,
    email,
    name,
    role,
    created_at as user_created,
    (SELECT COUNT(*) FROM payment WHERE user_id = "user".id) as total_payments,
    (SELECT COUNT(*) FROM payment WHERE user_id = "user".id AND status IN ('active', 'trialing')) as active_subscriptions
FROM "user" 
WHERE email = 'USER_EMAIL';

-- 0.1 模糊搜索用户（根据邮箱或姓名）
-- 替换 'SEARCH_TERM' 为搜索关键词
SELECT 
    id as user_id,
    email,
    name,
    role,
    created_at as user_created,
    (SELECT COUNT(*) FROM payment WHERE user_id = "user".id) as total_payments,
    (SELECT COUNT(*) FROM payment WHERE user_id = "user".id AND status IN ('active', 'trialing')) as active_subscriptions
FROM "user" 
WHERE email ILIKE '%SEARCH_TERM%' 
   OR name ILIKE '%SEARCH_TERM%'
   OR id = 'SEARCH_TERM'
ORDER BY created_at DESC
LIMIT 10;

-- 1. 查看特定用户的所有支付记录
-- 替换 'USER_ID' 为实际的用户ID
SELECT 
    p.id,
    p.subscription_id,
    p.customer_id,
    p.price_id,
    p.status,
    p.type,
    p.interval,
    p.period_start,
    p.period_end,
    p.cancel_at_period_end,
    p.trial_start,
    p.trial_end,
    p.created_at,
    p.updated_at,
    u.email as user_email,
    u.name as user_name
FROM payment p
JOIN "user" u ON p.user_id = u.id
WHERE p.user_id = 'USER_ID' 
ORDER BY p.created_at DESC;

-- 2. 查看所有活跃状态的订阅
SELECT 
    user_id,
    subscription_id,
    status,
    period_start,
    period_end,
    cancel_at_period_end,
    created_at,
    updated_at
FROM payment 
WHERE status IN ('active', 'trialing')
ORDER BY created_at DESC;

-- 3. 查看所有已取消的订阅
SELECT 
    user_id,
    subscription_id,
    status,
    period_start,
    period_end,
    cancel_at_period_end,
    created_at,
    updated_at
FROM payment 
WHERE status = 'canceled'
ORDER BY updated_at DESC;

-- 4. 查看可能有问题的订阅记录（状态为活跃但过期的）
SELECT 
    user_id,
    subscription_id,
    status,
    period_end,
    cancel_at_period_end,
    CASE 
        WHEN period_end < NOW() THEN 'EXPIRED'
        ELSE 'VALID'
    END as period_status
FROM payment 
WHERE status IN ('active', 'trialing')
    AND period_end IS NOT NULL
ORDER BY period_end DESC;

-- 5. 统计各种订阅状态的数量
SELECT 
    status,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM payment 
GROUP BY status
ORDER BY count DESC;

-- 6. 查看最近30天的订阅变更
SELECT 
    user_id,
    subscription_id,
    status,
    type,
    created_at,
    updated_at
FROM payment 
WHERE updated_at >= NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;

-- 7. 查看有多个订阅记录的用户
SELECT 
    user_id,
    COUNT(*) as subscription_count,
    array_agg(status) as statuses,
    array_agg(subscription_id) as subscription_ids
FROM payment 
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY subscription_count DESC;

-- 8. 查看特定时间段内取消的订阅
-- 替换日期为你要检查的时间段
SELECT 
    user_id,
    subscription_id,
    status,
    updated_at,
    cancel_at_period_end
FROM payment 
WHERE status = 'canceled'
    AND updated_at >= '2024-01-01'
    AND updated_at <= '2024-12-31'
ORDER BY updated_at DESC;

-- 9. 检查用户表和支付表的关联完整性
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    p.status as subscription_status,
    p.subscription_id,
    p.updated_at as last_payment_update
FROM "user" u
LEFT JOIN payment p ON u.id = p.user_id
WHERE p.status IN ('active', 'trialing')
ORDER BY p.updated_at DESC;

-- 10. 查找可能的数据不一致问题
-- (有活跃订阅但期间已过期的记录)
SELECT 
    user_id,
    subscription_id,
    status,
    period_start,
    period_end,
    NOW() as current_time,
    CASE 
        WHEN period_end < NOW() THEN 'SHOULD_BE_EXPIRED'
        WHEN period_start > NOW() THEN 'FUTURE_SUBSCRIPTION'
        ELSE 'VALID'
    END as validity_check
FROM payment 
WHERE status IN ('active', 'trialing')
    AND period_end IS NOT NULL
    AND period_end < NOW()
ORDER BY period_end DESC;
