'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DateRange } from '@/app/components/DateRangePicker';

interface FinancialMetricsProps {
  workspaceId: string;
  workspaceName?: string | null;
  dateRange?: DateRange;
}

interface MetricsData {
  revenue_paid_cents: number;
  revenue_last_month_cents: number;
  revenue_delta_cents: number;
  outstanding_ar_cents: number;
  overdue_ar_cents: number;
  cogs_cents: number;
  overhead_cents: number;
  gross_margin_pct: number;
  net_contribution_cents: number;
}

interface TopClient {
  client_id: string;
  client_name: string;
  revenue_cents?: number;
  cost_cents?: number;
  margin_cents?: number;
  overdue_ar_cents?: number;
  days_since_last_activity?: number;
  risk_reasons?: string[];
}

interface KpiCardProps {
  title: string;
  value: string;
  delta?: string | null;
  icon?: React.ReactNode;
  subtitle?: string;
}

function KpiCard({ title, value, delta, icon, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border/45 bg-surface-1 p-5">
      <div className="flex items-center justify-between mb-2">
        {icon && <div className="text-accent">{icon}</div>}
        {subtitle && <span className="text-xs font-medium text-text-secondary">{subtitle}</span>}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-text-primary tabular-nums mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-text-secondary mb-1">{title}</div>
      {delta && (
        <div className="text-xs font-medium text-success">{delta}</div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/45 bg-surface-1 p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function HQFinancialMetrics({ workspaceId, workspaceName, dateRange }: FinancialMetricsProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:72',message:'HQFinancialMetrics component rendered',data:{workspaceId,workspaceName,hasDateRange:!!dateRange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [topRevenueClients, setTopRevenueClients] = useState<TopClient[]>([]);
  const [topCostClients, setTopCostClients] = useState<TopClient[]>([]);
  const [atRiskClients, setAtRiskClients] = useState<TopClient[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:81',message:'useEffect triggered - about to call loadMetrics',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    loadMetrics();
  }, [workspaceId, dateRange]);

  const loadMetrics = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:85',message:'loadMetrics called',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Prepare date range parameters
      const rpcParams: any = { p_workspace_id: workspaceId };
      if (dateRange) {
        rpcParams.p_start_date = dateRange.start.toISOString();
        rpcParams.p_end_date = dateRange.end.toISOString();
      }

      // Get main metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_hq_metrics', rpcParams);

      if (metricsError) throw metricsError;
      setMetrics(metricsData as MetricsData);

      // Get top clients by revenue
      const revenueParams: any = { 
        p_workspace_id: workspaceId, 
        p_limit: 5 
      };
      if (dateRange) {
        revenueParams.p_start_date = dateRange.start.toISOString();
        revenueParams.p_end_date = dateRange.end.toISOString();
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:115',message:'About to call get_top_clients_by_revenue RPC',data:{revenueParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { data: revenueClients, error: revenueError } = await supabase
        .rpc('get_top_clients_by_revenue', revenueParams);

      if (!revenueError && revenueClients) {
        setTopRevenueClients(revenueClients as TopClient[]);
      }

      // Get top clients by cost
      const costParams: any = { 
        p_workspace_id: workspaceId, 
        p_limit: 5 
      };
      if (dateRange) {
        costParams.p_start_date = dateRange.start.toISOString();
        costParams.p_end_date = dateRange.end.toISOString();
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:131',message:'About to call get_top_clients_by_cost RPC',data:{costParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { data: costClients, error: costError } = await supabase
        .rpc('get_top_clients_by_cost', costParams);

      if (!costError && costClients) {
        setTopCostClients(costClients as TopClient[]);
      }

      // Get at-risk clients (doesn't use date range - always current)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HQFinancialMetrics.tsx:139',message:'About to call get_at_risk_clients RPC',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { data: atRisk, error: atRiskError } = await (supabase
        .rpc as any)('get_at_risk_clients', { p_workspace_id: workspaceId });

      if (!atRiskError && atRisk) {
        setAtRiskClients((atRisk as TopClient[]).slice(0, 5));
      }

      // Get overdue invoices (clients with overdue AR)
      if (metricsData && (metricsData as MetricsData).overdue_ar_cents > 0) {
        const { data: overdueData } = await supabase
          .rpc('get_top_clients_by_revenue', revenueParams);
        
        if (overdueData) {
          const overdue = (overdueData as TopClient[]).filter(
            (c: TopClient) => (c.overdue_ar_cents || 0) > 0
          ).slice(0, 5);
          setOverdueInvoices(overdue);
        }
      }
    } catch (err: any) {
      console.error('Error loading financial metrics:', err);
      setError(err.message || 'Failed to load financial metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDelta = (delta: number) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    return `${isPositive ? '+' : ''}${formatCurrency(Math.abs(delta))}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/45 bg-surface-1 p-5 animate-pulse">
              <div className="h-8 bg-surface-2 rounded mb-2"></div>
              <div className="h-6 bg-surface-2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-border/45 bg-surface-1 p-6">
        <div className="text-danger text-sm">
          {error || 'Failed to load financial metrics'}
        </div>
      </div>
    );
  }

  const revenueDelta = formatDelta(metrics.revenue_delta_cents);
  const netContributionDelta = metrics.net_contribution_cents >= 0 
    ? `+${formatCurrency(metrics.net_contribution_cents)}`
    : formatCurrency(metrics.net_contribution_cents);

  // Get period label
  const getPeriodLabel = () => {
    if (!dateRange) return 'MTD';
    const presetLabels: Record<string, string> = {
      'mtd': 'MTD',
      'qtd': 'QTD',
      'ytd': 'YTD',
      'last30': 'Last 30d',
      'last90': 'Last 90d',
      'custom': 'Custom'
    };
    return presetLabels[dateRange.preset] || 'MTD';
  };

  const periodLabel = getPeriodLabel();

  return (
    <div className="space-y-6">
      {/* Row 1: Finance Hero - 4 KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Revenue (Paid) - with Net Contribution underneath */}
        <div className="rounded-2xl border border-border/45 bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-accent" />
            <span className="text-xs font-medium text-text-secondary">{periodLabel}</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-text-primary tabular-nums mb-1">
            {formatCurrency(metrics.revenue_paid_cents)}
          </div>
          <div className="text-sm font-medium text-text-secondary mb-1">Revenue (Paid)</div>
          {revenueDelta && (
            <div className="text-xs font-medium text-success mb-2">{revenueDelta}</div>
          )}
          {/* Net Contribution as smaller line */}
          <div className="pt-2 border-t border-border/30">
            <div className="text-xs text-text-muted mb-0.5">Net Contribution</div>
            <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">
              {formatCurrency(metrics.net_contribution_cents)}
            </div>
          </div>
        </div>

        {/* COGS */}
        <KpiCard
          title="COGS"
          value={formatCurrency(metrics.cogs_cents)}
          delta={null}
          icon={<TrendingDown className="w-5 h-5" />}
          subtitle={periodLabel}
        />

        {/* Gross Margin %} */}
        <KpiCard
          title="Gross Margin"
          value={`${metrics.gross_margin_pct.toFixed(1)}%`}
          delta={null}
          icon={<TrendingUp className="w-5 h-5" />}
        />

        {/* Outstanding AR */}
        <div className="rounded-2xl border border-border/45 bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 text-accent" />
            {metrics.overdue_ar_cents > 0 && (
              <span className="text-xs font-medium text-danger">Overdue</span>
            )}
          </div>
          <div className="text-3xl font-semibold tracking-tight text-text-primary tabular-nums mb-1">
            {formatCurrency(metrics.outstanding_ar_cents)}
          </div>
          <div className="text-sm font-medium text-text-secondary mb-1">Outstanding AR</div>
          {metrics.overdue_ar_cents > 0 && (
            <div className="text-xs font-medium text-danger">
              {formatCurrency(metrics.overdue_ar_cents)} overdue
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Visual + Risk */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Chart - Left (big) */}
        <div className="xl:col-span-2 rounded-2xl border border-border/45 bg-surface-1 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-primary">Revenue vs COGS</h2>
            <span className="text-xs text-text-muted">Last 30 days</span>
          </div>
          {/* Chart placeholder */}
          <div className="h-[260px] rounded-xl bg-black/20 flex items-center justify-center">
            <p className="text-sm text-text-muted">Chart coming soon</p>
          </div>
        </div>

        {/* At-Risk Clients - Right (small) */}
        <div className="rounded-2xl border border-border/45 bg-surface-1 p-5">
          <h2 className="text-sm font-medium text-text-primary mb-1">At-Risk Clients</h2>
          <p className="text-xs text-text-muted mb-4">Negative margin, overdue AR, or no activity</p>
          <div className="space-y-3">
            {atRiskClients.length > 0 ? (
              atRiskClients.map((client) => (
                <div key={client.client_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {client.client_name || 'Unknown'}
                      </div>
                    </div>
                    <div className={`text-xs font-medium ml-4 tabular-nums ${
                      (client.margin_cents || 0) < 0 ? 'text-danger' : 'text-warning'
                    }`}>
                      {formatCurrency(Math.abs(client.margin_cents || 0))}
                    </div>
                  </div>
                  {client.risk_reasons && client.risk_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.risk_reasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-danger/20 text-danger rounded border border-danger/30"
                        >
                          {reason === 'negative_margin' && 'Negative Margin'}
                          {reason === 'overdue_ar' && 'Overdue AR'}
                          {reason === 'no_recent_activity' && 'No Activity'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-black/20 p-3 text-sm text-text-secondary">
                No at-risk clients
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Top Clients by Revenue */}
        <Panel title="Top Clients by Revenue">
          {topRevenueClients.length > 0 ? (
            <div className="space-y-3">
              {topRevenueClients.map((client) => (
                <div key={client.client_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {client.client_name || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-sm text-text-primary font-medium ml-4 tabular-nums">
                    {formatCurrency(client.revenue_cents || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No revenue data yet</p>
          )}
        </Panel>

        {/* Top Clients by Cost */}
        <Panel title="Top Clients by Cost">
          {topCostClients.length > 0 ? (
            <div className="space-y-3">
              {topCostClients.map((client) => (
                <div key={client.client_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {client.client_name || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-sm text-text-primary font-medium ml-4 tabular-nums">
                    {formatCurrency(client.cost_cents || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No cost data yet</p>
          )}
        </Panel>

        {/* Overdue Invoices */}
        <Panel title="Overdue Invoices">
          {overdueInvoices.length > 0 ? (
            <div className="space-y-3">
              {overdueInvoices.map((client) => (
                <div key={client.client_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {client.client_name || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-sm text-danger font-medium ml-4 tabular-nums">
                    {formatCurrency(client.overdue_ar_cents || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No overdue invoices</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
