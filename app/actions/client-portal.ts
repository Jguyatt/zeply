/**
 * Server Actions for Client Portal Configuration
 * Handles services, onboarding, and dashboard customization
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { buildDefaultDashboard } from '@/app/lib/dashboard-templates';

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

  // Auto-initialize default dashboard if none exists
  if (!config) {
    // Check if there are any deliverables
    const { count: deliverablesCount } = await supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('archived', false);
    
    const hasDeliverables = (deliverablesCount || 0) > 0;
    
    // Build default dashboard based on services and deliverables
    const defaultLayout = buildDefaultDashboard({}, hasDeliverables);
    
    // Create the config with auto-built dashboard
    const defaultConfig = {
      org_id: orgId,
      services: {},
      dashboard_layout: defaultLayout,
      onboarding_enabled: false,
    };
    
    // Save it to the database
    const { data: savedConfig } = await (supabase
      .from('client_portal_config') as any)
      .insert(defaultConfig)
      .select()
      .single();
    
    return { data: savedConfig || defaultConfig };
  }
  
  // If config exists but dashboard_layout is empty or missing, auto-build it
  const currentLayout = config.dashboard_layout as any;
  const services = (config.services || {}) as Record<string, boolean>;
  
  if (!currentLayout || !currentLayout.sections || currentLayout.sections.length === 0) {
    // Check if there are any deliverables
    const { count: deliverablesCount } = await supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('archived', false);
    
    const hasDeliverables = (deliverablesCount || 0) > 0;
    
    // Build default dashboard
    const defaultLayout = buildDefaultDashboard(services, hasDeliverables);
    
    // Update the config
    const updatedConfig = {
      ...config,
      dashboard_layout: defaultLayout,
    };
    
    // Save it
    await (supabase
      .from('client_portal_config') as any)
      .update({ dashboard_layout: defaultLayout })
      .eq('org_id', orgId);
    
    return { data: updatedConfig };
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
  
  // Check if onboarding is being enabled for the first time
  let shouldInitializeFlow = false;
  if (updates.onboarding_enabled === true) {
    const { data: existingConfig } = await supabase
      .from('client_portal_config')
      .select('onboarding_enabled')
      .eq('org_id', orgId)
      .maybeSingle();
    
    // If onboarding was previously disabled (or config doesn't exist), initialize flow
    if (!existingConfig || !(existingConfig as { onboarding_enabled: boolean }).onboarding_enabled) {
      shouldInitializeFlow = true;
    }
  }

  // FIX: Cast to 'any' for upsert
  const { data: config, error } = await (supabase
    .from('client_portal_config') as any)
    .upsert({
      org_id: orgId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Auto-initialize default flow if onboarding was just enabled
  if (shouldInitializeFlow) {
    const { initializeDefaultFlow } = await import('@/app/actions/onboarding');
    await initializeDefaultFlow(orgId); 
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

  // FIX: Cast to 'any' for insert
  const { data: newItem, error } = await (supabase
    .from('onboarding_items') as any)
    .insert({
      org_id: orgId,
      ...item,
      sort_order: item.sort_order ?? 0,
      published: item.published ?? true,
    })
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

  // FIX: Cast to 'any' for upsert
  const { data: progress, error } = await (supabase
    .from('onboarding_progress') as any)
    .upsert({
      org_id: orgId,
      user_id: userId,
      item_id: itemId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }, {
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