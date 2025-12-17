-- Add archived column to deliverables table
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_deliverables_archived ON deliverables(archived);

