-- Reports System Redesign Migration
-- Adds tier, versioning, blocks, KPI snapshots, and CSV data support

-- 1. Update reports table
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('auto', 'kpi', 'csv')),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_length_days INTEGER;

-- Set default tier for existing reports
UPDATE reports SET tier = 'auto' WHERE tier IS NULL;

-- 2. Update report_sections table (rename to report_blocks conceptually, but keep table name)
ALTER TABLE report_sections
  ADD COLUMN IF NOT EXISTS block_type TEXT CHECK (block_type IN ('summary', 'work', 'insights', 'next_steps', 'performance', 'custom')),
  ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS snapshot_data JSONB;

-- Set default block_type based on section_type for existing sections
UPDATE report_sections
SET block_type = CASE
  WHEN section_type = 'summary' THEN 'summary'
  WHEN section_type = 'metrics' THEN 'performance'
  WHEN section_type = 'insights' THEN 'insights'
  WHEN section_type = 'recommendations' THEN 'insights'
  WHEN section_type = 'next_steps' THEN 'next_steps'
  WHEN section_type = 'proof_of_work' THEN 'work'
  ELSE 'custom'
END
WHERE block_type IS NULL;

-- 3. Create report_kpi_snapshots table
CREATE TABLE IF NOT EXISTS report_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  leads INTEGER,
  spend DECIMAL(12, 2),
  revenue DECIMAL(12, 2),
  cpl DECIMAL(10, 2),
  roas DECIMAL(10, 2),
  delta_leads INTEGER,
  delta_spend DECIMAL(12, 2),
  delta_revenue DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create report_csv_data table
CREATE TABLE IF NOT EXISTS report_csv_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  parsed_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_tier ON reports(tier);
CREATE INDEX IF NOT EXISTS idx_reports_version ON reports(org_id, version);
CREATE INDEX IF NOT EXISTS idx_reports_previous_version ON reports(previous_version_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_block_type ON report_sections(block_type);
CREATE INDEX IF NOT EXISTS idx_report_kpi_snapshots_report_id ON report_kpi_snapshots(report_id);
CREATE INDEX IF NOT EXISTS idx_report_csv_data_report_id ON report_csv_data(report_id);

-- RLS Policies
ALTER TABLE report_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_csv_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view report_kpi_snapshots"
  ON report_kpi_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_kpi_snapshots.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Org members can insert report_kpi_snapshots"
  ON report_kpi_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_kpi_snapshots.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Org members can update report_kpi_snapshots"
  ON report_kpi_snapshots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_kpi_snapshots.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Org members can view report_csv_data"
  ON report_csv_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_csv_data.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Org members can insert report_csv_data"
  ON report_csv_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_csv_data.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Org members can update report_csv_data"
  ON report_csv_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_csv_data.report_id
      AND reports.org_id IN (SELECT org_id FROM org_members WHERE user_id::text = auth.uid()::text)
    )
  );

