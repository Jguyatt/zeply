/**
 * Authentication and Authorization Utilities
 * Centralized role checking and access control
 */

import { createServiceClient } from '@/lib/supabase/server'; // CHANGED: Use Service Client
import { auth } from '@clerk/nextjs/server';

export type UserRole = 'owner' | 'admin' | 'member';

export interface UserRoleInfo {
  isAdmin: boolean;
  hasAdminRole: boolean;
  roleInOrg?: UserRole;
  memberOrgs: string[];
  adminOrgs: string[];
}

/**
 * Check if user has admin role (owner or admin) in ANY organization
 */
export async function isUserAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  // Use Service Client to bypass RLS since we verified userId via Clerk
  const supabase = createServiceClient(); 
  
  const { data: memberships } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin']);

  const isAdmin = (memberships?.length || 0) > 0;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:35',message:'isUserAdmin result',data:{userId,isAdmin,membershipCount:memberships?.length || 0,memberships:memberships?.map((m:any)=>m.role)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return isAdmin;
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRoleInOrg(orgId: string): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServiceClient();
  
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  return (membership as any)?.role || null;
}

/**
 * Check if user is a member of a specific organization
 */
export async function isUserMemberOfOrg(orgId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = createServiceClient();
  
  const { data: membership } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!membership;
}

/**
 * Get comprehensive role information for the current user
 */
export async function getUserRoleInfo(): Promise<UserRoleInfo> {
  const { userId } = await auth();
  if (!userId) {
    return {
      isAdmin: false,
      hasAdminRole: false,
      memberOrgs: [],
      adminOrgs: [],
    };
  }

  const supabase = createServiceClient();
  
  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId);

  const memberOrgs: string[] = [];
  const adminOrgs: string[] = [];

  memberships?.forEach((membership: any) => {
    const orgId = membership.org_id;
    const role = membership.role as UserRole;
    
    memberOrgs.push(orgId);
    
    if (role === 'owner' || role === 'admin') {
      adminOrgs.push(orgId);
    }
  });

  const hasAdminRole = adminOrgs.length > 0;

  return {
    isAdmin: hasAdminRole,
    hasAdminRole,
    memberOrgs,
    adminOrgs,
  };
}

/**
 * Get the first org ID where user is a member (for redirects)
 */
export async function getUserFirstMemberOrg(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServiceClient();
  
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  return (membership as any)?.org_id || null;
}

export async function shouldShowAdminView(orgId: string): Promise<boolean> {
  const role = await getUserRoleInOrg(orgId);
  return role === 'owner' || role === 'admin';
}