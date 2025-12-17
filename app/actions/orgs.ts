/**
 * Server Actions for Organization Management
 * Handles Clerk org to Supabase org mapping and org operations
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Fetch Clerk organization name from Clerk API
 */
async function getClerkOrgName(clerkOrgId: string): Promise<string | null> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: clerkOrgId });
    return org.name || null;
  } catch (error) {
    console.error('Error fetching Clerk org name:', error);
    return null;
  }
}

/**
 * Sync Clerk organization to Supabase org
 * Creates or updates the mapping between Clerk org ID and Supabase org
 * If clerkOrgName is not provided, fetches it from Clerk API
 */
export async function syncClerkOrgToSupabase(clerkOrgId: string, clerkOrgName?: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Fetch Clerk org name if not provided
  let orgName = clerkOrgName;
  if (!orgName) {
    const fetchedName = await getClerkOrgName(clerkOrgId);
    if (fetchedName) {
      orgName = fetchedName;
    } else {
      // Fallback to a generic name if Clerk fetch fails
      orgName = 'Organization';
    }
  }

  // CRITICAL: Check if org already exists with this Clerk ID
  // This prevents duplicate org creation
  // Handle duplicates by getting the oldest one
  const { data: existingOrgs, error: lookupError } = await supabase
    .from('orgs')
    .select('id, name')
    .eq('clerk_org_id', clerkOrgId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (lookupError) {
    console.error('Error looking up existing org:', lookupError);
    return { error: lookupError.message };
  }

  const existingOrg = existingOrgs && existingOrgs.length > 0 ? existingOrgs[0] : null;

  if (existingOrg) {
    // Org already exists - update name if it's different from Clerk
    const existingOrgTyped = existingOrg as any;
    if (existingOrgTyped.name !== orgName && orgName !== 'Organization') {
      const { data: updatedOrg, error: updateError } = await (supabase
        .from('orgs') as any)
        .update({ name: orgName })
        .eq('id', existingOrgTyped.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating org name:', updateError);
        // Return existing org even if update fails
        return { data: existingOrgTyped, isNew: false };
      }
      
      return { data: updatedOrg, isNew: false };
  }

    // Org exists and name matches - return it without creating a duplicate
    return { data: existingOrgTyped, isNew: false };
  }

  // Org doesn't exist - create it with Clerk mapping
  // The unique constraint on clerk_org_id will prevent duplicates even if called concurrently
  const { data: newOrg, error: orgError } = await (supabase
    .from('orgs') as any)
    .insert({
      name: orgName,
      kind: 'client', // Default to client, can be updated later
      clerk_org_id: clerkOrgId,
    })
    .select()
    .single();

  if (orgError) {
    // If error is due to unique constraint violation, try to fetch the existing org
    if (orgError.code === '23505' || orgError.message?.includes('unique')) {
      const { data: existingOrgAfterError } = await supabase
        .from('orgs')
        .select('id, name')
        .eq('clerk_org_id', clerkOrgId)
        .maybeSingle();
      
      if (existingOrgAfterError) {
        return { data: existingOrgAfterError, isNew: false };
      }
    }
    
    return { error: orgError.message || 'Failed to create organization' };
  }

  if (!newOrg) {
    return { error: 'Failed to create organization' };
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orgs.ts:150',message:'getSupabaseOrgIdFromClerk entry',data:{clerkOrgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Handle duplicate orgs: if multiple exist, get the oldest one
  const { data: orgs, error: orgError } = await supabase
    .from('orgs')
    .select('id')
    .eq('clerk_org_id', clerkOrgId)
    .order('created_at', { ascending: true })
    .limit(1);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orgs.ts:165',message:'getSupabaseOrgIdFromClerk query result',data:{hasData:!!orgs,orgCount:orgs?.length || 0,hasError:!!orgError,supabaseOrgId:orgs?.[0]?.id,errorMessage:orgError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (orgError) {
    console.error('Error looking up existing org:', orgError);
    return { error: orgError.message };
  }

  if (!orgs || orgs.length === 0) {
    return { error: 'Organization not found' };
  }

  const org = orgs[0];
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orgs.ts:190',message:'getUserOrgs entry',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const { data: orgs, error } = await supabase
    .from('org_members')
    .select('org_id, role, orgs(*)')
    .eq('user_id', userId);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orgs.ts:198',message:'getUserOrgs query result',data:{orgCount:orgs?.length || 0,hasError:!!error,orgNames:orgs?.map((o:any)=>o.orgs?.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (error) {
    return { error: error.message };
  }

  // Deduplicate orgs by clerk_org_id - keep the oldest one
  const orgMap = new Map<string, any>();
  if (orgs) {
    for (const org of orgs as any[]) {
      const orgData = org.orgs as any;
      const clerkOrgId = orgData?.clerk_org_id;
      if (clerkOrgId) {
        const existing = orgMap.get(clerkOrgId);
        if (!existing) {
          orgMap.set(clerkOrgId, org);
        } else {
          // Compare created_at - keep the oldest
          const existingDate = new Date((existing.orgs as any)?.created_at || 0);
          const currentDate = new Date(orgData?.created_at || 0);
          if (currentDate < existingDate) {
            orgMap.set(clerkOrgId, org);
          }
        }
      } else {
        // No clerk_org_id - use org_id as key
        orgMap.set(orgData?.id || org.org_id, org);
      }
    }
  }

  const deduplicatedOrgs = Array.from(orgMap.values());
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orgs.ts:220',message:'getUserOrgs deduplicated',data:{originalCount:orgs?.length || 0,deduplicatedCount:deduplicatedOrgs.length,deduplicatedNames:deduplicatedOrgs.map((o:any)=>o.orgs?.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return { data: deduplicatedOrgs };
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

  // FIX: Cast to 'any' for insert
  const { data: clientOrg, error: orgError } = await (supabase
    .from('orgs') as any)
    .insert({
      name: clientName,
      kind: 'client',
    })
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

  // FIX: Cast to 'any' for upsert
  const { error } = await (supabase
    .from('user_profiles') as any)
    .upsert({
      user_id: userId,
      active_org_id: orgId,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { data: { success: true } };
}