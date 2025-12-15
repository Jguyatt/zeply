-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGS TABLE
-- ============================================================================
-- Stores organizations (agencies and clients)
-- RLS ensures users can only access orgs they're members of
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('agency', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ORG_MEMBERS TABLE
-- ============================================================================
-- Junction table linking users to organizations with roles
-- Composite PK prevents duplicate memberships
-- RLS ensures users can only see memberships for orgs they belong to
CREATE TABLE org_members (
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Index for efficient lookups
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);

-- ============================================================================
-- AGENCY_CLIENTS TABLE
-- ============================================================================
-- Links agency orgs to their client orgs
-- RLS allows agency owners/admins to access linked client data
CREATE TABLE agency_clients (
  agency_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  client_org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agency_org_id, client_org_id),
  -- Prevent self-linking
  CHECK (agency_org_id != client_org_id)
);

-- Index for efficient lookups
CREATE INDEX idx_agency_clients_agency ON agency_clients(agency_org_id);
CREATE INDEX idx_agency_clients_client ON agency_clients(client_org_id);

-- ============================================================================
-- CONTRACTS TABLE (Example Product Table)
-- ============================================================================
-- Scoped to org_id - RLS ensures users can only access contracts
-- for orgs they're members of, or for client orgs linked to their agency
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient org-scoped queries
CREATE INDEX idx_contracts_org_id ON contracts(org_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGS RLS POLICIES
-- ============================================================================
-- Users can only see orgs they are members of
CREATE POLICY "Users can view orgs they are members of"
  ON orgs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
    )
  );

-- Only authenticated users can create orgs (will be agency on signup)
CREATE POLICY "Authenticated users can create orgs"
  ON orgs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update orgs they own or admin
CREATE POLICY "Owners and admins can update orgs"
  ON orgs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Only owners can delete orgs
CREATE POLICY "Only owners can delete orgs"
  ON orgs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );

-- ============================================================================
-- ORG_MEMBERS RLS POLICIES
-- ============================================================================
-- Users can see memberships for orgs they belong to
CREATE POLICY "Users can view members of their orgs"
  ON org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
    )
  );

-- Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON org_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_members.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update member roles (but not remove owner)
CREATE POLICY "Owners and admins can update member roles"
  ON org_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_members.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
    -- Prevent removing the last owner
    AND (
      role != 'owner' OR
      EXISTS (
        SELECT 1 FROM org_members om2
        WHERE om2.org_id = org_members.org_id
        AND om2.role = 'owner'
        AND om2.user_id != org_members.user_id
      )
    )
  );

-- Owners and admins can remove members (but not themselves if owner)
CREATE POLICY "Owners and admins can remove members"
  ON org_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_members.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
    -- Prevent owners from removing themselves
    AND (
      (SELECT role FROM org_members WHERE org_id = org_members.org_id AND user_id = auth.uid()) != 'owner' OR
      org_members.user_id != auth.uid()
    )
  );

-- ============================================================================
-- AGENCY_CLIENTS RLS POLICIES
-- ============================================================================
-- Agency owners/admins can view their client links
-- Client members can view which agency they're linked to
CREATE POLICY "Users can view agency-client links for their orgs"
  ON agency_clients FOR SELECT
  USING (
    -- Agency side: user is owner/admin of the agency org
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = agency_clients.agency_org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
    OR
    -- Client side: user is member of the client org
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = agency_clients.client_org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Only agency owners/admins can create client links
CREATE POLICY "Agency owners and admins can link clients"
  ON agency_clients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = agency_clients.agency_org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Only agency owners/admins can delete client links
CREATE POLICY "Agency owners and admins can unlink clients"
  ON agency_clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = agency_clients.agency_org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- CONTRACTS RLS POLICIES
-- ============================================================================
-- Users can view contracts for:
-- 1. Orgs they are members of
-- 2. Client orgs linked to their agency (if they're agency owner/admin)
CREATE POLICY "Users can view contracts for accessible orgs"
  ON contracts FOR SELECT
  USING (
    -- Direct membership
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = contracts.org_id
      AND org_members.user_id = auth.uid()
    )
    OR
    -- Agency access to linked client contracts
    EXISTS (
      SELECT 1 FROM agency_clients
      INNER JOIN org_members ON org_members.org_id = agency_clients.agency_org_id
      WHERE agency_clients.client_org_id = contracts.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Users can create contracts for orgs they're members of
CREATE POLICY "Users can create contracts for their orgs"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = contracts.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Users can update contracts for orgs they're members of
CREATE POLICY "Users can update contracts for their orgs"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = contracts.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Users can delete contracts for orgs they're members of
CREATE POLICY "Users can delete contracts for their orgs"
  ON contracts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = contracts.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate agency_clients org types
-- Ensures agency_org_id references an agency and client_org_id references a client
CREATE OR REPLACE FUNCTION validate_agency_client_types()
RETURNS TRIGGER AS $$
DECLARE
  agency_kind TEXT;
  client_kind TEXT;
BEGIN
  -- Get the kind of the agency org
  SELECT kind INTO agency_kind
  FROM orgs
  WHERE id = NEW.agency_org_id;

  -- Get the kind of the client org
  SELECT kind INTO client_kind
  FROM orgs
  WHERE id = NEW.client_org_id;

  -- Validate agency org is actually an agency
  IF agency_kind != 'agency' THEN
    RAISE EXCEPTION 'agency_org_id must reference an organization with kind ''agency''';
  END IF;

  -- Validate client org is actually a client
  IF client_kind != 'client' THEN
    RAISE EXCEPTION 'client_org_id must reference an organization with kind ''client''';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate agency_clients on insert/update
CREATE TRIGGER validate_agency_client_types_trigger
  BEFORE INSERT OR UPDATE ON agency_clients
  FOR EACH ROW
  EXECUTE FUNCTION validate_agency_client_types();

-- Trigger for contracts updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

