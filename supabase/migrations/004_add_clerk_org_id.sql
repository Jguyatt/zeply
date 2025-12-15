-- Add Clerk organization ID mapping to orgs table
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orgs_clerk_org_id ON orgs(clerk_org_id);

-- Add comment
COMMENT ON COLUMN orgs.clerk_org_id IS 'Clerk organization ID for mapping Clerk orgs to Supabase orgs';

