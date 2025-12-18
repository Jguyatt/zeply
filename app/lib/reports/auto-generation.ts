/**
 * Auto-generation logic for Tier 1 (Auto) reports
 * All logic is rule-based - no hallucinations, only use actual data
 */

import { createServiceClient } from '@/lib/supabase/server';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_to?: string;
  due_date?: string;
}

interface DeliverableUpdate {
  id: string;
  deliverable_id: string;
  stage: string;
  note?: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  deliverable_id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export async function generateSummaryBlock(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const supabase = createServiceClient();

  // Count deliverables created in period
  const { count: createdCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('archived', false)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  // Count deliverables completed/approved in period
  const { count: completedCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('archived', false)
    .in('status', ['complete', 'approved'])
    .gte('completed_at', periodStart)
    .lte('completed_at', periodEnd);

  // Get deliverable IDs for this org
  const { data: deliverableIds } = await supabase
    .from('deliverables')
    .select('id')
    .eq('org_id', orgId)
    .eq('archived', false);
  
  const deliverableIdArray = (deliverableIds || []).map((d: any) => d.id);
  
  // Count status changes (activity logs) in period
  const { count: statusChangeCount } = deliverableIdArray.length > 0
    ? await supabase
        .from('deliverable_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'status_change')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .in('deliverable_id', deliverableIdArray)
    : { count: 0 };

  // Find notable item: most active day or largest deliverable
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('title, created_at')
    .eq('org_id', orgId)
    .eq('archived', false)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .order('created_at', { ascending: false })
    .limit(1);

  const notableItem = deliverables && deliverables.length > 0 
    ? (deliverables[0] as any).title 
    : 'Not available';

  const bullets = [
    `${createdCount || 0} deliverables created`,
    `${completedCount || 0} deliverables completed`,
    notableItem !== 'Not available' ? `Notable: ${notableItem}` : 'Notable: Not available'
  ];

  return bullets.map(b => `• ${b}`).join('\n');
}

export async function generateMetricsBlock(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const supabase = createServiceClient();

  // Get all metrics for this org
  const { data: allMetrics } = await supabase
    .from('metrics')
    .select('*')
    .eq('org_id', orgId)
    .order('period_start', { ascending: false });

  if (!allMetrics || allMetrics.length === 0) {
    return 'No metrics data available for this period.';
  }

  // Filter metrics that overlap with the report period
  // A metric overlaps if: metric_start <= report_end AND metric_end >= report_start
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);
  
  const relevantMetrics = allMetrics.filter((m: any) => {
    const metricStart = new Date(m.period_start);
    const metricEnd = new Date(m.period_end);
    // Check if periods overlap: metric starts before report ends AND metric ends after report starts
    return metricStart <= periodEndDate && metricEnd >= periodStartDate;
  });

  if (relevantMetrics.length === 0) {
    return 'No metrics data available for this period.';
  }

  // Aggregate metrics across all relevant records
  const aggregated = {
    leads: relevantMetrics.reduce((sum: number, m: any) => sum + (m.leads || 0), 0),
    spend: relevantMetrics.reduce((sum: number, m: any) => sum + (Number(m.spend) || 0), 0),
    revenue: relevantMetrics.reduce((sum: number, m: any) => sum + (Number(m.revenue) || 0), 0),
    conversions: relevantMetrics.reduce((sum: number, m: any) => sum + (m.conversions || 0), 0),
    website_traffic: relevantMetrics.reduce((sum: number, m: any) => sum + (m.website_traffic || 0), 0),
  };

  // Calculate derived metrics
  const cpl = aggregated.leads > 0 ? Number((aggregated.spend / aggregated.leads).toFixed(2)) : null;
  const roas = aggregated.spend > 0 ? Number((aggregated.revenue / aggregated.spend).toFixed(2)) : null;
  const conversionRate = aggregated.website_traffic > 0 
    ? Number(((aggregated.conversions / aggregated.website_traffic) * 100).toFixed(2))
    : null;

  const metricsLines: string[] = [];

  if (aggregated.leads > 0) {
    metricsLines.push(`Leads/Bookings: ${aggregated.leads.toLocaleString()}`);
  }

  if (aggregated.spend > 0) {
    metricsLines.push(`Spend: $${aggregated.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (aggregated.revenue > 0) {
    metricsLines.push(`Revenue: $${aggregated.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (cpl !== null) {
    metricsLines.push(`CPL/CPA: $${cpl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (roas !== null) {
    metricsLines.push(`ROAS: ${roas}x`);
  }

  if (aggregated.conversions > 0) {
    metricsLines.push(`Conversions: ${aggregated.conversions.toLocaleString()}`);
  }

  if (aggregated.website_traffic > 0) {
    metricsLines.push(`Website Traffic: ${aggregated.website_traffic.toLocaleString()}`);
  }

  if (conversionRate !== null) {
    metricsLines.push(`Conversion Rate: ${conversionRate}%`);
  }

  if (metricsLines.length === 0) {
    return 'No metrics data available for this period.';
  }

  return metricsLines.map(line => `• ${line}`).join('\n');
}

export async function generateWorkBlock(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, type, completed_at, updated_at, status')
    .eq('org_id', orgId)
    .eq('archived', false)
    .in('status', ['complete', 'approved'])
    .or(`completed_at.gte.${periodStart},completed_at.lte.${periodEnd}`)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (!deliverables || deliverables.length === 0) {
    return 'No deliverables completed in this period.';
  }

  // Filter to only those actually completed in period
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);
  
  const completedInPeriod = deliverables.filter((d: any) => {
    const completedAt = d.completed_at ? new Date(d.completed_at) : null;
    const updatedAt = d.updated_at ? new Date(d.updated_at) : null;
    
    if (completedAt && completedAt >= periodStartDate && completedAt <= periodEndDate) {
      return true;
    }
    if (!completedAt && updatedAt && updatedAt >= periodStartDate && updatedAt <= periodEndDate) {
      return true;
    }
    return false;
  });

  if (completedInPeriod.length === 0) {
    return 'No deliverables completed in this period.';
  }

  return completedInPeriod.map((d: any) => {
    const date = d.completed_at || d.updated_at;
    const dateStr = date
      ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';
    return `- ${d.title} (${d.type}) - Completed ${dateStr} | [View Deliverable](/projects?deliverable=${d.id})`;
  }).join('\n');
}

export async function generateInsightsBlock(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const supabase = createServiceClient();

  // Get all deliverables in period
  const { data: allDeliverables } = await supabase
    .from('deliverables')
    .select('id, status, created_at, completed_at')
    .eq('org_id', orgId)
    .eq('archived', false)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const created = allDeliverables?.length || 0;
  
  // Count completed
  const completed = allDeliverables?.filter((d: any) => 
    ['complete', 'approved'].includes(d.status)
  ).length || 0;

  // Count in review
  const { count: inReviewCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('archived', false)
    .eq('status', 'in_review')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  // Count blocked
  const { count: blockedCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('archived', false)
    .eq('status', 'blocked')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  // Calculate completion rate
  const completionRate = created > 0 ? Math.round((completed / created) * 100) : 0;

  // Calculate average time to complete
  const completedDeliverables = allDeliverables?.filter((d: any) => 
    d.completed_at && ['complete', 'approved'].includes(d.status)
  ) || [];

  let avgDaysToComplete = 0;
  if (completedDeliverables.length > 0) {
    const totalDays = completedDeliverables.reduce((sum: number, d: any) => {
      const created = new Date(d.created_at);
      const completed = new Date(d.completed_at);
      const days = Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    avgDaysToComplete = Math.round(totalDays / completedDeliverables.length);
  }

  const insights: string[] = [];

  if (created > 0) {
    insights.push(`Completion rate: ${completionRate}% (${completed} of ${created} deliverables)`);
  } else {
    insights.push('Completion rate: Not available (no deliverables created)');
  }

  if (avgDaysToComplete > 0) {
    insights.push(`Average time to complete: ${avgDaysToComplete} days`);
  } else {
    insights.push('Average time to complete: Not available');
  }

  if (inReviewCount && inReviewCount > 0) {
    insights.push(`${inReviewCount} deliverable${inReviewCount !== 1 ? 's' : ''} in review`);
  }

  if (blockedCount && blockedCount > 0) {
    insights.push(`${blockedCount} deliverable${blockedCount !== 1 ? 's' : ''} blocked`);
  }

  // Add status distribution if available
  if (created > 0) {
    const statusCounts: Record<string, number> = {};
    allDeliverables?.forEach((d: any) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    const statusEntries = Object.entries(statusCounts).filter(([_, count]) => count > 0);
    if (statusEntries.length > 0) {
      const statusSummary = statusEntries.map(([status, count]) => `${status}: ${count}`).join(', ');
      insights.push(`Status distribution: ${statusSummary}`);
    }
  }

  // Limit to 5 insights max
  const finalInsights = insights.slice(0, 5);

  if (finalInsights.length === 0) {
    return 'No insights available for this period.';
  }

  return finalInsights.map(i => `• ${i}`).join('\n');
}

export async function generateNextStepsBlock(
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const supabase = createServiceClient();

  // Get unfinished deliverables
  const { data: unfinished } = await supabase
    .from('deliverables')
    .select('id, title, status, due_date, assigned_to')
    .eq('org_id', orgId)
    .eq('archived', false)
    .not('status', 'eq', 'complete')
    .not('status', 'eq', 'approved')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .limit(6);

  // Get deliverables in review
  const { data: inReview } = await supabase
    .from('deliverables')
    .select('id, title, due_date, assigned_to')
    .eq('org_id', orgId)
    .eq('archived', false)
    .eq('status', 'in_review')
    .limit(3);

  // Get deliverables with requested revisions
  const { data: revisionsRequested } = await supabase
    .from('deliverables')
    .select('id, title, due_date, assigned_to')
    .eq('org_id', orgId)
    .eq('archived', false)
    .eq('status', 'revisions_requested')
    .limit(3);

  const tasks: string[] = [];

  // Add unfinished deliverables
  unfinished?.forEach((d: any) => {
    const dueDate = d.due_date 
      ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Not set';
    const owner = d.assigned_to ? 'Assigned' : 'Unassigned';
    tasks.push(`Complete "${d.title}" | Owner: ${owner} | Due: ${dueDate}`);
  });

  // Add in review
  inReview?.forEach((d: any) => {
    const dueDate = d.due_date 
      ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Not set';
    const owner = d.assigned_to ? 'Assigned' : 'Unassigned';
    tasks.push(`Review "${d.title}" | Owner: ${owner} | Due: ${dueDate}`);
  });

  // Add revisions requested
  revisionsRequested?.forEach((d: any) => {
    const dueDate = d.due_date 
      ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Not set';
    const owner = d.assigned_to ? 'Assigned' : 'Unassigned';
    tasks.push(`Address revisions for "${d.title}" | Owner: ${owner} | Due: ${dueDate}`);
  });

  // Limit to 6 tasks max
  const finalTasks = tasks.slice(0, 6);

  if (finalTasks.length === 0) {
    return 'No next steps identified. All deliverables are on track.';
  }

  return finalTasks.map(t => `- ${t}`).join('\n');
}

