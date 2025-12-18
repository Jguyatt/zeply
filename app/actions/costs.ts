/**
 * Server Actions for Cost Management
 * Handles cost events, overhead costs, and cost queries
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

/**
 * Get cost events for a workspace
 */
export async function getCostEvents(
  workspaceId: string,
  filters?: {
    clientId?: string | null;
    source?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user has access to workspace
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this workspace' };
  }

  let query = supabase
    .from('cost_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('occurred_at', { ascending: false });

  if (filters?.clientId !== undefined) {
    if (filters.clientId === null) {
      query = query.is('client_id', null);
    } else {
      query = query.eq('client_id', filters.clientId);
    }
  }

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.startDate) {
    query = query.gte('occurred_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('occurred_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Create or update monthly overhead cost
 */
export async function upsertMonthlyOverhead(
  workspaceId: string,
  month: string, // YYYY-MM-01 format
  amountCents: number,
  allocationMethod: 'pro_rata_revenue' | 'pro_rata_usage' | 'manual' = 'manual',
  description?: string
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is owner/admin
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return { error: 'Insufficient permissions' };
  }

  const { data, error } = await (supabase
    .from('monthly_overhead_costs') as any)
    .upsert({
      workspace_id: workspaceId,
      month: month,
      amount_cents: amountCents,
      allocation_method: allocationMethod,
      description: description || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'workspace_id,month',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${workspaceId}/settings`);
  return { data };
}

/**
 * Get monthly overhead costs for a workspace
 */
export async function getMonthlyOverhead(
  workspaceId: string,
  startMonth?: string,
  endMonth?: string
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user has access
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this workspace' };
  }

  let query = supabase
    .from('monthly_overhead_costs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('month', { ascending: false });

  if (startMonth) {
    query = query.gte('month', startMonth);
  }

  if (endMonth) {
    query = query.lte('month', endMonth);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Delete monthly overhead cost
 */
export async function deleteMonthlyOverhead(workspaceId: string, overheadId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is owner/admin
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return { error: 'Insufficient permissions' };
  }

  const { error } = await supabase
    .from('monthly_overhead_costs')
    .delete()
    .eq('id', overheadId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${workspaceId}/settings`);
  return { data: { success: true } };
}

