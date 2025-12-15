/**
 * Server Actions for Deliverables Management
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function getDeliverables(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: deliverables, error } = await supabase
    .from('deliverables')
    .select('*, deliverable_assets(*), deliverable_comments(count)')
    .eq('org_id', orgId)
    .eq('client_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: deliverables };
}

export async function createDeliverable(
  orgId: string,
  data: {
    title: string;
    type: string;
    description?: string;
    due_date?: string;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner in this org (members cannot create deliverables)
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
    return { error: 'Only admins can create deliverables' };
  }

  const { data: deliverable, error } = await (supabase
    .from('deliverables') as any)
    .insert({
      org_id: orgId,
      title: data.title,
      type: data.type,
      description: data.description,
      due_date: data.due_date,
      created_by: userId,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/dashboard`);
  return { data: deliverable };
}

export async function updateDeliverableStatus(
  deliverableId: string,
  status: 'draft' | 'in_review' | 'approved' | 'delivered'
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check org_id
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner in this org (members cannot update status)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update deliverable status' };
  }

  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({ status })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedDeliverable };
}

export async function publishDeliverable(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check org_id
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner in this org (members cannot publish)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can publish deliverables' };
  }

  const { data: publishedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({ published_at: new Date().toISOString() })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: publishedDeliverable };
}

export async function getRoadmapItems(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: items, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('org_id', orgId)
    .order('order_index', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: items };
}

export async function getWeeklyUpdates(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: updates, error } = await supabase
    .from('weekly_updates')
    .select('*')
    .eq('org_id', orgId)
    .eq('client_visible', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5);

  if (error) {
    return { error: error.message };
  }

  return { data: updates };
}

export async function getPortalSettings(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: settings, error } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is okay
    return { error: error.message };
  }

  // Create default settings if none exist
  if (!settings) {
    const { data: newSettings, error: createError } = await (supabase
      .from('portal_settings') as any)
      .insert({
        org_id: orgId,
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    return { data: newSettings };
  }

  return { data: settings };
}

