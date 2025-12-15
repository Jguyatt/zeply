import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import { Clock } from 'lucide-react';

/**
 * Workspace Activity Page - Timeline of client workspace activity
 */
export default async function WorkspaceActivityPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      // Try to sync the org
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
  }

  // Verify user has access to this org
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  // If no membership and we just created the org, wait a moment and check again
  if (!membership && orgId.startsWith('org_')) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { data: retryMembership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!retryMembership) {
      const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        const { data: finalMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (syncResult.data as any).id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!finalMembership) {
          redirect('/dashboard');
        }
      } else {
        redirect('/dashboard');
      }
    }
  } else if (!membership) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-primary">Activity</h1>
          <p className="text-secondary mt-2">Timeline of client workspace activity</p>
        </div>
      </div>

      <div className="glass-surface rounded-lg shadow-prestige-soft p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Clock className="w-12 h-12 text-muted mb-4" />
          <p className="text-secondary text-lg mb-2">Activity timeline coming soon</p>
          <p className="text-muted text-sm text-center max-w-md">
            Track deliverable publications, client approvals, report sends, onboarding completions, and setup changes.
          </p>
        </div>
      </div>
    </div>
  );
}

