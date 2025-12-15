-- Test the signup flow manually
-- This helps debug if the trigger is working

-- First, check if there are any existing users
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if user_profiles were created for existing users
SELECT 
    up.user_id,
    up.full_name,
    up.active_org_id,
    u.email
FROM user_profiles up
JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC
LIMIT 5;

-- If you see users without profiles, you can manually create them:
-- (Replace USER_ID_HERE with an actual user ID)
-- INSERT INTO user_profiles (user_id, full_name)
-- VALUES ('USER_ID_HERE', 'Test User')
-- ON CONFLICT (user_id) DO NOTHING;

