'use client';

import { useState } from 'react';
import HQFinancialMetrics from '@/app/components/HQFinancialMetrics';
import CompactStripeButton from '@/app/components/CompactStripeButton';
import DateRangePicker, { DateRange, calculateDateRange } from '@/app/components/DateRangePicker';

interface DashboardContentProps {
  userName: string;
  allOrgs: any[];
  agencyOrgs: any[];
  clientOrgs: any[];
  totalMembers: number;
  totalDeliverables: number;
  workspaceId: string | null;
  workspaceName: string | null;
  isStripeConnected: boolean;
}

export default function DashboardContent({ 
  userName, 
  allOrgs, 
  agencyOrgs, 
  clientOrgs, 
  totalMembers,
  totalDeliverables,
  workspaceId,
  workspaceName,
  isStripeConnected
}: DashboardContentProps) {
  // Initialize with MTD
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const { start, end } = calculateDateRange('mtd');
    return { start, end, preset: 'mtd' };
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Agency HQ</h1>
          <p className="text-sm text-text-secondary">Revenue, costs, and risk</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tiny stats */}
          <div className="flex items-center gap-3 text-xs text-text-muted mr-2">
            <span>{allOrgs.length} orgs</span>
            <span>•</span>
            <span>{totalMembers} members</span>
            <span>•</span>
            <span>{totalDeliverables} deliverables</span>
          </div>
          
          {/* Date range picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          
          {/* Stripe CTA - Coming Soon */}
          {workspaceId && (
            <CompactStripeButton workspaceId={workspaceId} />
          )}
        </div>
      </div>

      {/* Financial Metrics */}
      {workspaceId ? (
        <HQFinancialMetrics 
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          dateRange={dateRange}
        />
      ) : (
        <div className="rounded-2xl border border-border/45 bg-surface-1 p-8 text-center">
          <p className="text-text-secondary">Create or join an organization to view financial metrics</p>
        </div>
      )}
    </div>
  );
}

