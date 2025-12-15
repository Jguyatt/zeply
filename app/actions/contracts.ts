/**
 * Server Actions for Contract Management
 * All operations are scoped by org_id and enforced by RLS
 * Agency owners/admins can access linked client contracts
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

/**
 * Get contracts for the active org
 * Returns contracts for:
 * - The user's active org (if member)
 * - Linked client orgs (if user is agency owner/admin)
 */
export async function getContracts(orgId: string) {
  const supabase = await createServerClient();
  
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
    .single();

  // If not direct member, check if agency has access to this client
  if (!membership) {
    const { data: agencyAccess } = await supabase
      .from('agency_clients')
      .select('agency_org_id')
      .eq('client_org_id', orgId)
      .single();

    if (agencyAccess) {
      const agencyOrgId = (agencyAccess as any).agency_org_id;
      if (agencyOrgId) {
        const { data: agencyMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', agencyOrgId)
          .eq('user_id', userId)
          .single();

        if (!agencyMembership || !['owner', 'admin'].includes((agencyMembership as any).role)) {
          return { error: 'Insufficient permissions' };
        }
      } else {
        return { error: 'Insufficient permissions' };
      }
    } else {
      return { error: 'Insufficient permissions' };
    }
  }

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: contracts };
}

/**
 * Create a new contract
 * User must be a member of the org
 */
export async function createContract(orgId: string, title: string) {
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

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      org_id: orgId,
      title,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/contracts');
  return { data: contract };
}

/**
 * Update a contract
 * User must be a member of the contract's org
 */
export async function updateContract(contractId: string, title: string) {
  const supabase = await createServerClient();
  
  const { userId } = await auth();
  
  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get contract to verify org
  const { data: contract } = await supabase
    .from('contracts')
    .select('org_id')
    .eq('id', contractId)
    .single();

  if (!contract) {
    return { error: 'Contract not found' };
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', contract.org_id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return { error: 'Insufficient permissions' };
  }

  const { data: updatedContract, error } = await supabase
    .from('contracts')
    .update({ title })
    .eq('id', contractId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/contracts');
  return { data: updatedContract };
}

/**
 * Delete a contract
 * User must be a member of the contract's org
 */
export async function deleteContract(contractId: string) {
  const supabase = await createServerClient();
  
  const { userId } = await auth();
  
  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get contract to verify org
  const { data: contract } = await supabase
    .from('contracts')
    .select('org_id')
    .eq('id', contractId)
    .single();

  if (!contract) {
    return { error: 'Contract not found' };
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', contract.org_id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return { error: 'Insufficient permissions' };
  }

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/contracts');
  return { data: { success: true } };
}

