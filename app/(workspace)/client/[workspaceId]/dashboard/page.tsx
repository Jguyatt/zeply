/**
 * Client Dashboard Page
 * Uses ClientDashboard component for detailed layout
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { 
  getDeliverables, 
  getRoadmapItems, 
  getWeeklyUpdates, 
  getPortalSettings 
} from '@/app/actions/deliverables';
import { isOnboardingEnabled } from '@/app/actions/onboarding';
import ClientDashboard from '@/app/components/ClientDashboard';
import { AlertCircle } from 'lucide-react';

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  // CRITICAL SECURITY CHECK
  await requireWorkspaceAccess(workspaceId, 'member', '/dashboard');

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

  // Get org info
  const { data: activeOrg, error: orgError } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', supabaseWorkspaceId)
    .maybeSingle();

  if (orgError || !activeOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-primary mb-2">Unable to load workspace</h2>
          <p className="text-secondary">Workspace not found</p>
        </div>
      </div>
    );
  }

  const orgDisplayName = (activeOrg as any)?.name || 'Organization';

  // NOTE: Onboarding check is handled in (org)/[orgId]/layout.tsx to prevent redirect loops
  // The layout will redirect to onboarding before this page loads if needed

  // Fetch all dashboard data
  const [deliverablesResult, roadmapResult, updatesResult, settingsResult, messagesResult, portalConfigResult, metricsResult] = await Promise.all([
    getDeliverables(supabaseWorkspaceId, true), // clientViewOnly=true
    getRoadmapItems(supabaseWorkspaceId),
    getWeeklyUpdates(supabaseWorkspaceId),
    getPortalSettings(supabaseWorkspaceId),
    (async () => {
      const { getRecentMessages } = await import('@/app/actions/messages');
      return getRecentMessages(supabaseWorkspaceId, 3);
    })(),
    (async () => {
      const { getClientPortalConfig } = await import('@/app/actions/client-portal');
      return getClientPortalConfig(supabaseWorkspaceId);
    })(),
    (async () => {
      const { getLatestMetrics } = await import('@/app/actions/metrics');
      return getLatestMetrics(supabaseWorkspaceId);
    })(),
  ]);

  const deliverables = deliverablesResult?.data || [];
  const roadmapItems = roadmapResult?.data || [];
  const weeklyUpdates = updatesResult?.data || [];
  const portalSettings = settingsResult?.data || null;
  const recentMessages = messagesResult?.data || [];
  const portalConfig = portalConfigResult?.data || null;

  // Merge dashboard_layout from client_portal_config with portal_settings
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

  // Fetch metrics
  let metrics = {
    leads: 0,
    spend: 0,
    cpl: 0,
    roas: 0,
    workCompleted: deliverables.filter((d: any) => d.status === 'delivered').length,
  };

  if (metricsResult && (metricsResult as any).data) {
    const latestMetrics = (metricsResult as any).data;
    metrics = {
      leads: latestMetrics.leads || 0,
      spend: Number(latestMetrics.spend) || 0,
      cpl: latestMetrics.cpl ? Number(latestMetrics.cpl) : 0,
      roas: latestMetrics.roas ? Number(latestMetrics.roas) : 0,
      workCompleted: deliverables.filter((d: any) => d.status === 'delivered').length,
    };
  }

  return (
    <ClientDashboard
      orgId={supabaseWorkspaceId}
      orgName={orgDisplayName}
      isAgencyMode={false}
      isClientMode={true}
      deliverables={deliverables}
      roadmapItems={roadmapItems}
      weeklyUpdates={weeklyUpdates}
      portalSettings={mergedSettings}
      metrics={metrics}
      userId={userId}
      isPreviewMode={false}
      recentMessages={recentMessages}
      dashboardLayout={portalConfig?.dashboard_layout as any}
      onboardingEnabled={await isOnboardingEnabled(supabaseWorkspaceId)}
      clerkOrgId={workspaceId}
      services={portalConfig?.services || {}}
    />
  );
}
