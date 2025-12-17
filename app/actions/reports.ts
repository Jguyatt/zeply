/**
 * Server Actions for Reports Management
 */

'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function getReports(orgId: string, includeDrafts: boolean = true) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('reports')
    .select('*, report_sections(*)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data: reports, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // Sort sections by order_index
  const reportsWithSortedSections = (reports || []).map((report: any) => ({
    ...report,
    report_sections: (report.report_sections || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  return { data: reportsWithSortedSections };
}

export async function getReport(reportId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select('*, report_sections(*), report_kpi_snapshots(*), report_csv_data(*)')
    .eq('id', reportId)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Sort sections by order_index
  const sortedReport: any = {
    ...(report as any),
    report_sections: ((report as any).report_sections || []).sort((a: any, b: any) => a.order_index - b.order_index),
  };

  return { data: sortedReport };
}

export async function createReport(
  orgId: string,
  data: {
    title: string;
    summary?: string;
    period_start?: string;
    period_end?: string;
    status?: 'draft' | 'published';
    client_visible?: boolean;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner in this org (members cannot create reports)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can create reports' };
  }

  const { data: report, error } = await (supabase
    .from('reports') as any)
    .insert({
      org_id: orgId,
      title: data.title,
      summary: data.summary,
      period_start: data.period_start,
      period_end: data.period_end,
      status: data.status || 'draft',
      client_visible: data.client_visible !== undefined ? data.client_visible : true,
      created_by: userId,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/reports`);
  return { data: report };
}

export async function updateReport(
  reportId: string,
  data: {
    title?: string;
    summary?: string;
    period_start?: string;
    period_end?: string;
    status?: 'draft' | 'published';
    client_visible?: boolean;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get report to check org_id
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  if (!report) {
    return { error: 'Report not found' };
  }

  // Verify user is admin/owner in this org (members cannot update reports)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (report as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update reports' };
  }

  const updateData: any = { ...data };

  // If status is being changed to published, set published_at
  if (data.status === 'published') {
    // Check if it was previously unpublished
    const { data: existing } = await supabase
      .from('reports')
      .select('published_at')
      .eq('id', reportId)
      .single();

    if (!(existing as any)?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data: updatedReport, error } = await (supabase
    .from('reports') as any)
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(report as any).org_id}/reports`);
  return { data: updatedReport };
}

export async function deleteReport(reportId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get org_id before deleting for revalidation
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  if (!report) {
    return { error: 'Report not found' };
  }

  // Verify user is admin/owner in this org (members cannot delete reports)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (report as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can delete reports' };
  }

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    return { error: error.message };
  }

  if (report) {
    revalidatePath(`/${(report as any).org_id}/reports`);
  }

  return { data: { success: true } };
}

export async function createReportSection(
  reportId: string,
  data: {
    section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom';
    title?: string;
    content: string;
    order_index?: number;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: section, error } = await (supabase
    .from('report_sections') as any)
    .insert({
      report_id: reportId,
      section_type: data.section_type,
      title: data.title,
      content: data.content,
      order_index: data.order_index || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get report to revalidate correct path
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  if (report) {
    revalidatePath(`/${(report as any).org_id}/reports`);
  }

  return { data: section };
}

export async function updateReportSection(
  sectionId: string,
  data: {
    title?: string;
    content?: string;
    order_index?: number;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // FIX: Force cast to 'any' to avoid type 'never' error on update
  const { data: section, error } = await (supabase
    .from('report_sections') as any)
    .update(data)
    .eq('id', sectionId)
    .select('report_id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get report to revalidate correct path
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', section.report_id)
    .single();

  if (report) {
    revalidatePath(`/${(report as any).org_id}/reports`);
  }

  return { data: section };
}

export async function deleteReportSection(sectionId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get report_id before deleting
  const { data: section } = await supabase
    .from('report_sections')
    .select('report_id')
    .eq('id', sectionId)
    .single();

  const { error } = await supabase
    .from('report_sections')
    .delete()
    .eq('id', sectionId);

  if (error) {
    return { error: error.message };
  }

  if (section) {
    // Get report to revalidate correct path
    const { data: report } = await supabase
      .from('reports')
      .select('org_id')
      .eq('id', (section as any).report_id) // FIX: Cast 'section' to any to avoid type error
      .single();

    if (report) {
      revalidatePath(`/${(report as any).org_id}/reports`);
    }
  }

  return { data: { success: true } };
}

export async function getMetricsForPeriod(orgId: string, periodStart: string, periodEnd: string) {
  const { getMetrics } = await import('@/app/actions/metrics');
  return await getMetrics(orgId, periodStart, periodEnd);
}

export async function getCompletedDeliverablesForPeriod(
  orgId: string,
  periodStart: string,
  periodEnd: string
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user has access to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Query for completed or approved deliverables in the period
  // Check both completed_at and updated_at to catch deliverables that were completed during the period
  const { data: deliverables, error } = await supabase
    .from('deliverables')
    .select('id, title, type, status, completed_at, updated_at, client_visible')
    .eq('org_id', orgId)
    .eq('archived', false)
    .in('status', ['complete', 'approved'])
    .or(`completed_at.gte.${periodStart},completed_at.lte.${periodEnd},and(completed_at.is.null,updated_at.gte.${periodStart},updated_at.lte.${periodEnd})`)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Filter to only include deliverables that were actually completed/updated within the period
  const filtered = (deliverables || []).filter((deliverable: any) => {
    const completedAt = deliverable.completed_at ? new Date(deliverable.completed_at) : null;
    const updatedAt = deliverable.updated_at ? new Date(deliverable.updated_at) : null;
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);

    // If completed_at exists and is in period, include it
    if (completedAt && completedAt >= periodStartDate && completedAt <= periodEndDate) {
      return true;
    }

    // If no completed_at but updated_at is in period and status is complete/approved, include it
    if (!completedAt && updatedAt && updatedAt >= periodStartDate && updatedAt <= periodEndDate) {
      return true;
    }

    return false;
  });

  return { data: filtered };
}

// ============================================================================
// Report Generation Functions
// ============================================================================

export async function generateAutoReport(
  orgId: string,
  periodStart: string,
  periodEnd: string
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can generate reports' };
  }

  // Calculate period length
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const periodLengthDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Generate title
  const title = `Auto Report - ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Import auto-generation functions
  const {
    generateSummaryBlock,
    generateWorkBlock,
    generateInsightsBlock,
    generateNextStepsBlock,
    generateMetricsBlock,
  } = await import('@/app/lib/reports/auto-generation');

  // Generate blocks
  const summaryContent = await generateSummaryBlock(orgId, periodStart, periodEnd);
  const workContent = await generateWorkBlock(orgId, periodStart, periodEnd);
  const insightsContent = await generateInsightsBlock(orgId, periodStart, periodEnd);
  const nextStepsContent = await generateNextStepsBlock(orgId, periodStart, periodEnd);
  const metricsContent = await generateMetricsBlock(orgId, periodStart, periodEnd);

  // Create report
  const { data: report, error: reportError } = await (supabase
    .from('reports') as any)
    .insert({
      org_id: orgId,
      title,
      period_start: periodStart,
      period_end: periodEnd,
      tier: 'auto',
      version: 1,
      period_length_days: periodLengthDays,
      generated_at: new Date().toISOString(),
      status: 'draft',
      client_visible: true,
      created_by: userId,
    })
    .select()
    .single();

  if (reportError) {
    return { error: reportError.message };
  }

  // Create blocks
  const blocks = [
    {
      report_id: report.id,
      section_type: 'summary',
      block_type: 'summary',
      title: 'Summary',
      content: summaryContent,
      order_index: 0,
      is_auto_generated: true,
    },
    {
      report_id: report.id,
      section_type: 'kpis',
      block_type: 'metrics',
      title: 'Performance Metrics',
      content: metricsContent,
      order_index: 1,
      is_auto_generated: true,
    },
    {
      report_id: report.id,
      section_type: 'proof_of_work',
      block_type: 'work',
      title: 'Work Completed',
      content: workContent,
      order_index: 2,
      is_auto_generated: true,
    },
    {
      report_id: report.id,
      section_type: 'insights',
      block_type: 'insights',
      title: 'Insights',
      content: insightsContent,
      order_index: 3,
      is_auto_generated: true,
    },
    {
      report_id: report.id,
      section_type: 'next_steps',
      block_type: 'next_steps',
      title: 'Next Steps',
      content: nextStepsContent,
      order_index: 4,
      is_auto_generated: true,
    },
  ];

  const { error: blocksError } = await (supabase
    .from('report_sections') as any)
    .insert(blocks);

  if (blocksError) {
    return { error: blocksError.message };
  }

  // Fetch full report with blocks
  const { data: fullReport } = await supabase
    .from('reports')
    .select('*, report_sections(*)')
    .eq('id', report.id)
    .single();

  revalidatePath(`/${orgId}/reports`);
  return { data: fullReport };
}

export async function generateKpiReport(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  kpiData: {
    leads: number;
    spend?: number;
    revenue?: number;
    notes?: string;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can generate reports' };
  }

  // Calculate period length
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const periodLengthDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate KPIs
  const cpl = kpiData.spend && kpiData.leads > 0 
    ? Number((kpiData.spend / kpiData.leads).toFixed(2))
    : null;
  const roas = kpiData.spend && kpiData.revenue && kpiData.spend > 0
    ? Number((kpiData.revenue / kpiData.spend).toFixed(2))
    : null;

  // Find previous period report
  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodLengthDays);
  const previousPeriodEnd = new Date(startDate);

  const { data: previousReport } = await (supabase
    .from('reports') as any)
    .select('id, report_kpi_snapshots(*)')
    .eq('org_id', orgId)
    .eq('tier', 'kpi')
    .eq('period_length_days', periodLengthDays)
    .gte('period_end', previousPeriodStart.toISOString())
    .lte('period_start', previousPeriodEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Calculate deltas
  let deltaLeads: number | null = null;
  let deltaSpend: number | null = null;
  let deltaRevenue: number | null = null;

  if (previousReport && (previousReport as any).report_kpi_snapshots && (previousReport as any).report_kpi_snapshots.length > 0) {
    const prevSnapshot = (previousReport as any).report_kpi_snapshots[0];
    if (prevSnapshot.leads !== null) {
      deltaLeads = kpiData.leads - (prevSnapshot.leads || 0);
    }
    if (prevSnapshot.spend !== null && kpiData.spend !== undefined) {
      deltaSpend = kpiData.spend - (prevSnapshot.spend || 0);
    }
    if (prevSnapshot.revenue !== null && kpiData.revenue !== undefined) {
      deltaRevenue = kpiData.revenue - (prevSnapshot.revenue || 0);
    }
  }

  // Generate title
  const title = `KPI Check-in - ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Create report
  const { data: report, error: reportError } = await (supabase
    .from('reports') as any)
    .insert({
      org_id: orgId,
      title,
      period_start: periodStart,
      period_end: periodEnd,
      tier: 'kpi',
      version: 1,
      period_length_days: periodLengthDays,
      generated_at: new Date().toISOString(),
      status: 'draft',
      client_visible: true,
      created_by: userId,
    })
    .select()
    .single();

  if (reportError) {
    return { error: reportError.message };
  }

  // Create KPI snapshot
  const { error: snapshotError } = await (supabase
    .from('report_kpi_snapshots') as any)
    .insert({
      report_id: report.id,
      leads: kpiData.leads,
      spend: kpiData.spend || null,
      revenue: kpiData.revenue || null,
      cpl,
      roas,
      delta_leads: deltaLeads,
      delta_spend: deltaSpend,
      delta_revenue: deltaRevenue,
      notes: kpiData.notes || null,
    });

  if (snapshotError) {
    return { error: snapshotError.message };
  }

  // Generate Performance block
  const performanceContent = `LEADS: ${kpiData.leads}${deltaLeads !== null ? ` (${deltaLeads >= 0 ? '+' : ''}${deltaLeads})` : ''}
${kpiData.spend !== undefined ? `SPEND: $${kpiData.spend.toLocaleString()}${deltaSpend !== null ? ` (${deltaSpend >= 0 ? '+' : ''}$${deltaSpend.toLocaleString()})` : ''}` : 'SPEND: Not available'}
${kpiData.revenue !== undefined ? `REVENUE: $${kpiData.revenue.toLocaleString()}${deltaRevenue !== null ? ` (${deltaRevenue >= 0 ? '+' : ''}$${deltaRevenue.toLocaleString()})` : ''}` : 'REVENUE: Not available'}
${cpl !== null ? `CPL: $${cpl.toLocaleString()}` : 'CPL: Not available'}
${roas !== null ? `ROAS: ${roas}x` : 'ROAS: Not available'}
${kpiData.notes ? `\nNOTES: ${kpiData.notes}` : ''}`;

  // Create Performance block
  const { error: blockError } = await (supabase
    .from('report_sections') as any)
    .insert({
      report_id: report.id,
      section_type: 'metrics',
      block_type: 'performance',
      title: 'Performance',
      content: performanceContent,
      order_index: 0,
      is_auto_generated: true,
    });

  if (blockError) {
    return { error: blockError.message };
  }

  // Fetch full report with blocks and snapshot
  const { data: fullReport } = await (supabase
    .from('reports') as any)
    .select('*, report_sections(*), report_kpi_snapshots(*)')
    .eq('id', report.id)
    .single();

  revalidatePath(`/${orgId}/reports`);
  return { data: fullReport };
}

export async function generateCsvReport(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  csvFile: File
): Promise<{ data?: any; error?: string }> {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can generate reports' };
  }

  // Parse CSV
  const csvText = await csvFile.text();
  let records: any[];
  let headers: string[];

  try {
    const { parse } = await import('csv-parse/sync');
    const parsed = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    records = parsed;
    headers = Object.keys(records[0] || {});
  } catch (error) {
    return { error: 'Failed to parse CSV file' };
  }

  // Normalize headers (lowercase, strip spaces)
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const columnMapping: Record<string, string> = {};
  
  // Map synonyms
  const leadSynonyms = ['conversions', 'leads', 'results', 'conversion'];
  const spendSynonyms = ['cost', 'spend', 'costs'];
  const revenueSynonyms = ['value', 'conv_value', 'revenue', 'revenues'];
  const dateSynonyms = ['day', 'date', 'timestamp', 'time'];

  let leadsColumn: string | null = null;
  let spendColumn: string | null = null;
  let revenueColumn: string | null = null;
  let dateColumn: string | null = null;

  normalizedHeaders.forEach((normalized, index) => {
    const original = headers[index];
    columnMapping[normalized] = original;

    if (leadSynonyms.some(syn => normalized.includes(syn)) && !leadsColumn) {
      leadsColumn = normalized;
    }
    if (spendSynonyms.some(syn => normalized.includes(syn)) && !spendColumn) {
      spendColumn = normalized;
    }
    if (revenueSynonyms.some(syn => normalized.includes(syn)) && !revenueColumn) {
      revenueColumn = normalized;
    }
    if (dateSynonyms.some(syn => normalized.includes(syn)) && !dateColumn) {
      dateColumn = normalized;
    }
  });

  // Aggregate totals
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);

  let totalLeads = 0;
  let totalSpend = 0;
  let totalRevenue = 0;
  const dateSeries: Array<{ date: string; leads: number; spend: number; revenue: number }> = [];

  records.forEach((record: any) => {
    // Check if date is in period
    let recordDate: Date | null = null;
    if (dateColumn && record[columnMapping[dateColumn]]) {
      try {
        recordDate = new Date(record[columnMapping[dateColumn]]);
      } catch (e) {
        // Invalid date, skip date filtering
      }
    }

    // If date column exists and date is outside period, skip
    if (dateColumn && recordDate) {
      if (recordDate < periodStartDate || recordDate > periodEndDate) {
        return;
      }
    }

    // Aggregate totals
    if (leadsColumn && record[columnMapping[leadsColumn]]) {
      const leads = parseInt(record[columnMapping[leadsColumn]]) || 0;
      totalLeads += leads;
    }
    if (spendColumn && record[columnMapping[spendColumn]]) {
      const spend = parseFloat(record[columnMapping[spendColumn]]) || 0;
      totalSpend += spend;
    }
    if (revenueColumn && record[columnMapping[revenueColumn]]) {
      const revenue = parseFloat(record[columnMapping[revenueColumn]]) || 0;
      totalRevenue += revenue;
    }

    // Build date series if date column exists
    if (dateColumn && recordDate) {
      const dateStr = recordDate.toISOString().split('T')[0];
      const existing = dateSeries.find(d => d.date === dateStr);
      if (existing) {
        if (leadsColumn && record[columnMapping[leadsColumn]]) {
          existing.leads += parseInt(record[columnMapping[leadsColumn]]) || 0;
        }
        if (spendColumn && record[columnMapping[spendColumn]]) {
          existing.spend += parseFloat(record[columnMapping[spendColumn]]) || 0;
        }
        if (revenueColumn && record[columnMapping[revenueColumn]]) {
          existing.revenue += parseFloat(record[columnMapping[revenueColumn]]) || 0;
        }
      } else {
        dateSeries.push({
          date: dateStr,
          leads: leadsColumn && record[columnMapping[leadsColumn]] ? parseInt(record[columnMapping[leadsColumn]]) || 0 : 0,
          spend: spendColumn && record[columnMapping[spendColumn]] ? parseFloat(record[columnMapping[spendColumn]]) || 0 : 0,
          revenue: revenueColumn && record[columnMapping[revenueColumn]] ? parseFloat(record[columnMapping[revenueColumn]]) || 0 : 0,
        });
      }
    }
  });

  // Calculate KPIs
  const cpl = totalSpend > 0 && totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : null;
  const roas = totalSpend > 0 && totalRevenue > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : null;

  // Calculate period length
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const periodLengthDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Generate title
  const title = `CSV Report - ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Create report
  const { data: report, error: reportError } = await (supabase
    .from('reports') as any)
    .insert({
      org_id: orgId,
      title,
      period_start: periodStart,
      period_end: periodEnd,
      tier: 'csv',
      version: 1,
      period_length_days: periodLengthDays,
      generated_at: new Date().toISOString(),
      status: 'draft',
      client_visible: true,
      created_by: userId,
    })
    .select()
    .single();

  if (reportError) {
    return { error: reportError.message };
  }

  // Create CSV data record
  const { error: csvDataError } = await (supabase
    .from('report_csv_data') as any)
    .insert({
      report_id: report.id,
      original_filename: csvFile.name,
      parsed_json: {
        totals: {
          leads: totalLeads,
          spend: totalSpend,
          revenue: totalRevenue,
          cpl,
          roas,
        },
        dateSeries: dateSeries.sort((a, b) => a.date.localeCompare(b.date)),
      },
      column_mapping: columnMapping,
    });

  if (csvDataError) {
    return { error: csvDataError.message };
  }

  // Create KPI snapshot
  const { error: snapshotError } = await (supabase
    .from('report_kpi_snapshots') as any)
    .insert({
      report_id: report.id,
      leads: totalLeads,
      spend: totalSpend,
      revenue: totalRevenue,
      cpl,
      roas,
      delta_leads: null,
      delta_spend: null,
      delta_revenue: null,
      notes: null,
    });

  if (snapshotError) {
    return { error: snapshotError.message };
  }

  // Generate Performance block
  const performanceContent = `LEADS: ${totalLeads}
SPEND: $${totalSpend.toLocaleString()}
REVENUE: $${totalRevenue.toLocaleString()}
${cpl !== null ? `CPL: $${cpl.toLocaleString()}` : 'CPL: Not available'}
${roas !== null ? `ROAS: ${roas}x` : 'ROAS: Not available'}`;

  // Create Performance block
  const { error: blockError } = await (supabase
    .from('report_sections') as any)
    .insert({
      report_id: report.id,
      section_type: 'metrics',
      block_type: 'performance',
      title: 'Performance',
      content: performanceContent,
      order_index: 0,
      is_auto_generated: true,
    });

  if (blockError) {
    return { error: blockError.message };
  }

  // Fetch full report with blocks, snapshot, and CSV data
  const { data: fullReport } = await (supabase
    .from('reports') as any)
    .select('*, report_sections(*), report_kpi_snapshots(*), report_csv_data(*)')
    .eq('id', report.id)
    .single();

  revalidatePath(`/${orgId}/reports`);
  return { data: fullReport };
}