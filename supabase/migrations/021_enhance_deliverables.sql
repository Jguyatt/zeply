-- Enhance Deliverables with Priority, Tags, and Additional Fields
-- Adds fields for better routing, reporting, and accountability

-- Step 1: Drop old type constraint
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;

-- Step 2: Update type constraint with expanded options
ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_type_check
  CHECK (type IN ('SEO', 'Ads', 'Creative', 'Dev', 'Automation', 'Report', 'Other', 'Ad', 'Web'));

-- Step 3: Migrate old type values to new ones
UPDATE deliverables
SET type = CASE type
  WHEN 'Ad' THEN 'Ads'
  WHEN 'Web' THEN 'Dev'
  ELSE type
END
WHERE type IN ('Ad', 'Web');

-- Step 4: Update type constraint again to remove old values
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_type_check;
ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_type_check
  CHECK (type IN ('SEO', 'Ads', 'Creative', 'Dev', 'Automation', 'Report', 'Other'));

-- Step 5: Add new fields to deliverables table
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'med', 'high')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estimated_effort TEXT CHECK (estimated_effort IN ('S', 'M', 'L')),
  ADD COLUMN IF NOT EXISTS dependency_id UUID REFERENCES deliverables(id) ON DELETE SET NULL;

-- Step 6: Ensure status default is 'planned' (should already be set, but ensure it)
ALTER TABLE deliverables
  ALTER COLUMN status SET DEFAULT 'planned';

-- Step 7: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_deliverables_priority ON deliverables(priority) WHERE priority IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_tags ON deliverables USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_deliverables_dependency_id ON deliverables(dependency_id) WHERE dependency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_estimated_effort ON deliverables(estimated_effort) WHERE estimated_effort IS NOT NULL;

-- Step 8: Update type index if needed
CREATE INDEX IF NOT EXISTS idx_deliverables_type ON deliverables(type);

