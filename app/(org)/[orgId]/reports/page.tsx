import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import ReportsList from '@/app/components/ReportsList';

/**
 * Performance Reports Page - Create and publish client-facing performance reports
 */
export default async function WorkspaceReportsPage({
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
  const isClientView = !isAdmin || isPreviewMode;

  // Fetch reports from database
  let reports: any[] = [];
  try {
    const { getReports } = await import('@/app/actions/reports');
    const reportsResult = await getReports(supabaseOrgId, isAdmin);
    
    if (reportsResult.data) {
      reports = reportsResult.data;
      // In client view, filter to only published and client-visible reports
      if (isClientView) {
        reports = reports.filter((r: any) => r.status === 'published' && r.client_visible !== false);
      }
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    // Use empty array if fetch fails
  }

  return (
    <ReportsList
      reports={reports}
      orgId={supabaseOrgId}
      isAdmin={isAdmin}
      isClientView={isClientView}
    />
  );
}
