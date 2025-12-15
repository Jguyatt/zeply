-- Debug queries to check what's happening during signup
-- Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if the trigger function exists and is correct
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- 2. Check if the trigger exists on auth.users
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    t.action_statement,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.trigger_name = 'on_auth_user_created';

-- 3. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 4. Check recent user signups and their profiles
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    up.user_id as profile_user_id,
    up.full_name,
    up.created_at as profile_created
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Check for any errors in Supabase logs (if accessible)
-- Note: This might require admin access to Supabase logs

