-- Add deliverable_id to weekly_updates table
-- Allows updates to be associated with specific deliverables

ALTER TABLE weekly_updates
  ADD COLUMN IF NOT EXISTS deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_updates_deliverable_id ON weekly_updates(deliverable_id) WHERE deliverable_id IS NOT NULL;

