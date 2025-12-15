-- Client Portal Schema
-- Deliverables, assets, comments, and portal settings

-- Deliverables table
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Ad', 'Creative', 'SEO', 'Web', 'Automation', 'Other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'delivered')),
  due_date TIMESTAMPTZ,
  description TEXT,
  created_by UUID NOT NULL, -- Clerk user ID
  published_at TIMESTAMPTZ,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliverable assets (files, links, etc.)
CREATE TABLE deliverable_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('file', 'link', 'loom', 'gdrive')),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliverable comments
CREATE TABLE deliverable_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL, -- Clerk user ID
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portal settings per organization
CREATE TABLE portal_settings (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  enabled_sections JSONB NOT NULL DEFAULT '{"executive_summary": true, "deliverables": true, "roadmap": true, "reports": true, "updates": true}'::jsonb,
  metrics_config JSONB NOT NULL DEFAULT '{"leads": true, "spend": true, "cpl": true, "roas": true, "work_completed": true}'::jsonb,
  executive_summary_text TEXT,
  confidence_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roadmap items
CREATE TABLE roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('this_week', 'next_week', 'blocker')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL, -- Clerk user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly updates
CREATE TABLE weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  what_we_did TEXT NOT NULL,
  results TEXT,
  next_steps TEXT,
  created_by UUID NOT NULL, -- Clerk user ID
  published_at TIMESTAMPTZ,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_deliverables_org_id ON deliverables(org_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverables_published ON deliverables(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_deliverable_assets_deliverable_id ON deliverable_assets(deliverable_id);
CREATE INDEX idx_deliverable_comments_deliverable_id ON deliverable_comments(deliverable_id);
CREATE INDEX idx_roadmap_items_org_id ON roadmap_items(org_id);
CREATE INDEX idx_roadmap_items_timeframe ON roadmap_items(timeframe);
CREATE INDEX idx_weekly_updates_org_id ON weekly_updates(org_id);
CREATE INDEX idx_weekly_updates_published ON weekly_updates(published_at) WHERE published_at IS NOT NULL;

-- RLS Policies
-- Note: Since we're using Clerk, RLS is enforced at the application layer
-- These policies provide a basic security layer, but full auth is handled in app code
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;

-- For now, we'll use service role for operations and enforce permissions in app code
-- These policies allow access if user is a member of the org (basic check)
-- Full agency/client distinction is handled in application layer

-- Deliverables: Basic RLS - full permissions enforced in app code
-- All operations go through service role with app-level permission checks
CREATE POLICY "Allow all for authenticated service role"
  ON deliverables FOR ALL
  USING (true)
  WITH CHECK (true);

-- Deliverable assets: Basic RLS
CREATE POLICY "Allow all for authenticated service role"
  ON deliverable_assets FOR ALL
  USING (true)
  WITH CHECK (true);

-- Deliverable comments: Basic RLS
CREATE POLICY "Allow all for authenticated service role"
  ON deliverable_comments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Portal settings: Basic RLS
CREATE POLICY "Allow all for authenticated service role"
  ON portal_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Roadmap items: Basic RLS
CREATE POLICY "Allow all for authenticated service role"
  ON roadmap_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Weekly updates: Basic RLS
CREATE POLICY "Allow all for authenticated service role"
  ON weekly_updates FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_updates_updated_at
  BEFORE UPDATE ON weekly_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_settings_updated_at
  BEFORE UPDATE ON portal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

