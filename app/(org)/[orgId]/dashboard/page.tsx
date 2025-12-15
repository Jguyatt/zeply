import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  getDeliverables, 
  getRoadmapItems, 
  getWeeklyUpdates, 
  getPortalSettings 
} from '@/app/actions/deliverables';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import ClientDashboard from '@/app/components/ClientDashboard';

/**
 * Client Workspace Dashboard
 * Two modes: client_mode (read-only) and agency_mode (edit/publish)
 */
export default async function ClientWorkspaceDashboard({
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
  const user = await currentUser();
  const supabase = await createServerClient();
  
  // Check for preview mode (agency viewing as client)
  const isPreviewMode = mode === 'client';

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    // This is a Clerk org ID, find or create the matching Supabase org
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      // Org doesn't exist yet - try to sync it
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
  }

  // Get org info
  const { data: activeOrg } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', supabaseOrgId)
    .maybeSingle();

  if (!activeOrg) {
    redirect('/dashboard');
  }

  // Get user's role in active org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role, orgs!inner(kind)')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    // User is not a member - check if they're an admin elsewhere
    const { isUserAdmin, getUserFirstMemberOrg } = await import('@/app/lib/auth');
    const userIsAdmin = await isUserAdmin();
    
    if (userIsAdmin) {
      redirect('/dashboard');
    } else {
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
  }

  const userRole = (membership as any)?.role || 'member';
  const orgKind = (membership as any)?.orgs?.kind || 'client';
  
  // Determine if user is agency (can edit) or client (read-only)
  // CRITICAL: Check role ONLY in CURRENT org, never globally
  // Agency mode: User is owner/admin IN THIS SPECIFIC ORG
  // OR user is agency admin managing this client org
  // BUT: if preview mode is enabled, force client mode
  let isAgencyMode = false;
  
  if (!isPreviewMode) {
    // PRIMARY CHECK: User must be owner/admin IN THIS SPECIFIC ORG
    // Members in this org are locked to client view
    if (['owner', 'admin'].includes(userRole)) {
      isAgencyMode = true;
    } else if (userRole === 'member') {
      // Member in current org - check if they're agency admin managing this client
      // This allows agency admins to manage client orgs they have access to
      if (orgKind === 'client') {
        const { data: agencyAccess } = await supabase
          .from('agency_clients')
          .select('agency_org_id')
          .eq('client_org_id', supabaseOrgId)
          .maybeSingle();
        
        if (agencyAccess && (agencyAccess as any).agency_org_id) {
          const { data: agencyMembership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', (agencyAccess as any).agency_org_id)
            .eq('user_id', userId)
            .maybeSingle();
          
          // Only allow if user is actually an agency admin (owner/admin in agency org)
          if (agencyMembership && ['owner', 'admin'].includes((agencyMembership as any).role)) {
            isAgencyMode = true;
          }
        }
      }
      // If user is a member in current org and not an agency admin, isAgencyMode stays false
    }
  }
  
  const isClientMode = !isAgencyMode || isPreviewMode;
  
  // Check if onboarding should be shown
  const { data: onboardingConfig } = await supabase
    .from('client_portal_config')
    .select('onboarding_enabled')
    .eq('org_id', supabaseOrgId)
    .maybeSingle();
  
  const onboardingEnabled = (onboardingConfig as any)?.onboarding_enabled || false;
  
  // Get onboarding progress if enabled
  let showOnboarding = false;
  if (onboardingEnabled && isClientMode && !isPreviewMode) {
    const { getOnboardingItems, getOnboardingProgress } = await import('@/app/actions/client-portal');
    const [itemsResult, progressResult] = await Promise.all([
      getOnboardingItems(supabaseOrgId),
      getOnboardingProgress(supabaseOrgId, userId),
    ]);
    
    const items = itemsResult.data || [];
    const progress = progressResult.data || [];
    
    // Check if there are required items not completed
    const requiredItems = items.filter((item: any) => item.required);
    const completedItemIds = new Set(progress.filter((p: any) => p.status === 'completed').map((p: any) => p.item_id));
    const incompleteRequired = requiredItems.filter((item: any) => !completedItemIds.has(item.id));
    
    showOnboarding = incompleteRequired.length > 0;
  }

  // Fetch all dashboard data
  const [deliverablesResult, roadmapResult, updatesResult, settingsResult, messagesResult, portalConfigResult] = await Promise.all([
    getDeliverables(supabaseOrgId),
    getRoadmapItems(supabaseOrgId),
    getWeeklyUpdates(supabaseOrgId),
    getPortalSettings(supabaseOrgId),
    (async () => {
      const { getRecentMessages } = await import('@/app/actions/messages');
      return getRecentMessages(supabaseOrgId, 3);
    })(),
    (async () => {
      const { getClientPortalConfig } = await import('@/app/actions/client-portal');
      return getClientPortalConfig(supabaseOrgId);
    })(),
  ]);

  const deliverables = deliverablesResult?.data || [];
  const roadmapItems = roadmapResult?.data || [];
  const weeklyUpdates = updatesResult?.data || [];
  const portalSettings = settingsResult?.data || null;
  const recentMessages = messagesResult?.data || [];
  const portalConfig = portalConfigResult?.data || null;
  
  // Merge dashboard_layout from client_portal_config with portal_settings
  // This allows the ClientSetup to override which sections/KPIs are shown
  let mergedSettings = portalSettings;
  if (portalConfig && portalConfig.dashboard_layout) {
    const layout = portalConfig.dashboard_layout;
    const sections = layout.sections || [];
    const kpis = layout.kpis || [];
    
    // Convert sections array to enabled_sections object format
    const enabledSections = {
      executive_summary: sections.includes('kpis'),
      deliverables: sections.includes('deliverables'),
      roadmap: sections.includes('roadmap'),
      reports: sections.includes('reports'),
      updates: sections.includes('updates'),
    };
    
    // Convert KPIs array to metrics_config object format
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

  // Fetch metrics from database
  let metrics = {
    leads: 0,
    spend: 0,
    cpl: 0,
    roas: 0,
    workCompleted: deliverables.filter((d: any) => d.status === 'delivered').length,
  };

  try {
    const { getLatestMetrics } = await import('@/app/actions/metrics');
    const metricsResult = await getLatestMetrics(supabaseOrgId);
    
    if (metricsResult && 'data' in metricsResult && metricsResult.data) {
      const latestMetrics = metricsResult.data;
      metrics = {
        leads: latestMetrics.leads || 0,
        spend: Number(latestMetrics.spend) || 0,
        cpl: latestMetrics.cpl ? Number(latestMetrics.cpl) : 0,
        roas: latestMetrics.roas ? Number(latestMetrics.roas) : 0,
        workCompleted: deliverables.filter((d: any) => d.status === 'delivered').length,
      };
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Use defaults if fetch fails
  }

  // If onboarding should be shown, render onboarding screen instead
  if (showOnboarding) {
    const { default: OnboardingScreen } = await import('@/app/components/OnboardingScreen');
    return (
      <OnboardingScreen
        orgId={supabaseOrgId}
        orgName={(activeOrg as any)?.name || 'Organization'}
        userId={userId}
      />
    );
  }

  return (
    <ClientDashboard
      orgId={supabaseOrgId}
      orgName={(activeOrg as any)?.name || 'Organization'}
      isAgencyMode={isAgencyMode}
      isClientMode={isClientMode}
      deliverables={deliverables}
      roadmapItems={roadmapItems}
      weeklyUpdates={weeklyUpdates}
      portalSettings={mergedSettings}
      metrics={metrics}
      userId={userId}
      isPreviewMode={isPreviewMode}
      recentMessages={recentMessages}
    />
  );
}
