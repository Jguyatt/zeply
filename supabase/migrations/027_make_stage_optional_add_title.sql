-- Make stage optional and add title to deliverable_updates
-- Updates don't need stages - only deliverables do

-- Step 1: Add title column
ALTER TABLE deliverable_updates
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Make stage nullable (updates don't need stages)
ALTER TABLE deliverable_updates
  ALTER COLUMN stage DROP NOT NULL;

-- Step 3: Drop the CHECK constraint on stage since it's now optional
ALTER TABLE deliverable_updates
  DROP CONSTRAINT IF EXISTS deliverable_updates_stage_check;

-- Step 4: Re-add the CHECK constraint but allow NULL
ALTER TABLE deliverable_updates
  ADD CONSTRAINT deliverable_updates_stage_check
  CHECK (stage IS NULL OR stage IN (
    'planned',
    'in_progress',
    'finishing_touches',
    'in_review',
    'approved',
    'complete'
  ));
