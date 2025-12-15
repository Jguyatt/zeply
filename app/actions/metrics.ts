/**
 * Server Actions for Metrics Management
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function getMetrics(orgId: string, periodStart?: string, periodEnd?: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('metrics')
    .select('*')
    .eq('org_id', orgId)
    .order('period_start', { ascending: false });

  if (periodStart) {
    query = query.gte('period_start', periodStart);
  }

  if (periodEnd) {
    query = query.lte('period_end', periodEnd);
  }

  const { data: metrics, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: metrics || [] };
}

export async function getLatestMetrics(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get the most recent metrics for the current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: metrics, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('org_id', orgId)
    .gte('period_start', monthStart)
    .lte('period_end', monthEnd)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // Not found is okay
    return { error: error.message };
  }

  // If no metrics for this month, get the most recent ones
  if (!metrics) {
    const { data: latestMetrics, error: latestError } = await supabase
      .from('metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError && latestError.code !== 'PGRST116') {
      return { error: latestError.message };
    }

    return { data: latestMetrics || null };
  }

  return { data: metrics };
}

export async function createMetrics(
  orgId: string,
  data: {
    period_start: string;
    period_end: string;
    leads?: number;
    spend?: number;
    revenue?: number;
    website_traffic?: number;
    conversions?: number;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Calculate derived metrics
  const spend = data.spend || 0;
  const leads = data.leads || 0;
  const revenue = data.revenue || 0;
  const conversions = data.conversions || 0;
  const websiteTraffic = data.website_traffic || 0;

  const cpl = leads > 0 ? Number((spend / leads).toFixed(2)) : null;
  const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : null;
  const conversionRate = websiteTraffic > 0 
    ? Number(((conversions / websiteTraffic) * 100).toFixed(2)) 
    : null;

  const { data: metrics, error } = await (supabase
    .from('metrics') as any)
    .insert({
      org_id: orgId,
      period_start: data.period_start,
      period_end: data.period_end,
      leads: leads,
      spend: spend,
      revenue: revenue,
      website_traffic: websiteTraffic,
      conversions: conversions,
      cpl: cpl,
      roas: roas,
      conversion_rate: conversionRate,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/dashboard`);
  return { data: metrics };
}

export async function updateMetrics(
  metricId: string,
  data: {
    period_start?: string;
    period_end?: string;
    leads?: number;
    spend?: number;
    revenue?: number;
    website_traffic?: number;
    conversions?: number;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get existing metric to calculate derived values
  const { data: existing, error: fetchError } = await supabase
    .from('metrics')
    .select('*')
    .eq('id', metricId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const spend = data.spend !== undefined ? data.spend : existing.spend || 0;
  const leads = data.leads !== undefined ? data.leads : existing.leads || 0;
  const revenue = data.revenue !== undefined ? data.revenue : existing.revenue || 0;
  const conversions = data.conversions !== undefined ? data.conversions : existing.conversions || 0;
  const websiteTraffic = data.website_traffic !== undefined ? data.website_traffic : existing.website_traffic || 0;

  const cpl = leads > 0 ? Number((spend / leads).toFixed(2)) : null;
  const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : null;
  const conversionRate = websiteTraffic > 0 
    ? Number(((conversions / websiteTraffic) * 100).toFixed(2)) 
    : null;

  const updateData: any = { ...data };
  if (data.leads !== undefined || data.spend !== undefined || data.revenue !== undefined || data.conversions !== undefined || data.website_traffic !== undefined) {
    updateData.cpl = cpl;
    updateData.roas = roas;
    updateData.conversion_rate = conversionRate;
  }

  const { data: metrics, error } = await (supabase
    .from('metrics') as any)
    .update(updateData)
    .eq('id', metricId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${metrics.org_id}/dashboard`);
  return { data: metrics };
}

