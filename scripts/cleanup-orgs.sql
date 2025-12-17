-- Cleanup script to delete orgs that don't match valid Clerk org IDs
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: 
-- 1. FIRST run remove-duplicate-orgs.sql to remove duplicates
-- 2. THEN run this script to remove invalid orgs
-- 3. Update the valid_clerk_org_ids list below with your actual Clerk org IDs
--    You can find these in your Clerk dashboard under Organizations

-- Step 1: Show current state (for reference)
SELECT 
  COUNT(*) as total_orgs,
  COUNT(clerk_org_id) as orgs_with_clerk_id,
  COUNT(*) - COUNT(clerk_org_id) as orgs_without_clerk_id
FROM orgs;

-- Step 2: List the valid Clerk org IDs (UPDATE THESE WITH YOUR ACTUAL IDs)
-- From your Clerk dashboard, you have:
-- - org_36roERNX4bKm1zjtx15bkhuqS9R (XYZ Solutions)
-- - org_36rY2x0Z9tLPpLKTgmUnzqTY4W5 (testing)
-- - org_36qvgboQgs2PJCUKk9ogmLUdcNN (testing)
-- - Add other valid Clerk org IDs here

-- IMPORTANT: Update this array with your actual Clerk org IDs from Clerk dashboard
-- Step 3 & 4: Delete org memberships and orgs that don't match valid Clerk org IDs
-- This deletes orgs that:
-- 1. Don't have a clerk_org_id (NULL)
-- 2. Have a clerk_org_id that's not in the valid list below

-- First, delete org memberships for invalid orgs
DELETE FROM org_members
WHERE org_id IN (
  SELECT id FROM orgs
  WHERE clerk_org_id IS NULL 
     OR clerk_org_id NOT IN (
       'org_36roERNX4bKm1zjtx15bkhuqS9R',  -- XYZ Solutions
       'org_36rY2x0Z9tLPpLKTgmUnzqTY4W5'   -- testing
       -- Add more valid Clerk org IDs here (comma-separated)
       -- 'org_...',
       -- 'org_...'
     )
);

-- Then, delete the orgs themselves
-- This will cascade delete related data due to foreign key constraints
DELETE FROM orgs
WHERE clerk_org_id IS NULL 
   OR clerk_org_id NOT IN (
     'org_36roERNX4bKm1zjtx15bkhuqS9R',  -- XYZ Solutions
     'org_36rY2x0Z9tLPpLKTgmUnzqTY4W5'   -- testing
     -- Add more valid Clerk org IDs here (comma-separated)
     -- 'org_...',
     -- 'org_...'
   );

-- Step 6: Verify the cleanup
SELECT 
  COUNT(*) as remaining_orgs,
  COUNT(CASE WHEN clerk_org_id IS NOT NULL THEN 1 END) as orgs_with_clerk_id
FROM orgs;

-- Step 7: List remaining orgs (should only be your valid ones)
SELECT id, name, kind, clerk_org_id, created_at 
FROM orgs 
ORDER BY created_at DESC;
