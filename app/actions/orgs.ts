/**
 * Server Actions for Organization Management
 * Handles Clerk org to Supabase org mapping and org operations
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Sync Clerk organization to Supabase org
 * Creates or updates the mapping between Clerk org ID and Supabase org
 */
export async function syncClerkOrgToSupabase(clerkOrgId: string, clerkOrgName: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Check if org already exists with this Clerk ID
  const { data: existingOrg } = await supabase
    .from('orgs')
    .select('id')
    .eq('clerk_org_id', clerkOrgId)
    .single();

  if (existingOrg) {
    return { data: existingOrg, isNew: false };
  }

  // Create new org with Clerk mapping
  const { data: newOrg, error: orgError } = await (supabase
    .from('orgs') as any)
    .insert({
      name: clerkOrgName,
      kind: 'client', // Default to client, can be updated later
      clerk_org_id: clerkOrgId,
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    return { error: orgError?.message || 'Failed to create organization' };
  }

  // Add user as owner (use upsert to avoid conflicts)
  const { error: memberError } = await supabase
    .from('org_members')
    .upsert({
      org_id: (newOrg as any).id,
      user_id: userId,
      role: 'owner',
    } as any, {
      onConflict: 'org_id,user_id'
    });

  if (memberError) {
    console.error('Error adding user to org:', memberError);
    // Don't fail - org is created, membership can be fixed later
  }

  // Note: revalidatePath removed - this function can be called during render
  // Revalidation will happen naturally on navigation
  return { data: newOrg, isNew: true };
}

/**
 * Get Supabase org ID from Clerk org ID
 */
export async function getSupabaseOrgIdFromClerk(clerkOrgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: org } = await supabase
    .from('orgs')
    .select('id')
    .eq('clerk_org_id', clerkOrgId)
    .single();

  if (!org) {
    return { error: 'Organization not found' };
  }

  return { data: (org as any).id };
}

/**
 * Get all organizations the user is a member of
 */
export async function getUserOrgs() {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: orgs, error } = await supabase
    .from('org_members')
    .select('org_id, role, orgs(*)')
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  return { data: orgs };
}

/**
 * Get all clients for an agency organization
 */
export async function getAgencyClients(agencyOrgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner of the agency
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', agencyOrgId)
    .eq('user_id', userId)
    .single();

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return { error: 'Insufficient permissions' };
  }

  // Get all client orgs linked to this agency
  const { data: clientLinks, error: linkError } = await supabase
    .from('agency_clients')
    .select('client_org_id, orgs!agency_clients_client_org_id_fkey(*)')
    .eq('agency_org_id', agencyOrgId);

  if (linkError) {
    return { error: linkError.message };
  }

  const clients = clientLinks?.map((link: any) => ({
    id: link.client_org_id,
    ...link.orgs,
  })) || [];

  return { data: clients };
}

/**
 * Create a new client organization and link it to an agency
 */
export async function createClientOrg(agencyOrgId: string, clientName: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner of the agency
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', agencyOrgId)
    .eq('user_id', userId)
    .single();

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return { error: 'Insufficient permissions' };
  }

  // Create client org
  const { data: clientOrg, error: orgError } = await supabase
    .from('orgs')
    .insert({
      name: clientName,
      kind: 'client',
    } as any)
    .select()
    .single();

  if (orgError || !clientOrg) {
    return { error: orgError?.message || 'Failed to create client organization' };
  }

  // Link client to agency
  const { error: linkError } = await (supabase
    .from('agency_clients') as any)
    .insert({
      agency_org_id: agencyOrgId,
      client_org_id: (clientOrg as any).id,
    });

  if (linkError) {
    return { error: linkError.message };
  }

  revalidatePath('/clients');
  return { data: clientOrg };
}

/**
 * Switch active organization for a user
 */
export async function switchActiveOrg(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of the org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Update active org in profile
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      active_org_id: orgId,
    } as any);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { data: { success: true } };
}
