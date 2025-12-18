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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:17',message:'OLD dashboard page accessed - should redirect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  const { userId } = await auth();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:28',message:'After auth',data:{hasUserId:!!userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const { mode } = await searchParams;
  const user = await currentUser();
  const supabase = await createServerClient();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:36',message:'ClientWorkspaceDashboard entry',data:{orgId,userId,hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Check for preview mode (agency viewing as client)
  const isPreviewMode = mode === 'client';

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:42',message:'Looking up Clerk org in dashboard',data:{clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // This is a Clerk org ID, find or create the matching Supabase org
    let orgResult;
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:51',message:'Before getSupabaseOrgIdFromClerk',data:{clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      orgResult = await getSupabaseOrgIdFromClerk(orgId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:55',message:'Dashboard org lookup result',data:{hasData:'data' in orgResult,hasError:'error' in orgResult,supabaseOrgId:orgResult && 'data' in orgResult ? orgResult.data : null,error:orgResult && 'error' in orgResult ? orgResult.error : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:59',message:'getSupabaseOrgIdFromClerk error',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error;
    }
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      // Org doesn't exist yet - try to sync it
      // Function will fetch org name from Clerk automatically
      const syncResult = await syncClerkOrgToSupabase(orgId);
      
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:60',message:'Dashboard final supabaseOrgId',data:{supabaseOrgId,originalOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Get org info
  let activeOrg;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:77',message:'Before org query',data:{supabaseOrgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase
      .from('orgs')
      .select('*')
      .eq('id', supabaseOrgId)
      .maybeSingle();
    
    activeOrg = data;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:85',message:'Active org fetched',data:{hasOrg:!!activeOrg,hasError:!!error,error:error?.message,orgName:(activeOrg as any)?.name,orgId:(activeOrg as any)?.id,clerkOrgId:(activeOrg as any)?.clerk_org_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:89',message:'Org query error',data:{error:error.message,code:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:93',message:'Org fetch exception',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }

  if (!activeOrg) {
    redirect('/dashboard');
  }

  // Ensure we have a proper org name (fetch from Clerk if needed)
  let orgDisplayName = (activeOrg as any)?.name;
  if (!orgDisplayName || orgDisplayName === 'Organization') {
    if (orgId.startsWith('org_')) {
      // Try to fetch from Clerk and update
      const syncResult = await syncClerkOrgToSupabase(orgId);
      if (syncResult && 'data' in syncResult) {
        orgDisplayName = (syncResult.data as any).name;
        // Re-fetch org to get updated name
        const { data: updatedOrg } = await supabase
          .from('orgs')
          .select('name')
          .eq('id', supabaseOrgId)
          .maybeSingle();
        if (updatedOrg) {
          orgDisplayName = (updatedOrg as any).name;
        }
      }
    }
  }
  if (!orgDisplayName || orgDisplayName === 'Organization') {
    orgDisplayName = 'Organization';
  }

  // Get user's role in active org
  let membership;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:116',message:'Before membership query',data:{supabaseOrgId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase
      .from('org_members')
      .select('role, orgs!inner(kind)')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();
    
    membership = data;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:125',message:'Membership query result',data:{hasMembership:!!membership,hasError:!!error,error:error?.message,role:(membership as any)?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:129',message:'Membership query error',data:{error:error.message,code:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:133',message:'Membership fetch exception',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw error;
  }

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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:221',message:'Before Promise.all fetch',data:{supabaseOrgId,isClientMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // Fetch all dashboard data
  let deliverablesResult, roadmapResult, updatesResult, settingsResult, messagesResult, portalConfigResult;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:225',message:'Starting Promise.all',data:{supabaseOrgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    [deliverablesResult, roadmapResult, updatesResult, settingsResult, messagesResult, portalConfigResult] = await Promise.all([
      getDeliverables(supabaseOrgId, isClientMode),
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:240',message:'Promise.all completed',data:{hasDeliverables:!!deliverablesResult,hasRoadmap:!!roadmapResult,hasUpdates:!!updatesResult,hasSettings:!!settingsResult,hasMessages:!!messagesResult,hasConfig:!!portalConfigResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:243',message:'Promise.all error',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }

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
    // FIX: Cast these arrays to string[] to avoid 'never' type inference
    const sections = (layout.sections || []) as string[];
    const kpis = (layout.kpis || []) as string[];
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:287',message:'Before getLatestMetrics',data:{supabaseOrgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    const { getLatestMetrics } = await import('@/app/actions/metrics');
    const metricsResult = await getLatestMetrics(supabaseOrgId);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:291',message:'After getLatestMetrics',data:{hasResult:!!metricsResult,hasData:metricsResult && 'data' in metricsResult,hasError:metricsResult && 'error' in metricsResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
  // FIX: Cast metricsResult to 'any' and include ALL properties in one object
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
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:304',message:'Metrics fetch error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Error fetching metrics:', error);
    // Use defaults if fetch fails
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:308',message:'Before render decision',data:{showOnboarding,deliverablesCount:deliverables.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  // If onboarding should be shown, render onboarding screen instead
  if (showOnboarding) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:311',message:'Rendering OnboardingScreen',data:{supabaseOrgId,orgDisplayName,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    const { default: OnboardingScreen } = await import('@/app/components/OnboardingScreen');
    return (
      <OnboardingScreen
        orgId={supabaseOrgId}
        orgName={orgDisplayName}
        userId={userId}
      />
    );
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:320',message:'Rendering ClientDashboard',data:{supabaseOrgId,isAgencyMode,isClientMode,deliverablesCount:deliverables.length,roadmapCount:roadmapItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

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
      dashboardLayout={portalConfig?.dashboard_layout as any}
    />
  );
}