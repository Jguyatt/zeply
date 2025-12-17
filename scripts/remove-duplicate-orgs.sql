-- Remove duplicate organizations with the same clerk_org_id
-- This keeps the OLDEST org (first created) and deletes all duplicates
-- Run this BEFORE running the cleanup-orgs.sql script

-- Step 1: Show duplicates
SELECT 
  clerk_org_id,
  COUNT(*) as duplicate_count,
  MIN(created_at) as oldest_created_at,
  MAX(created_at) as newest_created_at
FROM orgs
WHERE clerk_org_id IS NOT NULL
GROUP BY clerk_org_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete org memberships for duplicate orgs (keep memberships for the oldest org)
WITH ranked_orgs AS (
  SELECT 
    id,
    clerk_org_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY clerk_org_id ORDER BY created_at ASC) as rn
  FROM orgs
  WHERE clerk_org_id IS NOT NULL
),
duplicate_org_ids AS (
  SELECT id
  FROM ranked_orgs
  WHERE rn > 1  -- Keep the first one (rn = 1), delete the rest
)
DELETE FROM org_members
WHERE org_id IN (SELECT id FROM duplicate_org_ids);

-- Step 3: Delete duplicate orgs (keep the oldest one per clerk_org_id)
WITH ranked_orgs AS (
  SELECT 
    id,
    clerk_org_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY clerk_org_id ORDER BY created_at ASC) as rn
  FROM orgs
  WHERE clerk_org_id IS NOT NULL
)
DELETE FROM orgs
WHERE id IN (
  SELECT id 
  FROM ranked_orgs 
  WHERE rn > 1  -- Keep the first one (rn = 1), delete the rest
);

-- Step 4: Verify duplicates are removed
SELECT 
  clerk_org_id,
  COUNT(*) as count
FROM orgs
WHERE clerk_org_id IS NOT NULL
GROUP BY clerk_org_id
HAVING COUNT(*) > 1;
-- Should return 0 rows if all duplicates are removed

-- Step 5: Show final state
SELECT 
  COUNT(*) as total_orgs,
  COUNT(DISTINCT clerk_org_id) as unique_clerk_org_ids,
  COUNT(*) - COUNT(DISTINCT clerk_org_id) as remaining_duplicates
FROM orgs
WHERE clerk_org_id IS NOT NULL;

