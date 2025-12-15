-- Metrics table for storing performance metrics per organization
-- This table stores leads, spend, CPL, ROAS and other metrics over time

CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  leads INTEGER DEFAULT 0,
  spend DECIMAL(12, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  cpl DECIMAL(10, 2), -- Cost Per Lead (calculated: spend / leads)
  roas DECIMAL(10, 2), -- Return on Ad Spend (calculated: revenue / spend)
  website_traffic INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2), -- Percentage (calculated: conversions / website_traffic * 100)
  created_by UUID NOT NULL, -- Clerk user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure period_end is after period_start
  CHECK (period_end > period_start)
);

-- Indexes for efficient lookups
CREATE INDEX idx_metrics_org_id ON metrics(org_id);
CREATE INDEX idx_metrics_period ON metrics(org_id, period_start, period_end);
CREATE INDEX idx_metrics_created_at ON metrics(created_at);

-- Enable RLS
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Since we're using Clerk, RLS is enforced at the application layer
-- These policies provide a basic security layer, but full auth is handled in app code
-- Metrics table uses Clerk user IDs (TEXT), so we rely on application-level auth checks
CREATE POLICY "Authenticated users can manage metrics"
  ON metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

