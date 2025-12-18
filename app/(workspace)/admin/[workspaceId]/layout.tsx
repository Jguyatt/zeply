/**
 * Admin Workspace Layout
 * Admin-only layout with full access
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { requireWorkspaceAccess } from '@/app/lib/security';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';

export default async function AdminWorkspaceLayout({
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

    // CRITICAL SECURITY CHECK: Verify user is admin/owner
    const userRole = await requireWorkspaceAccess(workspaceId, 'admin', '/dashboard');

    // If we get here, user is authorized
    const supabase = await createServerClient();

    // Handle Clerk org ID vs Supabase UUID
    let supabaseWorkspaceId = workspaceId;
    if (workspaceId.startsWith('org_')) {
      const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
      if (orgResult && 'data' in orgResult && orgResult.data) {
        supabaseWorkspaceId = orgResult.data;
      } else {
        redirect('/dashboard');
      }
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
      console.error('Error in admin workspace layout:', error);
    }
    redirect('/dashboard');
  }
}
