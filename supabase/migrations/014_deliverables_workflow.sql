-- Deliverables Workflow System Migration
-- Updates deliverables table with new statuses, adds workflow tables

-- Step 1: Migrate existing statuses before changing constraint
UPDATE deliverables
SET status = CASE status
  WHEN 'draft' THEN 'planned'
  WHEN 'in_review' THEN 'in_review'
  WHEN 'approved' THEN 'approved'
  WHEN 'delivered' THEN 'complete'
  ELSE 'planned'
END;

-- Step 2: Drop old status constraint
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;

-- Step 3: Add new columns to deliverables table
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS assigned_to UUID, -- Clerk user ID
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Step 4: Add new status constraint with all workflow statuses
ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_status_check
  CHECK (status IN (
    'planned',
    'in_progress',
    'finishing_touches',
    'in_review',
    'approved',
    'complete',
    'blocked',
    'revisions_requested'
  ));

-- Step 5: Update deliverable_assets table
ALTER TABLE deliverable_assets
  ADD COLUMN IF NOT EXISTS is_required_proof BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proof_type TEXT CHECK (proof_type IN ('url', 'file', 'screenshot', 'loom', 'gdrive'));

-- Step 6: Create deliverable_templates table
CREATE TABLE IF NOT EXISTS deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Report', 'Landing Page', 'Web', 'Workflow', 'Automation', 'Integration', 'Creative')),
  description TEXT,
  required_proof_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Create deliverable_template_items table
CREATE TABLE IF NOT EXISTS deliverable_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES deliverable_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 8: Create deliverable_checklist_items table
CREATE TABLE IF NOT EXISTS deliverable_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  done_at TIMESTAMPTZ,
  done_by UUID, -- Clerk user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 9: Create deliverable_activity_log table
CREATE TABLE IF NOT EXISTS deliverable_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Clerk user ID
  action TEXT NOT NULL CHECK (action IN ('status_change', 'comment', 'checklist_item', 'proof_added', 'proof_removed', 'checklist_item_added', 'checklist_item_removed')),
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliverable_templates_type ON deliverable_templates(type);
CREATE INDEX IF NOT EXISTS idx_deliverable_template_items_template_id ON deliverable_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_checklist_items_deliverable_id ON deliverable_checklist_items(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_checklist_items_done ON deliverable_checklist_items(deliverable_id, is_done);
CREATE INDEX IF NOT EXISTS idx_deliverable_activity_log_deliverable_id ON deliverable_activity_log(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_activity_log_created_at ON deliverable_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to ON deliverables(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliverables_progress ON deliverables(progress);

-- Step 11: Enable RLS on new tables
ALTER TABLE deliverable_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_activity_log ENABLE ROW LEVEL SECURITY;

-- Step 12: Basic RLS policies (full permissions enforced in app code)
CREATE POLICY "Allow all for authenticated service role" ON deliverable_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated service role" ON deliverable_template_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated service role" ON deliverable_checklist_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated service role" ON deliverable_activity_log
  FOR ALL USING (true) WITH CHECK (true);

