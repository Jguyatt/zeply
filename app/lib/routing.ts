/**
 * Routing Helpers
 * Role-based routing and workspace selection utilities
 */

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export type UserRole = 'owner' | 'admin' | 'member';

export interface WorkspaceInfo {
  id: string;
  name: string;
  role: UserRole;
  clerkOrgId?: string | null;
}

/**
 * Get all workspaces user is a member of
 * Returns workspace info with role for each
 */
export async function getUserWorkspaces(): Promise<WorkspaceInfo[]> {
  const { userId } = await auth();
  if (!userId) {
    return [];
  }

  const supabase = createServiceClient();

  // Get all memberships with org info
  const { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id, role, orgs(id, name, clerk_org_id, created_at)')
    .eq('user_id', userId);

  if (error || !memberships) {
    return [];
  }

  // Map memberships to workspace info
  const workspaceMap = new Map<string, WorkspaceInfo>();
  
  for (const m of memberships) {
    const org = m.orgs as any;
    const clerkOrgId = org?.clerk_org_id || null;
    
    // Use clerk_org_id as key if available, otherwise use org_id
    const key = clerkOrgId || m.org_id;
    
    // If we already have this workspace (by clerk_org_id), keep the one with the oldest org
    if (workspaceMap.has(key)) {
      const existing = workspaceMap.get(key)!;
      const existingOrg = memberships.find((mem: any) => mem.org_id === existing.id)?.orgs as any;
      const currentOrgCreatedAt = new Date(org?.created_at || 0);
      const existingOrgCreatedAt = new Date(existingOrg?.created_at || 0);
      
      // Keep the oldest org (or the one with higher role if same org)
      if (currentOrgCreatedAt < existingOrgCreatedAt) {
        workspaceMap.set(key, {
          id: m.org_id,
          name: org?.name || 'Workspace',
          role: m.role as UserRole,
          clerkOrgId: clerkOrgId,
        });
      } else if (currentOrgCreatedAt.getTime() === existingOrgCreatedAt.getTime()) {
        // Same creation time - prefer higher role (owner > admin > member)
        const rolePriority = { owner: 3, admin: 2, member: 1 };
        const currentRolePriority = rolePriority[m.role as UserRole] || 0;
        const existingRolePriority = rolePriority[existing.role] || 0;
        
        if (currentRolePriority > existingRolePriority) {
          workspaceMap.set(key, {
            id: m.org_id,
            name: org?.name || 'Workspace',
            role: m.role as UserRole,
            clerkOrgId: clerkOrgId,
          });
        }
      }
    } else {
      // First time seeing this workspace
      workspaceMap.set(key, {
        id: m.org_id,
        name: org?.name || 'Workspace',
        role: m.role as UserRole,
        clerkOrgId: clerkOrgId,
      });
    }
  }

  return Array.from(workspaceMap.values());
}

/**
 * Get user's role in a workspace and determine route type
 * Returns 'client' if role='member', 'admin' if role='admin'|'owner'
 */
export async function getWorkspaceRoute(workspaceId: string): Promise<'client' | 'admin' | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const supabase = createServiceClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      return null;
    }
  }

  // Check membership first (fast database query)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseWorkspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  // If we have a membership, use it immediately (don't wait for Clerk sync)
  // Clerk sync will happen in the background via layout
  if (membership) {
    const role = (membership as any).role as UserRole;
    
    if (role === 'member') {
      return 'client';
    } else if (role === 'admin' || role === 'owner') {
      return 'admin';
    }
  }

  // If no membership found, return null (will redirect to dashboard)
  return null;

  if (!membership) {
    return null;
  }

  const role = (membership as any).role as UserRole;
  
  if (role === 'member') {
    return 'client';
  } else if (role === 'admin' || role === 'owner') {
    return 'admin';
  }

  return null;
}

/**
 * Redirect user to appropriate workspace route based on role
 */
export async function redirectToWorkspace(workspaceId: string): Promise<void> {
  const routeStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:150',message:'getWorkspaceRoute start',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const routeType = await getWorkspaceRoute(workspaceId);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:153',message:'getWorkspaceRoute completed',data:{workspaceId,routeType,elapsed:Date.now()-routeStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  if (!routeType) {
    redirect('/dashboard');
  }

  if (routeType === 'client') {
    redirect(`/client/${workspaceId}/dashboard`);
  } else {
    redirect(`/admin/${workspaceId}/dashboard`);
  }
}

/**
 * Handle login redirect based on workspace count
 * 0 workspaces → onboarding/error
 * 1 workspace → auto-route based on role
 * 2+ workspaces → select-workspace page
 */
export async function handleLoginRedirect(): Promise<void> {
  const startTime = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:151',message:'handleLoginRedirect start',data:{timestamp:startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const workspaces = await getUserWorkspaces();
  const workspacesTime = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:156',message:'getUserWorkspaces completed',data:{workspaceCount:workspaces.length,elapsed:workspacesTime-startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (workspaces.length === 0) {
    // No workspaces - redirect to HQ dashboard (which handles empty state)
    redirect('/dashboard');
  } else if (workspaces.length === 1) {
    // Single workspace - auto-route
    const workspace = workspaces[0];
    const workspaceId = workspace.clerkOrgId || workspace.id;
    const redirectStart = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:164',message:'redirectToWorkspace start',data:{workspaceId,role:workspace.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    await redirectToWorkspace(workspaceId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:167',message:'redirectToWorkspace completed',data:{elapsed:Date.now()-redirectStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } else {
    // Multiple workspaces - show selector
    redirect('/select-workspace');
  }
}
