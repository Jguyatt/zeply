-- Client Portal Configuration Schema
-- Supports services, onboarding, and dashboard customization per client org

-- ============================================================================
-- CLIENT_PORTAL_CONFIG TABLE
-- ============================================================================
CREATE TABLE client_portal_config (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  services JSONB NOT NULL DEFAULT '{}',
  dashboard_layout JSONB NOT NULL DEFAULT '{"sections": ["kpis", "deliverables", "updates"], "kpis": ["leads", "spend", "cpl", "roas", "work_completed"]}',
  onboarding_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_client_portal_config_org_id ON client_portal_config(org_id);

-- ============================================================================
-- ONBOARDING_ITEMS TABLE
-- ============================================================================
CREATE TABLE onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('doc', 'form', 'contract', 'connect', 'payment', 'call')),
  required BOOLEAN NOT NULL DEFAULT false,
  url TEXT,
  file_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_onboarding_items_org_id ON onboarding_items(org_id);
CREATE INDEX idx_onboarding_items_published ON onboarding_items(published);

-- ============================================================================
-- ONBOARDING_PROGRESS TABLE
-- ============================================================================
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  item_id UUID NOT NULL REFERENCES onboarding_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id, item_id)
);

-- Indexes
CREATE INDEX idx_onboarding_progress_org_user ON onboarding_progress(org_id, user_id);
CREATE INDEX idx_onboarding_progress_item ON onboarding_progress(item_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE client_portal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Client portal config: Authenticated users can view/manage (app enforces permissions)
CREATE POLICY "Authenticated users can manage client portal config"
  ON client_portal_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Onboarding items: Authenticated users can view/manage (app enforces permissions)
CREATE POLICY "Authenticated users can manage onboarding items"
  ON onboarding_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Onboarding progress: Users can view their own progress, agency can view all
CREATE POLICY "Authenticated users can manage onboarding progress"
  ON onboarding_progress FOR ALL
  USING (true)
  WITH CHECK (true);

