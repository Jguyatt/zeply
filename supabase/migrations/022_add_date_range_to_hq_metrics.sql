-- Update get_hq_metrics to accept optional date range parameters
-- If not provided, defaults to MTD (Month-to-Date)
CREATE OR REPLACE FUNCTION get_hq_metrics(
  p_workspace_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
  period_length INTERVAL;
  prev_period_start TIMESTAMPTZ;
  prev_period_end TIMESTAMPTZ;
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
  -- Use provided dates or default to MTD
  IF p_start_date IS NULL THEN
    period_start := date_trunc('month', NOW());
  ELSE
    period_start := p_start_date;
  END IF;
  
  IF p_end_date IS NULL THEN
    period_end := NOW();
  ELSE
    period_end := p_end_date;
  END IF;
  
  -- Revenue (Paid) - for the period
  SELECT COALESCE(SUM(amount_paid_cents), 0)
  INTO v_revenue_paid_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'paid'
    AND paid_at >= period_start
    AND paid_at <= period_end;
  
  -- Revenue for previous period (for delta calculation)
  -- Calculate previous period of same length
  period_length := period_end - period_start;
  prev_period_end := period_start;
  prev_period_start := period_start - period_length;
  
  SELECT COALESCE(SUM(amount_paid_cents), 0)
  INTO v_revenue_last_month_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'paid'
    AND paid_at >= prev_period_start
    AND paid_at < prev_period_end;
  
  -- Outstanding AR (open invoices) - always current, not filtered by period
  SELECT COALESCE(SUM(amount_due_cents), 0)
  INTO v_outstanding_ar_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'open';
  
  -- Overdue AR (open invoices past due date) - always current
  SELECT COALESCE(SUM(amount_due_cents), 0)
  INTO v_overdue_ar_cents
  FROM stripe_invoices
  WHERE workspace_id = p_workspace_id
    AND status = 'open'
    AND due_at IS NOT NULL
    AND due_at < NOW();
  
  -- COGS (cost events) - for the period
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_cogs_cents
  FROM cost_events
  WHERE workspace_id = p_workspace_id
    AND occurred_at >= period_start
    AND occurred_at <= period_end;
  
  -- Overhead costs - for the period
  -- Calculate which months overlap with the period
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_overhead_cents
  FROM monthly_overhead_costs
  WHERE workspace_id = p_workspace_id
    AND month >= date_trunc('month', period_start)::DATE
    AND month <= date_trunc('month', period_end)::DATE;
  
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
    'period_start', period_start,
    'period_end', period_end
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_top_clients_by_revenue to accept date range
CREATE OR REPLACE FUNCTION get_top_clients_by_revenue(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  revenue_cents BIGINT,
  invoice_count BIGINT
) AS $$
DECLARE
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
BEGIN
  -- Use provided dates or default to MTD
  IF p_start_date IS NULL THEN
    period_start := date_trunc('month', NOW());
  ELSE
    period_start := p_start_date;
  END IF;
  
  IF p_end_date IS NULL THEN
    period_end := NOW();
  ELSE
    period_end := p_end_date;
  END IF;

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
    AND si.paid_at >= period_start
    AND si.paid_at <= period_end
    AND si.client_id IS NOT NULL
  GROUP BY si.client_id, o.name
  ORDER BY revenue_cents DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_top_clients_by_cost to accept date range
CREATE OR REPLACE FUNCTION get_top_clients_by_cost(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  cost_cents BIGINT,
  event_count BIGINT
) AS $$
DECLARE
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
BEGIN
  -- Use provided dates or default to MTD
  IF p_start_date IS NULL THEN
    period_start := date_trunc('month', NOW());
  ELSE
    period_start := p_start_date;
  END IF;
  
  IF p_end_date IS NULL THEN
    period_end := NOW();
  ELSE
    period_end := p_end_date;
  END IF;

  RETURN QUERY
  SELECT 
    ce.client_id,
    o.name AS client_name,
    COALESCE(SUM(ce.amount_cents), 0) AS cost_cents,
    COUNT(*) AS event_count
  FROM cost_events ce
  LEFT JOIN orgs o ON o.id = ce.client_id
  WHERE ce.workspace_id = p_workspace_id
    AND ce.occurred_at >= period_start
    AND ce.occurred_at <= period_end
    AND ce.client_id IS NOT NULL
  GROUP BY ce.client_id, o.name
  ORDER BY cost_cents DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

