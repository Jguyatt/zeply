-- Deliverable Updates System
-- Adds stage-based updates with attachments and visibility

-- Step 1: Create deliverable_updates table
CREATE TABLE IF NOT EXISTS deliverable_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN (
    'planned',
    'in_progress',
    'finishing_touches',
    'in_review',
    'approved',
    'complete'
  )),
  note TEXT,
  created_by UUID NOT NULL, -- Clerk user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_visible BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT deliverable_updates_deliverable_id_fkey FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
);

-- Step 2: Add update_id to deliverable_assets to link assets to updates
ALTER TABLE deliverable_assets
  ADD COLUMN IF NOT EXISTS update_id UUID REFERENCES deliverable_updates(id) ON DELETE SET NULL;

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_deliverable_updates_deliverable_id ON deliverable_updates(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_updates_created_at ON deliverable_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliverable_assets_update_id ON deliverable_assets(update_id);

-- Step 4: Add RLS policies for deliverable_updates
ALTER TABLE deliverable_updates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all updates"
  ON deliverable_updates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN deliverables d ON d.org_id = om.org_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'owner')
      AND d.id = deliverable_updates.deliverable_id
    )
  );

-- Clients can view client-visible updates
CREATE POLICY "Clients can view visible updates"
  ON deliverable_updates
  FOR SELECT
  USING (
    client_visible = true
    AND EXISTS (
      SELECT 1 FROM org_members om
      JOIN deliverables d ON d.org_id = om.org_id
      WHERE om.user_id = auth.uid()
      AND d.id = deliverable_updates.deliverable_id
    )
  );

-- Step 5: Add updated_at trigger to deliverables when updates are created
CREATE OR REPLACE FUNCTION update_deliverable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE deliverables
  SET updated_at = NOW()
  WHERE id = NEW.deliverable_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deliverable_updates_updated_at
  AFTER INSERT ON deliverable_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_deliverable_updated_at();

