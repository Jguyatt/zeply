/**
 * Client Workspace Layout
 * Client-only layout with role verification and restricted navigation
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { requireWorkspaceAccess } from '@/app/lib/security';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/auth/signin');
    }

    const { workspaceId } = await params;

    // Handle Clerk org ID vs Supabase UUID first (needed for security check)
    let supabaseWorkspaceId = workspaceId;
    if (workspaceId.startsWith('org_')) {
      const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
      if (orgResult && 'data' in orgResult && orgResult.data) {
        supabaseWorkspaceId = orgResult.data;
      } else {
        redirect('/dashboard');
      }
    }

    // CRITICAL SECURITY CHECK: Verify user is member with role='member'
    // This is the PRIMARY authorization - middleware is just UX
    const userRole = await requireWorkspaceAccess(workspaceId, 'member', '/dashboard');

    // If we get here, user is authorized (requireWorkspaceAccess would have redirected)
    const supabase = await createServerClient();

    // Sync role from Clerk in background (non-blocking)
    // This ensures roles stay in sync but doesn't delay page rendering
    if (workspaceId.startsWith('org_')) {
      const { syncUserRoleFromClerk } = await import('@/app/actions/orgs');
      const { userId } = await auth();
      if (userId) {
        // Don't await - let it run in background
        syncUserRoleFromClerk(workspaceId, supabaseWorkspaceId, userId).catch((err) => {
          // Silently fail - role sync is best effort, not critical for rendering
          console.error('Background role sync failed:', err);
        });
      }
    }

    // ONBOARDING GATE: Check if member needs to complete onboarding
    // Redirect to org route structure for onboarding (which has its own layout)
    // Only members need onboarding (admins bypass)
    if (userRole === 'member') {
      const { isOnboardingEnabled, isOnboardingComplete, getPublishedOnboardingFlow } = await import('@/app/actions/onboarding');
      const onboardingEnabled = await isOnboardingEnabled(supabaseWorkspaceId);
      
      if (onboardingEnabled) {
        // Check if there's a published flow with nodes
        const flowResult = await getPublishedOnboardingFlow(supabaseWorkspaceId);
        const hasPublishedFlow = flowResult.data && flowResult.data.nodes && flowResult.data.nodes.length > 0;
        
        if (hasPublishedFlow) {
          // Get current pathname from headers (use x-pathname set by middleware)
          const headersList = await headers();
          const xPathname = headersList.get('x-pathname') || '';
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/[workspaceId]/layout.tsx:onboarding-gate',message:'Client layout onboarding gate check',data:{workspaceId,userRole,xPathname,isOnboardingPage:xPathname.includes('/onboarding'),onboardingEnabled,hasPublishedFlow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          
          // Check if user is already on onboarding page - if so, don't redirect (let org layout handle it)
          const isOnboardingPage = xPathname.includes('/onboarding');
          
          if (!isOnboardingPage) {
            const onboardingComplete = await isOnboardingComplete(supabaseWorkspaceId, userId);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/[workspaceId]/layout.tsx:redirect-decision',message:'Client layout redirect decision',data:{workspaceId,onboardingComplete,willRedirect:!onboardingComplete,redirectTarget:`/${workspaceId}/onboarding`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            // #endregion
            
            if (!onboardingComplete) {
              // Redirect to onboarding page using org route structure
              // The org layout will handle the onboarding flow
              redirect(`/${workspaceId}/onboarding`);
            }
          }
        }
      }
    }
    // Admins and owners always bypass onboarding gate

    // Get workspace name for display
    const { data: org } = await supabase
      .from('orgs')
      .select('name')
      .eq('id', supabaseWorkspaceId)
      .maybeSingle();

    const orgName = (org as any)?.name || 'Workspace';

    return (
      <div className="min-h-screen bg-charcoal flex flex-col relative">
        {/* Premium Background Gradient */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-premium opacity-100" />
        {/* Noise Texture */}
        <div className="pointer-events-none fixed inset-0 bg-noise" />
        
        <TopBar />
        <div className="flex flex-1 relative z-10">
          {/* Sidebar with client view - hides admin items */}
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
      console.error('Error in client workspace layout:', error);
    }
    redirect('/dashboard');
  }
}
