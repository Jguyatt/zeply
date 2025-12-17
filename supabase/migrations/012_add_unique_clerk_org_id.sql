-- Add unique constraint on clerk_org_id to prevent duplicate orgs
-- This ensures that each Clerk org ID can only exist once in the database

-- First, remove any duplicate clerk_org_ids (keep the oldest one)
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
  SELECT id FROM ranked_orgs WHERE rn > 1
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_clerk_org_id_unique 
ON orgs(clerk_org_id) 
WHERE clerk_org_id IS NOT NULL;

-- Add comment
COMMENT ON INDEX idx_orgs_clerk_org_id_unique IS 'Ensures each Clerk org ID maps to only one Supabase org';

