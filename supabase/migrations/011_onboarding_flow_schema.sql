-- Onboarding Flow Builder Schema
-- Creates tables for visual flow builder: flows, nodes, edges, progress, and signatures

-- ============================================================================
-- ONBOARDING_FLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Onboarding',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  version INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_flow UNIQUE (org_id, name, version)
);

-- ============================================================================
-- ONBOARDING_NODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'payment', 'contract', 'consent', 'upload', 'connect', 'call')),
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_flow_order UNIQUE (flow_id, order_index)
);

-- ============================================================================
-- ONBOARDING_EDGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES onboarding_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES onboarding_nodes(id) ON DELETE CASCADE,
  condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_loop CHECK (source_node_id != target_node_id)
);

-- ============================================================================
-- UPDATE ONBOARDING_PROGRESS TABLE
-- ============================================================================
-- Update existing onboarding_progress to use node_id instead of item_id
-- First, drop the old unique constraint if it exists
ALTER TABLE onboarding_progress 
  DROP CONSTRAINT IF EXISTS onboarding_progress_org_id_user_id_item_id_key;

-- Add node_id column if it doesn't exist
ALTER TABLE onboarding_progress 
  ADD COLUMN IF NOT EXISTS node_id UUID REFERENCES onboarding_nodes(id) ON DELETE CASCADE;

-- Add metadata column if it doesn't exist
ALTER TABLE onboarding_progress 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create new unique constraint for node_id
CREATE UNIQUE INDEX IF NOT EXISTS unique_org_user_node 
  ON onboarding_progress(org_id, user_id, node_id) 
  WHERE node_id IS NOT NULL;

-- Keep old item_id constraint for backwards compatibility during migration
CREATE UNIQUE INDEX IF NOT EXISTS unique_org_user_item 
  ON onboarding_progress(org_id, user_id, item_id) 
  WHERE item_id IS NOT NULL;

-- ============================================================================
-- CONTRACT_SIGNATURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  node_id UUID NOT NULL REFERENCES onboarding_nodes(id) ON DELETE CASCADE,
  signed_name TEXT NOT NULL,
  signature_image_url TEXT NOT NULL,
  contract_sha256 TEXT,
  terms_version TEXT,
  privacy_version TEXT,
  ip TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_org_id ON onboarding_flows(org_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_flows_status ON onboarding_flows(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_nodes_flow_id ON onboarding_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_nodes_type ON onboarding_nodes(type);
CREATE INDEX IF NOT EXISTS idx_onboarding_nodes_order ON onboarding_nodes(flow_id, order_index);
CREATE INDEX IF NOT EXISTS idx_onboarding_edges_flow_id ON onboarding_edges(flow_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_edges_source ON onboarding_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_edges_target ON onboarding_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_node ON onboarding_progress(node_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_org_user ON contract_signatures(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_node ON contract_signatures(node_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_flows_updated_at
  BEFORE UPDATE ON onboarding_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_nodes_updated_at
  BEFORE UPDATE ON onboarding_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE onboarding_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- onboarding_flows: Admins can manage, members can view published
CREATE POLICY "Admins can manage onboarding flows"
  ON onboarding_flows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = onboarding_flows.org_id
        AND org_members.user_id = auth.uid()::text
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view published flows"
  ON onboarding_flows
  FOR SELECT
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = onboarding_flows.org_id
        AND org_members.user_id = auth.uid()::text
    )
  );

-- onboarding_nodes: Admins can manage, members can view published
CREATE POLICY "Admins can manage onboarding nodes"
  ON onboarding_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_flows
      JOIN org_members ON org_members.org_id = onboarding_flows.org_id
      WHERE onboarding_nodes.flow_id = onboarding_flows.id
        AND org_members.user_id = auth.uid()::text
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view published nodes"
  ON onboarding_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_flows
      JOIN org_members ON org_members.org_id = onboarding_flows.org_id
      WHERE onboarding_nodes.flow_id = onboarding_flows.id
        AND onboarding_flows.status = 'published'
        AND org_members.user_id = auth.uid()::text
    )
  );

-- onboarding_edges: Admins can manage
CREATE POLICY "Admins can manage onboarding edges"
  ON onboarding_edges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_flows
      JOIN org_members ON org_members.org_id = onboarding_flows.org_id
      WHERE onboarding_edges.flow_id = onboarding_flows.id
        AND org_members.user_id = auth.uid()::text
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- contract_signatures: Users see own, admins see all
CREATE POLICY "Users can view their own contract signatures"
  ON contract_signatures
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own contract signatures"
  ON contract_signatures
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all contract signatures in org"
  ON contract_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = contract_signatures.org_id
        AND org_members.user_id = auth.uid()::text
        AND org_members.role IN ('owner', 'admin')
    )
  );

