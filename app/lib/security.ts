/**
 * Security Verification Helpers
 * Centralized workspace access control - CRITICAL for client dashboard security
 * 
 * HARD RULE: Middleware is UX only. Every page loader and server action MUST call these functions.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export type UserRole = 'owner' | 'admin' | 'member';

export interface WorkspaceAccessResult {
  allowed: boolean;
  role: UserRole | null;
  error?: string;
}

/**
 * Verify user has access to workspace and optionally check role
 * This is the PRIMARY security check - use in every page loader and server action
 * 
 * @param workspaceId - The workspace/org ID (workspaceId === orgId)
 * @param requiredRole - Optional role requirement ('member' for client, 'admin'|'owner' for admin)
 * @returns Access result with allowed status and user's role
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  requiredRole?: 'member' | 'admin' | 'owner'
): Promise<WorkspaceAccessResult> {
  const { userId } = await auth();

  if (!userId) {
    return { allowed: false, role: null, error: 'Not authenticated' };
  }

  const supabase = createServiceClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const { getSupabaseOrgIdFromClerk } = await import('@/app/actions/orgs');
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      return { allowed: false, role: null, error: 'Workspace not found' };
    }
  }

  // Check membership and role (fast database query - don't wait for Clerk sync)
  // Clerk sync happens in layout, so role should already be synced
  const { data: membership, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseWorkspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { allowed: false, role: null, error: error.message };
  }

  if (!membership) {
    return { allowed: false, role: null, error: 'Not a member of this workspace' };
  }

  const userRole = (membership as any).role as UserRole;

  // If no role requirement, just check membership
  if (!requiredRole) {
    return { allowed: true, role: userRole };
  }

  // Check role requirement
  if (requiredRole === 'member') {
    // Any role is allowed (member, admin, or owner can access client routes)
    return { allowed: true, role: userRole };
  } else if (requiredRole === 'admin' || requiredRole === 'owner') {
    // Only admin or owner allowed
    if (userRole === 'admin' || userRole === 'owner') {
      return { allowed: true, role: userRole };
    } else {
      return { allowed: false, role: userRole, error: 'Insufficient permissions' };
    }
  }

  return { allowed: false, role: userRole, error: 'Invalid role requirement' };
}

/**
 * Verify and redirect if not allowed
 * Convenience function for page loaders
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  requiredRole?: 'member' | 'admin' | 'owner',
  redirectTo: string = '/dashboard'
): Promise<UserRole> {
  const { allowed, role, error } = await verifyWorkspaceAccess(workspaceId, requiredRole);

  if (!allowed || !role) {
    redirect(redirectTo);
  }

  return role;
}
