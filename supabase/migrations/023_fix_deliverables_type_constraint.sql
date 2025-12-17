-- Fix deliverables_type_check constraint to allow all valid types
-- This ensures the constraint matches the current application code

-- Step 1: Drop the old constraint
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;

-- Step 2: Add the updated constraint with all valid types
ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_type_check
  CHECK (type IN ('SEO', 'Ads', 'Creative', 'Dev', 'Automation', 'Report', 'Other'));

-- Step 3: Migrate any existing 'Ad' values to 'Ads' (if any exist)
UPDATE deliverables
SET type = 'Ads'
WHERE type = 'Ad';

-- Step 4: Migrate any existing 'Web' values to 'Dev' (if any exist)
UPDATE deliverables
SET type = 'Dev'
WHERE type = 'Web';

