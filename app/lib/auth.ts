/**
 * Authentication and Authorization Utilities
 * Centralized role checking and access control
 */

import { createServerClient } from '@/lib/supabase/server';
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

  const supabase = await createServerClient();
  const { data: memberships } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin']);

  return (memberships?.length || 0) > 0;
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRoleInOrg(orgId: string): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createServerClient();
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

  const supabase = await createServerClient();
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

  const supabase = await createServerClient();
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

  const supabase = await createServerClient();
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  return (membership as any)?.org_id || null;
}

/**
 * Get user's role in a specific org and determine if they should see admin view
 * This should be the single source of truth for view permissions
 * CRITICAL: Checks role ONLY in the specified org, never globally
 */
export async function shouldShowAdminView(orgId: string): Promise<boolean> {
  const role = await getUserRoleInOrg(orgId);
  return role === 'owner' || role === 'admin';
}

