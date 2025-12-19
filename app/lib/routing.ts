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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-start',message:'getUserWorkspaces called',data:{hasUserId:!!userId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (!userId) {
    return [];
  }

  const supabase = createServiceClient();

  // Get all memberships with org info
  let { data: memberships, error } = await supabase
    .from('org_members')
    .select('org_id, role, orgs(id, name, clerk_org_id, created_at)')
    .eq('user_id', userId);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-query',message:'Membership query result',data:{userId,hasError:!!error,error:error?.message,membershipCount:memberships?.length || 0,memberships:memberships?.map((m:any)=>({orgId:m.org_id,role:m.role,orgName:m.orgs?.name,clerkOrgId:m.orgs?.clerk_org_id}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // If no memberships found, try syncing from Clerk organizations
  if ((!memberships || memberships.length === 0) && !error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-sync',message:'No memberships found, attempting Clerk sync',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      
      // Get all Clerk organization memberships for this user
      const clerkMemberships = await clerk.users.getOrganizationMembershipList({ userId });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-clerk-orgs',message:'Found Clerk organization memberships',data:{userId,membershipCount:clerkMemberships.data?.length || 0,orgIds:clerkMemberships.data?.map((m:any)=>m.organization?.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Sync each Clerk org to Supabase (this will create memberships)
      if (clerkMemberships.data && clerkMemberships.data.length > 0) {
        const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
        for (const membership of clerkMemberships.data) {
          const orgId = (membership as any).organization?.id;
          if (orgId) {
            await syncClerkOrgToSupabase(orgId);
          }
        }
        
        // Retry the query after syncing
        const { data: retryMemberships, error: retryError } = await supabase
          .from('org_members')
          .select('org_id, role, orgs(id, name, clerk_org_id, created_at)')
          .eq('user_id', userId);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-retry',message:'Retry after sync',data:{userId,retryCount:retryMemberships?.length || 0,hasRetryError:!!retryError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (!retryError && retryMemberships) {
          memberships = retryMemberships;
        }
      }
    } catch (syncError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-sync-error',message:'Clerk sync failed',data:{userId,error:syncError instanceof Error ? syncError.message : String(syncError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      console.error('Error syncing Clerk orgs:', syncError);
    }
  }

  if (error || !memberships || memberships.length === 0) {
    return [];
  }

  // Map memberships to workspace info
  const workspaceMap = new Map<string, WorkspaceInfo>();
  
  // Fix: Type assertion to handle union type narrowing issue
  const membershipsAny = memberships as any[];
  for (const m of membershipsAny) {
    const org = m.orgs as any;
    const clerkOrgId = org?.clerk_org_id || null;
    
    // Use clerk_org_id as key if available, otherwise use org_id
    const key = clerkOrgId || m.org_id;
    
    // If we already have this workspace (by clerk_org_id), keep the one with the oldest org
    if (workspaceMap.has(key)) {
      const existing = workspaceMap.get(key)!;
      const existingOrg = membershipsAny.find((mem: any) => mem.org_id === existing.id)?.orgs as any;
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

  const workspaces = Array.from(workspaceMap.values());
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getUserWorkspaces-result',message:'getUserWorkspaces returning',data:{userId,workspaceCount:workspaces.length,workspaces:workspaces.map(w=>({id:w.id,name:w.name,role:w.role,clerkOrgId:w.clerkOrgId}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return workspaces;
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
 * For members, checks onboarding status first - redirects to onboarding if needed
 */
export async function redirectToWorkspace(workspaceId: string): Promise<void> {
  const routeStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:redirectToWorkspace-start',message:'redirectToWorkspace start',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  const routeType = await getWorkspaceRoute(workspaceId);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:getWorkspaceRoute-completed',message:'getWorkspaceRoute completed',data:{workspaceId,routeType,elapsed:Date.now()-routeStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  
  if (!routeType) {
    redirect('/dashboard');
  }

  // For members, check onboarding status before redirecting to dashboard
  if (routeType === 'client') {
    const { userId } = await auth();
    if (userId) {
      // Handle Clerk org ID vs Supabase UUID
      let supabaseWorkspaceId = workspaceId;
      if (workspaceId.startsWith('org_')) {
        const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
        if (orgResult && 'data' in orgResult && orgResult.data) {
          supabaseWorkspaceId = orgResult.data;
        }
      }

      // Check if onboarding is needed
      const { isOnboardingEnabled, isOnboardingComplete, getPublishedOnboardingFlow } = await import('@/app/actions/onboarding');
      const onboardingEnabled = await isOnboardingEnabled(supabaseWorkspaceId);
      
      if (onboardingEnabled) {
        const flowResult = await getPublishedOnboardingFlow(supabaseWorkspaceId);
        const hasPublishedFlow = flowResult.data && flowResult.data.nodes && flowResult.data.nodes.length > 0;
        
        if (hasPublishedFlow) {
          const onboardingComplete = await isOnboardingComplete(supabaseWorkspaceId, userId);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routing.ts:onboarding-check',message:'Onboarding check in redirectToWorkspace',data:{workspaceId,supabaseWorkspaceId,onboardingEnabled,hasPublishedFlow,onboardingComplete,willRedirectToOnboarding:!onboardingComplete},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
          // #endregion
          
          if (!onboardingComplete) {
            // Redirect to onboarding instead of dashboard
            redirect(`/${workspaceId}/onboarding`);
            return;
          }
        }
      }
    }
    
    // Onboarding complete or not needed - redirect to dashboard
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
