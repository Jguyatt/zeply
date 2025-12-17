'use client';

import { useState, useEffect } from 'react';
import { getMetrics } from '@/app/actions/metrics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsData {
  leads?: number;
  spend?: number;
  revenue?: number;
  roas?: number;
  cpl?: number;
  website_traffic?: number;
  conversions?: number;
  conversion_rate?: number;
}

interface MetricsPopulatorProps {
  orgId: string;
  periodStart?: string;
  periodEnd?: string;
  onMetricsLoaded?: (metrics: MetricsData | null) => void;
}

export default function MetricsPopulator({
  orgId,
  periodStart,
  periodEnd,
  onMetricsLoaded,
}: MetricsPopulatorProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId && periodStart && periodEnd) {
      loadMetrics();
    } else {
      setLoading(false);
      setMetrics(null);
      onMetricsLoaded?.(null);
    }
  }, [orgId, periodStart, periodEnd]);

  const loadMetrics = async () => {
    if (!periodStart || !periodEnd) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getMetrics(orgId, periodStart, periodEnd);
      
      if (result.error) {
        setError(result.error);
        setMetrics(null);
        onMetricsLoaded?.(null);
        return;
      }

      // Aggregate metrics if multiple records exist
      const metricsList = result.data || [];
      if (metricsList.length === 0) {
        setMetrics(null);
        onMetricsLoaded?.(null);
        return;
      }

      // Sum up metrics across the period
      const aggregated: MetricsData = {
        leads: metricsList.reduce((sum: number, m: any) => sum + (m.leads || 0), 0),
        spend: metricsList.reduce((sum: number, m: any) => sum + (Number(m.spend) || 0), 0),
        revenue: metricsList.reduce((sum: number, m: any) => sum + (Number(m.revenue) || 0), 0),
        website_traffic: metricsList.reduce((sum: number, m: any) => sum + (m.website_traffic || 0), 0),
        conversions: metricsList.reduce((sum: number, m: any) => sum + (m.conversions || 0), 0),
      };

      // Calculate derived metrics
      aggregated.cpl = aggregated.leads > 0 
        ? Number((aggregated.spend! / aggregated.leads).toFixed(2))
        : undefined;
      
      aggregated.roas = aggregated.spend! > 0
        ? Number((aggregated.revenue! / aggregated.spend!).toFixed(2))
        : undefined;

      aggregated.conversion_rate = aggregated.website_traffic! > 0
        ? Number(((aggregated.conversions! / aggregated.website_traffic!) * 100).toFixed(2))
        : undefined;

      setMetrics(aggregated);
      onMetricsLoaded?.(aggregated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      setMetrics(null);
      onMetricsLoaded?.(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-surface-1 border border-border/45">
        <p className="text-sm text-text-secondary">Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-surface-1 border border-danger/30 bg-danger/10">
        <p className="text-sm text-danger">Error loading metrics: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 rounded-2xl bg-surface-1 border border-border/45">
        <p className="text-sm text-text-secondary">No metrics data available for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Leads */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">Leads</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{formatNumber(metrics.leads)}</div>
        </div>

        {/* Spend */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">Spend</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{formatCurrency(metrics.spend)}</div>
        </div>

        {/* ROAS */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">ROAS</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">
            {metrics.roas ? `${metrics.roas}x` : '-'}
          </div>
        </div>

        {/* CPL */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">CPL</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{formatCurrency(metrics.cpl)}</div>
        </div>

        {/* Conversions */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">Conversions</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{formatNumber(metrics.conversions)}</div>
        </div>

        {/* Traffic */}
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">Traffic</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{formatNumber(metrics.website_traffic)}</div>
        </div>
      </div>

      {metrics.conversion_rate !== undefined && (
        <div className="rounded-2xl bg-surface-1 border border-border/45 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4">
          <div className="text-xs font-medium text-text-secondary mb-1">Conversion Rate</div>
          <div className="text-lg font-semibold tracking-tight text-text-primary tabular-nums">{metrics.conversion_rate}%</div>
        </div>
      )}
    </div>
  );
}

