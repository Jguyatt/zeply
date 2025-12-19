/**
 * Admin Dashboard Page
 * Renders the workspace dashboard for admin/owner users
 */

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  getDeliverables, 
  getRoadmapItems, 
  getWeeklyUpdates, 
  getPortalSettings 
} from '@/app/actions/deliverables';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { createServerClient } from '@/lib/supabase/server';
import ClientDashboard from '@/app/components/ClientDashboard';
import { isOnboardingEnabled, getOnboardingStatus } from '@/app/actions/onboarding';

export default async function AdminDashboardPage({
  params: paramsPromise,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await paramsPromise;
  
  // CRITICAL SECURITY CHECK: Verify user is admin/owner
  await requireWorkspaceAccess(workspaceId, 'admin', '/dashboard');

  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/signin');
  }

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

  const supabase = await createServerClient();
  const user = await currentUser();

  // Get workspace info
  const { data: org } = await supabase
    .from('orgs')
    .select('name, clerk_org_id')
    .eq('id', supabaseWorkspaceId)
    .maybeSingle();

  const orgName = (org as any)?.name || 'Workspace';
  // Use workspaceId if it's already a Clerk org ID, otherwise use clerk_org_id from org
  const clerkOrgId = workspaceId.startsWith('org_') ? workspaceId : ((org as any)?.clerk_org_id || workspaceId);

  // Fetch dashboard data
  const [deliverablesResult, roadmapResult, updatesResult, portalSettingsResult] = await Promise.all([
    getDeliverables(supabaseWorkspaceId, false), // admin view - show all
    getRoadmapItems(supabaseWorkspaceId, false), // admin view - show all
    getWeeklyUpdates(supabaseWorkspaceId, false), // admin view - show all
    getPortalSettings(supabaseWorkspaceId),
  ]);

  const deliverables = deliverablesResult.data || [];
  const roadmapItems = roadmapResult.data || [];
  const weeklyUpdates = updatesResult.data || [];
  const portalSettings = portalSettingsResult.data || null;

  // Get metrics
  const { getLatestMetrics } = await import('@/app/actions/metrics');
  const metricsResult = await getLatestMetrics(supabaseWorkspaceId);
  // Fix: Type assertion to handle union type narrowing issue
  const latestMetrics = metricsResult && 'data' in metricsResult ? (metricsResult as any).data : null;

  const metrics = {
    leads: latestMetrics?.leads || 0,
    spend: Number(latestMetrics?.spend) || 0,
    cpl: latestMetrics?.cpl ? Number(latestMetrics.cpl) : 0,
    roas: latestMetrics?.roas ? Number(latestMetrics.roas) : 0,
    workCompleted: deliverables.filter((d: any) => d.status === 'delivered').length,
  };

  // Get recent messages
  const { getRecentMessages } = await import('@/app/actions/messages');
  const messagesResult = await getRecentMessages(supabaseWorkspaceId, 3);
  const recentMessages = messagesResult.data || [];

  // Get portal config for dashboard layout
  const { getClientPortalConfig } = await import('@/app/actions/client-portal');
  const portalConfigResult = await getClientPortalConfig(supabaseWorkspaceId);
  const portalConfig = portalConfigResult.data || null;

  // Check onboarding status (only if enabled)
  const onboardingEnabled = await isOnboardingEnabled(supabaseWorkspaceId);
  const onboardingStatus = onboardingEnabled 
    ? await getOnboardingStatus(supabaseWorkspaceId)
    : { status: 'completed' as const, hasPublishedFlow: false, hasNodes: false, allClientsOnboarded: true };

  // Merge dashboard layout settings
  let mergedSettings = portalSettings;
  if (portalConfig && portalConfig.dashboard_layout) {
    const layout = portalConfig.dashboard_layout;
    const sections = (layout.sections || []) as string[];
    const kpis = (layout.kpis || []) as string[];
    
    const enabledSections = {
      executive_summary: sections.includes('kpis'),
      deliverables: sections.includes('deliverables'),
      roadmap: sections.includes('roadmap'),
      reports: sections.includes('reports'),
      updates: sections.includes('updates'),
    };
    
    const metricsConfig = {
      leads: kpis.includes('leads'),
      spend: kpis.includes('spend'),
      cpl: kpis.includes('cpl'),
      roas: kpis.includes('roas'),
      work_completed: kpis.includes('work_completed'),
    };
    
    mergedSettings = {
      ...portalSettings,
      enabled_sections: enabledSections,
      metrics_config: metricsConfig,
    };
  }

  return (
    <ClientDashboard
      orgId={supabaseWorkspaceId}
      orgName={orgName}
      isAgencyMode={true}
      isClientMode={false}
      deliverables={deliverables}
      roadmapItems={roadmapItems}
      weeklyUpdates={weeklyUpdates}
      portalSettings={mergedSettings}
      metrics={metrics}
      userId={userId}
      isPreviewMode={false}
      recentMessages={recentMessages}
      dashboardLayout={portalConfig?.dashboard_layout as any}
      onboardingEnabled={onboardingEnabled}
      onboardingStatus={onboardingStatus}
      clerkOrgId={clerkOrgId}
      services={portalConfig?.services || {}}
    />
  );
}
