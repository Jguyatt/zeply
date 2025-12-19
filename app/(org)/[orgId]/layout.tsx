/**
 * Workspace Layout - Org-scoped pages
 * Shows when an org is selected
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/auth/signin');
    }

    const supabase = await createServerClient();
    const { orgId } = await params;

    // Handle Clerk org ID vs Supabase UUID
    let supabaseOrgId = orgId;
  
    if (orgId.startsWith('org_')) {
      try {
        // This is a Clerk org ID, find or create the matching Supabase org
        const orgResult = await getSupabaseOrgIdFromClerk(orgId);
        
        if (orgResult && 'data' in orgResult) {
          supabaseOrgId = orgResult.data;
        } else {
          // Org doesn't exist yet - try to sync it
          // Function will fetch org name from Clerk automatically
          const syncResult = await syncClerkOrgToSupabase(orgId);
          
          if (syncResult && 'data' in syncResult) {
            supabaseOrgId = (syncResult.data as any).id;
          } else {
            // Fallback: redirect to dashboard
            redirect('/dashboard');
          }
        }
      } catch (error) {
        // Don't log NEXT_REDIRECT as an error - it's expected behavior
        if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        console.error('Error syncing org:', error);
        }
        redirect('/dashboard');
      }
    }

    // Ensure we have a valid org ID
    if (!supabaseOrgId) {
      redirect('/dashboard');
    }

    // Verify user has access to this org
    // Check membership first (fast database query)
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();

    // If no membership and this is a Clerk org, try to sync org (creates membership)
    if (!membership && orgId.startsWith('org_')) {
      // Try to sync the org (this will create membership with correct role from Clerk)
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        // Check membership again after sync
        const { data: finalMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (syncResult.data as any).id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!finalMembership) {
          // Still no membership - redirect (shouldn't happen, but safety check)
          redirect('/dashboard');
        }
      } else {
        // Sync failed - redirect
        redirect('/dashboard');
      }
    } else if (!membership) {
      // For non-Clerk orgs, try to add user as member if org exists
      const { data: orgExists } = await supabase
        .from('orgs')
        .select('id')
        .eq('id', supabaseOrgId)
        .maybeSingle();
      
      if (orgExists) {
        // Add user as member (default)
        await supabase
          .from('org_members')
          .upsert({
            org_id: supabaseOrgId,
            user_id: userId,
            role: 'member', // Default to member for non-Clerk orgs
          } as any, {
            onConflict: 'org_id,user_id',
          });
      } else {
        redirect('/dashboard');
      }
    }

    // ENFORCE ACCESS CONTROL:
    // 1. Get final membership status (after all sync attempts)
    let finalMembership = membership;
    if (!finalMembership) {
      try {
        const { data: checkMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', supabaseOrgId)
          .eq('user_id', userId)
          .maybeSingle();
        finalMembership = checkMembership;
      } catch (error) {
        console.error('Error checking membership:', error);
        redirect('/dashboard');
      }
    }

    // 2. If user is not a member of this org, redirect appropriately
    if (!finalMembership) {
      try {
        const { isUserAdmin, getUserFirstMemberOrg } = await import('@/app/lib/auth');
        const userIsAdmin = await isUserAdmin();
        
        if (userIsAdmin) {
          // Admin trying to access org they're not a member of - redirect to HQ
          redirect('/dashboard');
        } else {
          // Member trying to access org they're not a member of - redirect to their org
          const memberOrgId = await getUserFirstMemberOrg();
          if (memberOrgId) {
            const { data: org } = await supabase
              .from('orgs')
              .select('clerk_org_id')
              .eq('id', memberOrgId)
              .maybeSingle();
            
            if (org && (org as any).clerk_org_id) {
              redirect(`/${(org as any).clerk_org_id}/dashboard`);
            }
          }
          redirect('/dashboard');
        }
      } catch (error) {
        console.error('Error in access control check:', error);
        redirect('/dashboard');
      }
    }

    // 3. If user is a member (not admin), ensure they can only access their own org
    const userRole = (finalMembership as any)?.role || 'member';
    const isMemberOnly = userRole === 'member';
    
    // Sync role from Clerk in background (non-blocking) for Clerk orgs
    // This ensures roles stay in sync but doesn't delay page rendering
    if (orgId.startsWith('org_')) {
      const { syncUserRoleFromClerk } = await import('@/app/actions/orgs');
      // Don't await - let it run in background
      syncUserRoleFromClerk(orgId, supabaseOrgId, userId).catch((err) => {
        // Silently fail - role sync is best effort, not critical for rendering
        console.error('Background role sync failed:', err);
      });
    }
    
    if (isMemberOnly) {
      try {
        // Member can only access this org - verify they're accessing the right one
        // Get all orgs user is a member of
        const { data: userMemberships } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', userId);
        
        const userOrgIds = (userMemberships || []).map((m: any) => m.org_id);
        
        // If user is trying to access an org they're not a member of, redirect to their first org
        if (!userOrgIds.includes(supabaseOrgId)) {
          const { getUserFirstMemberOrg } = await import('@/app/lib/auth');
          const memberOrgId = await getUserFirstMemberOrg();
          
          if (memberOrgId) {
            const { data: org } = await supabase
              .from('orgs')
              .select('clerk_org_id')
              .eq('id', memberOrgId)
              .maybeSingle();
            
            if (org && (org as any).clerk_org_id) {
              redirect(`/${(org as any).clerk_org_id}/dashboard`);
            }
          }
          redirect('/dashboard');
        }
      } catch (error) {
        console.error('Error verifying member org access:', error);
        redirect('/dashboard');
      }
    }

    // Update active org in profile (use maybeSingle to handle missing profile)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        active_org_id: supabaseOrgId,
      } as any, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    // ONBOARDING GATE: Check if member needs to complete onboarding
    if (userRole === 'member') {
      const { isOnboardingEnabled, isOnboardingComplete, getPublishedOnboardingFlow } = await import('@/app/actions/onboarding');
      const onboardingEnabled = await isOnboardingEnabled(supabaseOrgId);
      
      if (onboardingEnabled) {
        // Check if there's a published flow with nodes
        const flowResult = await getPublishedOnboardingFlow(supabaseOrgId);
        const hasPublishedFlow = flowResult.data && flowResult.data.nodes && flowResult.data.nodes.length > 0;
        
        if (hasPublishedFlow) {
          // Get current pathname from headers (use x-pathname set by middleware)
          const headersList = await headers();
          const xPathname = headersList.get('x-pathname') || '';
          
          // Check if user is already on onboarding page
          const isOnboardingPage = xPathname.includes('/onboarding');
          
          if (!isOnboardingPage) {
            const onboardingComplete = await isOnboardingComplete(supabaseOrgId, userId);
            
            if (!onboardingComplete) {
              // Get Clerk org ID for redirect
              const { data: org } = await supabase
                .from('orgs')
                .select('clerk_org_id')
                .eq('id', supabaseOrgId)
                .maybeSingle();
              
              if (org && (org as any).clerk_org_id) {
                redirect(`/${(org as any).clerk_org_id}/onboarding`);
              } else {
                // Fallback to UUID if no Clerk org ID
                redirect(`/${supabaseOrgId}/onboarding`);
              }
            }
          }
        }
      }
    }
    // Admins and owners always bypass onboarding gate

    // REDIRECT: Route to new canonical routes based on role
    // This makes new routes canonical while old routes still work (via redirect)
    // Happens AFTER onboarding check so members complete onboarding first
    // BUT: Only redirect if we're on an old route pattern (not already on /client/ or /admin/)
    const workspaceId = orgId; // Use original orgId (could be Clerk org ID or UUID)
    
    // Check current pathname to avoid redirect loops
    const headersList2 = await headers();
    const xPathname = headersList2.get('x-pathname');
    const referer = headersList2.get('referer');
    const currentPathname = xPathname || referer || '';
    // Extract actual pathname from full URL if needed
    let cleanPathname = currentPathname;
    try {
      if (currentPathname.startsWith('http')) {
        const url = new URL(currentPathname);
        cleanPathname = url.pathname;
      }
    } catch {
      // If URL parsing fails, use pathname as-is
    }
    const isOnboardingPage = cleanPathname.includes('/onboarding');
    const isAlreadyOnCanonicalRoute = cleanPathname.includes('/client/') || cleanPathname.includes('/admin/');
    // Allow /messages, /projects, /reports, /setup routes to work without redirect
    const isAllowedOldRoute = cleanPathname.includes('/messages') || 
                              cleanPathname.includes('/projects') || 
                              cleanPathname.includes('/reports') || 
                              cleanPathname.includes('/setup');
    
    // Only redirect if NOT already on canonical route AND NOT on an allowed old route AND NOT on onboarding
    if (!isAlreadyOnCanonicalRoute && !isAllowedOldRoute && !isOnboardingPage) {
      if (userRole === 'member') {
        // Member → client route
        redirect(`/client/${workspaceId}/dashboard`);
      } else if (userRole === 'admin' || userRole === 'owner') {
        // Admin/Owner → admin route
        redirect(`/admin/${workspaceId}/dashboard`);
      }
    }

    // Onboarding page should be full-screen without sidebar/topbar
    if (isOnboardingPage) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen bg-charcoal flex flex-col relative">
        {/* Premium Background Gradient */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-premium opacity-100" />
        {/* Noise Texture */}
        <div className="pointer-events-none fixed inset-0 bg-noise" />
        
        <TopBar />
        <div className="flex flex-1 relative z-10">
          <Sidebar />
          <main className="flex-1 ml-56 transition-all duration-300">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    // Don't log NEXT_REDIRECT as an error - it's expected behavior
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
    console.error('Error in WorkspaceLayout:', error);
    }
    // Redirect to dashboard on any error to prevent RSC payload failures
    redirect('/dashboard');
  }
}