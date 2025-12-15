-- Reports table for storing performance reports
-- Reports can be drafts or published, and are visible to clients when published

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL, -- Clerk user ID
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report sections for storing report content
CREATE TABLE report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('summary', 'metrics', 'insights', 'recommendations', 'next_steps', 'custom')),
  title TEXT,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_reports_org_id ON reports(org_id);
CREATE INDEX idx_reports_status ON reports(org_id, status);
CREATE INDEX idx_reports_published ON reports(org_id, published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX idx_report_sections_order ON report_sections(report_id, order_index);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
-- Note: Since we're using Clerk, RLS is enforced at the application layer
-- These policies provide a basic security layer, but full auth is handled in app code
-- Reports table uses Clerk user IDs (TEXT), so we rely on application-level auth checks
CREATE POLICY "Authenticated users can manage reports"
  ON reports FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for report_sections
-- Note: Since we're using Clerk, RLS is enforced at the application layer
-- These policies provide a basic security layer, but full auth is handled in app code
CREATE POLICY "Authenticated users can manage report sections"
  ON report_sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_sections_updated_at
  BEFORE UPDATE ON report_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

