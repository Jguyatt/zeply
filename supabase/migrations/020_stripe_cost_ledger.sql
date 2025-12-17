-- Stripe Connect + Cost Ledger Financial System Migration
-- Adds billing fields, cost tracking, and Stripe integration tables

-- 1. Add billing fields to orgs table
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS external_billing_ref TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Index for external_billing_ref lookups
CREATE INDEX IF NOT EXISTS idx_orgs_external_billing_ref ON orgs(external_billing_ref) WHERE external_billing_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_account_id ON orgs(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- 2. Create cost_events table
CREATE TABLE IF NOT EXISTS cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES orgs(id) ON DELETE SET NULL, -- null = overhead/unassigned
  source TEXT NOT NULL, -- 'openai', 'anthropic', 'tool', etc.
  category TEXT NOT NULL, -- 'api', 'storage', 'email', 'other'
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb, -- model, tokens, request_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cost_events
CREATE INDEX IF NOT EXISTS idx_cost_events_workspace_id ON cost_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cost_events_client_id ON cost_events(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_events_occurred_at ON cost_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_cost_events_source ON cost_events(source);
CREATE INDEX IF NOT EXISTS idx_cost_events_workspace_occurred ON cost_events(workspace_id, occurred_at);

-- 3. Create monthly_overhead_costs table
CREATE TABLE IF NOT EXISTS monthly_overhead_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- YYYY-MM-01 format
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  allocation_method TEXT NOT NULL DEFAULT 'manual' CHECK (allocation_method IN ('pro_rata_revenue', 'pro_rata_usage', 'manual')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, month)
);

-- Indexes for monthly_overhead_costs
CREATE INDEX IF NOT EXISTS idx_monthly_overhead_workspace_id ON monthly_overhead_costs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_monthly_overhead_month ON monthly_overhead_costs(month);
CREATE INDEX IF NOT EXISTS idx_monthly_overhead_workspace_month ON monthly_overhead_costs(workspace_id, month);

-- 4. Create stripe_accounts table
CREATE TABLE IF NOT EXISTS stripe_accounts (
  workspace_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stripe_accounts
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_account_id ON stripe_accounts(stripe_account_id);

-- 5. Create stripe_invoices table
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES orgs(id) ON DELETE SET NULL, -- from metadata or mapping
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount_paid_cents BIGINT NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  amount_due_cents BIGINT NOT NULL DEFAULT 0 CHECK (amount_due_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stripe_invoices
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_workspace_id ON stripe_invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_client_id ON stripe_invoices(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status ON stripe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_invoice_id ON stripe_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_paid_at ON stripe_invoices(paid_at) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_due_at ON stripe_invoices(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_workspace_status ON stripe_invoices(workspace_id, status);

-- 6. Create stripe_customer_mappings table (for existing invoices)
CREATE TABLE IF NOT EXISTS stripe_customer_mappings (
  workspace_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, stripe_customer_id)
);

-- Indexes for stripe_customer_mappings
CREATE INDEX IF NOT EXISTS idx_stripe_customer_mappings_workspace_id ON stripe_customer_mappings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_mappings_client_id ON stripe_customer_mappings(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_mappings_stripe_customer_id ON stripe_customer_mappings(stripe_customer_id);

-- RLS Policies
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_overhead_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customer_mappings ENABLE ROW LEVEL SECURITY;

-- Cost events: workspace members can view, owners/admins can insert
CREATE POLICY "Workspace members can view cost_events"
  ON cost_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = cost_events.workspace_id
      AND org_members.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Workspace owners and admins can insert cost_events"
  ON cost_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = cost_events.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Monthly overhead costs: workspace members can view, owners/admins can manage
CREATE POLICY "Workspace members can view monthly_overhead_costs"
  ON monthly_overhead_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = monthly_overhead_costs.workspace_id
      AND org_members.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Workspace owners and admins can manage monthly_overhead_costs"
  ON monthly_overhead_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = monthly_overhead_costs.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Stripe accounts: workspace owners/admins can view and manage
CREATE POLICY "Workspace owners and admins can view stripe_accounts"
  ON stripe_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_accounts.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can manage stripe_accounts"
  ON stripe_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_accounts.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Stripe invoices: workspace members can view, webhook can insert/update
CREATE POLICY "Workspace members can view stripe_invoices"
  ON stripe_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_invoices.workspace_id
      AND org_members.user_id::text = auth.uid()::text
    )
  );

-- Note: Webhook handler will use service role, so it bypasses RLS
-- For manual inserts/updates, owners/admins can manage
CREATE POLICY "Workspace owners and admins can manage stripe_invoices"
  ON stripe_invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_invoices.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Stripe customer mappings: workspace owners/admins can manage
CREATE POLICY "Workspace owners and admins can view stripe_customer_mappings"
  ON stripe_customer_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_customer_mappings.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can manage stripe_customer_mappings"
  ON stripe_customer_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = stripe_customer_mappings.workspace_id
      AND org_members.user_id::text = auth.uid()::text
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Trigger to update updated_at for monthly_overhead_costs
CREATE TRIGGER update_monthly_overhead_costs_updated_at
  BEFORE UPDATE ON monthly_overhead_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for stripe_accounts
CREATE TRIGGER update_stripe_accounts_updated_at
  BEFORE UPDATE ON stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for stripe_invoices
CREATE TRIGGER update_stripe_invoices_updated_at
  BEFORE UPDATE ON stripe_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: get_hq_metrics
-- Calculates financial metrics for HQ Dashboard
CREATE OR REPLACE FUNCTION get_hq_metrics(p_workspace_id UUID)
RETURNS JSONB AS $$
DECLARE
  mtd_start TIMESTAMPTZ;
  mtd_end TIMESTAMPTZ;
  v_revenue_paid_cents BIGINT;
  v_revenue_last_month_cents BIGINT;
  v_outstanding_ar_cents BIGINT;
  v_overdue_ar_cents BIGINT;
  v_cogs_cents BIGINT;
  v_overhead_cents BIGINT;
  v_gross_margin_pct NUMERIC;
  v_net_contribution_cents BIGINT;
  v_result JSONB;
BEGIN
  -- Calculate MTD range (start of current month to now)
  mtd_start := date_trunc('month', NOW());
  mtd_end := NOW();
  
  -- Revenue (Paid) - MTD
  SELECT COALESCE(SUM(amount_paid_cents), 0)
  INTO v_revenue_paid_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'paid'
    AND paid_at >= mtd_start
    AND paid_at <= mtd_end;
  
  -- Revenue last month (for delta calculation)
  SELECT COALESCE(SUM(amount_paid_cents), 0)
  INTO v_revenue_last_month_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'paid'
    AND paid_at >= (mtd_start - INTERVAL '1 month')
    AND paid_at < mtd_start;
  
  -- Outstanding AR (open invoices)
  SELECT COALESCE(SUM(amount_due_cents), 0)
  INTO v_outstanding_ar_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'open';
  
  -- Overdue AR (open invoices past due date)
  SELECT COALESCE(SUM(amount_due_cents), 0)
  INTO v_overdue_ar_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'open'
    AND due_at IS NOT NULL
    AND due_at < NOW();
  
  -- COGS (cost events + overhead) - MTD
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_cogs_cents
  FROM cost_events
  WHERE workspace_id = p_workspace_id
    AND occurred_at >= mtd_start
    AND occurred_at <= mtd_end;
  
  -- Overhead costs - MTD
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_overhead_cents
  FROM monthly_overhead_costs
  WHERE workspace_id = p_workspace_id
    AND month >= date_trunc('month', mtd_start)::DATE
    AND month < date_trunc('month', mtd_end + INTERVAL '1 month')::DATE;
  
  -- Total COGS
  v_cogs_cents := v_cogs_cents + v_overhead_cents;
  
  -- Gross Margin %
  IF v_revenue_paid_cents > 0 THEN
    v_gross_margin_pct := ROUND(((v_revenue_paid_cents - v_cogs_cents)::NUMERIC / v_revenue_paid_cents::NUMERIC * 100)::NUMERIC, 2);
  ELSE
    v_gross_margin_pct := 0;
  END IF;
  
  -- Net Contribution
  v_net_contribution_cents := v_revenue_paid_cents - v_cogs_cents;
  
  -- Build result JSON
  v_result := jsonb_build_object(
    'revenue_paid_cents', v_revenue_paid_cents,
    'revenue_last_month_cents', v_revenue_last_month_cents,
    'revenue_delta_cents', v_revenue_paid_cents - v_revenue_last_month_cents,
    'outstanding_ar_cents', v_outstanding_ar_cents,
    'overdue_ar_cents', v_overdue_ar_cents,
    'cogs_cents', v_cogs_cents,
    'overhead_cents', v_overhead_cents,
    'gross_margin_pct', v_gross_margin_pct,
    'net_contribution_cents', v_net_contribution_cents,
    'mtd_start', mtd_start,
    'mtd_end', mtd_end
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: get_top_clients_by_revenue
-- Returns top clients by revenue (MTD)
CREATE OR REPLACE FUNCTION get_top_clients_by_revenue(p_workspace_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  revenue_cents BIGINT,
  invoice_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.client_id,
    o.name AS client_name,
    COALESCE(SUM(si.amount_paid_cents), 0) AS revenue_cents,
    COUNT(*) AS invoice_count
  FROM stripe_invoices si
  LEFT JOIN orgs o ON o.id = si.client_id
  WHERE si.workspace_id = p_workspace_id
    AND si.status = 'paid'
    AND si.paid_at >= date_trunc('month', NOW())
    AND si.paid_at <= NOW()
    AND si.client_id IS NOT NULL
  GROUP BY si.client_id, o.name
  ORDER BY revenue_cents DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: get_top_clients_by_cost
-- Returns top clients by cost (MTD)
CREATE OR REPLACE FUNCTION get_top_clients_by_cost(p_workspace_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  cost_cents BIGINT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.client_id,
    o.name AS client_name,
    COALESCE(SUM(ce.amount_cents), 0) AS cost_cents,
    COUNT(*) AS event_count
  FROM cost_events ce
  LEFT JOIN orgs o ON o.id = ce.client_id
  WHERE ce.workspace_id = p_workspace_id
    AND ce.occurred_at >= date_trunc('month', NOW())
    AND ce.occurred_at <= NOW()
    AND ce.client_id IS NOT NULL
  GROUP BY ce.client_id, o.name
  ORDER BY cost_cents DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: get_at_risk_clients
-- Returns clients with negative margin, overdue AR, or no activity
CREATE OR REPLACE FUNCTION get_at_risk_clients(p_workspace_id UUID)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  revenue_cents BIGINT,
  cost_cents BIGINT,
  margin_cents BIGINT,
  overdue_ar_cents BIGINT,
  days_since_last_activity INTEGER,
  risk_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH client_metrics AS (
    SELECT 
      COALESCE(si.client_id, ce.client_id) AS client_id,
      COALESCE(SUM(CASE WHEN si.status = 'paid' AND si.paid_at >= date_trunc('month', NOW()) THEN si.amount_paid_cents ELSE 0 END), 0) AS revenue_cents,
      COALESCE(SUM(CASE WHEN ce.occurred_at >= date_trunc('month', NOW()) THEN ce.amount_cents ELSE 0 END), 0) AS cost_cents,
      COALESCE(SUM(CASE WHEN si.status = 'open' AND si.due_at IS NOT NULL AND si.due_at < NOW() THEN si.amount_due_cents ELSE 0 END), 0) AS overdue_ar_cents,
      MAX(GREATEST(
        COALESCE(si.paid_at, '1970-01-01'::timestamptz),
        COALESCE(ce.occurred_at, '1970-01-01'::timestamptz),
        COALESCE(d.published_at, '1970-01-01'::timestamptz)
      )) AS last_activity
    FROM orgs o
    LEFT JOIN stripe_invoices si ON si.client_id = o.id AND si.workspace_id = p_workspace_id
    LEFT JOIN cost_events ce ON ce.client_id = o.id AND ce.workspace_id = p_workspace_id
    LEFT JOIN deliverables d ON d.org_id = o.id AND d.published_at IS NOT NULL
    WHERE o.kind = 'client'
      AND EXISTS (
        SELECT 1 FROM agency_clients ac
        WHERE ac.client_org_id = o.id
        AND ac.agency_org_id = p_workspace_id
      )
    GROUP BY COALESCE(si.client_id, ce.client_id)
  )
  SELECT 
    cm.client_id,
    o.name AS client_name,
    cm.revenue_cents,
    cm.cost_cents,
    (cm.revenue_cents - cm.cost_cents) AS margin_cents,
    cm.overdue_ar_cents,
    CASE 
      WHEN cm.last_activity = '1970-01-01'::timestamptz THEN NULL
      ELSE EXTRACT(DAY FROM (NOW() - cm.last_activity))::INTEGER
    END AS days_since_last_activity,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN (cm.revenue_cents - cm.cost_cents) < 0 THEN 'negative_margin' ELSE NULL END,
      CASE WHEN cm.overdue_ar_cents > 0 THEN 'overdue_ar' ELSE NULL END,
      CASE WHEN cm.last_activity = '1970-01-01'::timestamptz OR EXTRACT(DAY FROM (NOW() - cm.last_activity)) > 14 THEN 'no_recent_activity' ELSE NULL END
    ], NULL) AS risk_reasons
  FROM client_metrics cm
  JOIN orgs o ON o.id = cm.client_id
  WHERE (cm.revenue_cents - cm.cost_cents) < 0
     OR cm.overdue_ar_cents > 0
     OR cm.last_activity = '1970-01-01'::timestamptz
     OR EXTRACT(DAY FROM (NOW() - cm.last_activity)) > 14
  ORDER BY 
    CASE WHEN (cm.revenue_cents - cm.cost_cents) < 0 THEN 1 ELSE 2 END,
    cm.overdue_ar_cents DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

