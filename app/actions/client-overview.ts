/**
 * Server Actions for Client Overview
 * All functions verify role='member' before returning data
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { verifyWorkspaceAccess } from '@/app/lib/security';
import { getDeliverables, getRoadmapItems, getWeeklyUpdates, getPortalSettings } from '@/app/actions/deliverables';
import { getLatestMetrics } from '@/app/actions/metrics';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

/**
 * Get comprehensive client overview data
 * CRITICAL: Verifies user is member before returning ANY data
 */
export async function getClientOverview(workspaceId: string) {
  const actionStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:19',message:'getClientOverview action start',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // HARD REQUIREMENT: Verify access first (fast - uses database, not Clerk)
  const verifyStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:22',message:'verifyWorkspaceAccess start',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const { allowed, role, error: accessError } = await verifyWorkspaceAccess(workspaceId, 'member');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:25',message:'verifyWorkspaceAccess completed',data:{allowed,role,elapsed:Date.now()-verifyStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  if (!allowed || role !== 'member') {
    return { error: accessError || 'Unauthorized' };
  }

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgLookupStart = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:33',message:'getSupabaseOrgIdFromClerk start',data:{workspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:36',message:'getSupabaseOrgIdFromClerk completed',data:{hasData:'data' in orgResult,elapsed:Date.now()-orgLookupStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      return { error: 'Workspace not found' };
    }
  }

  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Fetch workspace name and all data in parallel for faster loading
  const dataFetchStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:52',message:'Promise.all data fetch start',data:{supabaseWorkspaceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const [orgResult, deliverablesResult, roadmapResult, updatesResult, portalSettingsResult, metricsResult] = await Promise.all([
    supabase.from('orgs').select('name').eq('id', supabaseWorkspaceId).maybeSingle(),
    getDeliverables(supabaseWorkspaceId, true), // clientViewOnly=true
    getRoadmapItems(supabaseWorkspaceId, true), // clientViewOnly=true
    getWeeklyUpdates(supabaseWorkspaceId, true), // clientViewOnly=true
    getPortalSettings(supabaseWorkspaceId),
    getLatestMetrics(supabaseWorkspaceId),
  ]);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-overview.ts:60',message:'Promise.all data fetch completed',data:{elapsed:Date.now()-dataFetchStart,totalElapsed:Date.now()-actionStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const orgName = (orgResult.data as any)?.name || 'Workspace';

  // Get recent deliverables (3 most recent)
  const deliverables = deliverablesResult.data || [];
  const recentDeliverables = deliverables
    .filter((d: any) => d.client_visible !== false)
    .slice(0, 3);

  // Get "What's Next" items (2-3 roadmap items)
  const roadmapItems = roadmapResult.data || [];
  const nextActions = roadmapItems
    .filter((item: any) => item.client_visible !== false)
    .slice(0, 3);

  // Get recent updates (5 most recent)
  const weeklyUpdates = updatesResult.data || [];

  // Calculate metrics
  // Fix: Type assertion to handle union type narrowing issue
  const latestMetrics = metricsResult && 'data' in metricsResult ? (metricsResult as any).data : null;
  const metrics = {
    leads: latestMetrics?.leads || 0,
    spend: latestMetrics?.spend || 0,
    cpl: latestMetrics?.cpl || 0,
    roas: latestMetrics?.roas || 0,
    workCompleted: deliverables.filter((d: any) => d.status === 'complete' || d.status === 'approved').length,
  };

  // Get items needing client action
  const needsYou = [
    ...deliverables.filter((d: any) => d.status === 'in_review'),
    ...roadmapItems.filter((item: any) => item.client_visible && item.timeframe === 'blocker'),
  ].slice(0, 3);

  // Get last updated timestamp (most recent update across all data)
  // Fix: Type assertion to handle union type narrowing issue
  const deliverablesAny = deliverables as any[];
  const weeklyUpdatesAny = weeklyUpdates as any[];
  const lastUpdated = Math.max(
    deliverablesAny.length > 0 ? new Date(deliverablesAny[0].updated_at || deliverablesAny[0].created_at).getTime() : 0,
    weeklyUpdatesAny.length > 0 ? new Date(weeklyUpdatesAny[0].published_at || weeklyUpdatesAny[0].created_at).getTime() : 0,
    Date.now() // Fallback to now
  );

  return {
    data: {
      orgId: supabaseWorkspaceId,
      orgName,
      recentDeliverables,
      nextActions,
      recentUpdates: weeklyUpdates,
      metrics,
      needsYou,
      lastUpdated,
      portalSettings: portalSettingsResult.data || null,
    },
  };
}

/**
 * Get client KPIs summary
 */
export async function getClientKPIs(workspaceId: string) {
  const { allowed } = await verifyWorkspaceAccess(workspaceId, 'member');
  if (!allowed) {
    return { error: 'Unauthorized' };
  }

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      return { error: 'Workspace not found' };
    }
  }

  const metricsResult = await getLatestMetrics(supabaseWorkspaceId);
  // Fix: Type assertion to handle union type narrowing issue
  const latestMetrics = metricsResult && 'data' in metricsResult ? (metricsResult as any).data : null;

  return {
    data: {
      leads: latestMetrics?.leads || 0,
      spend: latestMetrics?.spend || 0,
      cpl: latestMetrics?.cpl || 0,
      roas: latestMetrics?.roas || 0,
    },
  };
}

/**
 * Get items requiring client action
 */
export async function getClientNeedsYou(workspaceId: string) {
  const { allowed } = await verifyWorkspaceAccess(workspaceId, 'member');
  if (!allowed) {
    return { error: 'Unauthorized' };
  }

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      return { error: 'Workspace not found' };
    }
  }

  const [deliverablesResult, roadmapResult] = await Promise.all([
    getDeliverables(supabaseWorkspaceId, true),
    getRoadmapItems(supabaseWorkspaceId, true),
  ]);

  const deliverables = deliverablesResult.data || [];
  const roadmapItems = roadmapResult.data || [];

  const needsYou = [
    ...deliverables.filter((d: any) => d.status === 'in_review').map((d: any) => ({
      type: 'deliverable' as const,
      id: d.id,
      title: d.title,
      description: `Review and approve: ${d.title}`,
      status: d.status,
    })),
    ...roadmapItems
      .filter((item: any) => item.client_visible && item.timeframe === 'blocker')
      .map((item: any) => ({
        type: 'roadmap' as const,
        id: item.id,
        title: item.title,
        description: item.description || '',
        timeframe: item.timeframe,
      })),
  ].slice(0, 3);

  return { data: needsYou };
}
