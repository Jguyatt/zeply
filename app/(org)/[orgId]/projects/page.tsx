import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getDeliverables } from '@/app/actions/deliverables';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import DeliverablesList from '@/app/components/DeliverablesList';

/**
 * Deliverables Page - Delivery pipeline for client-facing work
 */
export default async function DeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const { mode } = await searchParams;
  const isPreviewMode = mode === 'client';
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    const { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
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

  const userRole = (membership as any)?.role || 'member';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  // Members should always see client view, admins see agency view unless in preview mode
  const isClientView = userRole === 'member' || isPreviewMode;

  // Get deliverables - filter by client visibility in client view
  let deliverablesQuery = supabase
    .from('deliverables')
    .select('*, deliverable_assets(*), deliverable_comments(*)')
    .eq('org_id', supabaseOrgId);
  
  // In client view, only show client-visible items (exclude drafts)
  if (isClientView) {
    deliverablesQuery = deliverablesQuery
      .or('client_visible.is.null,client_visible.eq.true')
      .neq('status', 'draft');
  }
  
  const { data: deliverables, error } = await deliverablesQuery
    .order('created_at', { ascending: false });

  return (
    <DeliverablesList
      deliverables={deliverables || []}
      orgId={supabaseOrgId}
      isAdmin={isAdmin}
      isClientView={isClientView}
    />
  );
}
