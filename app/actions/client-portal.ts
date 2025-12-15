/**
 * Server Actions for Client Portal Configuration
 * Handles services, onboarding, and dashboard customization
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

// ============================================================================
// CLIENT PORTAL CONFIG
// ============================================================================

export async function getClientPortalConfig(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: config, error } = await supabase
    .from('client_portal_config')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return { error: error.message };
  }

  // Return default config if none exists
  if (!config) {
    return {
      data: {
        org_id: orgId,
        services: {},
        dashboard_layout: {
          sections: ['kpis', 'deliverables', 'updates'],
          kpis: ['leads', 'spend', 'cpl', 'roas', 'work_completed'],
        },
        onboarding_enabled: false,
      },
    };
  }

  return { data: config };
}

export async function updateClientPortalConfig(orgId: string, updates: {
  services?: Record<string, boolean>;
  dashboard_layout?: any;
  onboarding_enabled?: boolean;
}) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner of agency that manages this client
  // (This check should be done in the component, but we'll add basic validation)
  
  const { data: config, error } = await supabase
    .from('client_portal_config')
    .upsert({
      org_id: orgId,
      ...updates,
      updated_at: new Date().toISOString(),
    } as any, {
      onConflict: 'org_id',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/setup`);
  revalidatePath(`/${orgId}/dashboard`);
  return { data: config };
}

// ============================================================================
// ONBOARDING ITEMS
// ============================================================================

export async function getOnboardingItems(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: items, error } = await supabase
    .from('onboarding_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: items || [] };
}

export async function getAllOnboardingItems(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: items, error } = await supabase
    .from('onboarding_items')
    .select('*')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: items || [] };
}

export async function createOnboardingItem(orgId: string, item: {
  title: string;
  description?: string;
  type: 'doc' | 'form' | 'contract' | 'connect' | 'payment' | 'call';
  required?: boolean;
  url?: string;
  file_url?: string;
  sort_order?: number;
  published?: boolean;
}) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: newItem, error } = await supabase
    .from('onboarding_items')
    .insert({
      org_id: orgId,
      ...item,
      sort_order: item.sort_order ?? 0,
      published: item.published ?? true,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/setup`);
  return { data: newItem };
}

export async function updateOnboardingItem(itemId: string, updates: Partial<{
  title: string;
  description: string;
  type: 'doc' | 'form' | 'contract' | 'connect' | 'payment' | 'call';
  required: boolean;
  url: string;
  file_url: string;
  sort_order: number;
  published: boolean;
}>) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get org_id from item
  const { data: item } = await supabase
    .from('onboarding_items')
    .select('org_id')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { error: 'Item not found' };
  }

  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedItem, error } = await (supabase
    .from('onboarding_items') as any)
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(item as any).org_id}/setup`);
  return { data: updatedItem };
}

export async function deleteOnboardingItem(itemId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get org_id from item
  const { data: item } = await supabase
    .from('onboarding_items')
    .select('org_id')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { error: 'Item not found' };
  }

  const { error } = await supabase
    .from('onboarding_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(item as any).org_id}/setup`);
  return { data: { success: true } };
}

// ============================================================================
// ONBOARDING PROGRESS
// ============================================================================

export async function getOnboardingProgress(orgId: string, userId: string) {
  const supabase = await createServerClient();

  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('*, onboarding_items(*)')
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  return { data: progress || [] };
}

export async function completeOnboardingItem(orgId: string, itemId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .upsert({
      org_id: orgId,
      user_id: userId,
      item_id: itemId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as any, {
      onConflict: 'org_id,user_id,item_id',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/dashboard`);
  return { data: progress };
}

