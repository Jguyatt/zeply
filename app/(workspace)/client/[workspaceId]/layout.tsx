/**
 * Client Workspace Layout
 * Client-only layout with role verification and restricted navigation
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
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
