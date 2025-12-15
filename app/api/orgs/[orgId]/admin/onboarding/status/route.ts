/**
 * Admin API Route for Onboarding Status
 * Returns all users' onboarding progress for an org
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAllOnboardingStatus, getPublishedOnboardingFlow } from '@/app/actions/onboarding';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify admin access
    const supabase = await createServerClient();
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || (membership as { role: string }).role === 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get published flow
    const flowResult = await getPublishedOnboardingFlow(orgId);
    if (flowResult.error || !flowResult.data) {
      return NextResponse.json({ error: flowResult.error || 'No published flow' }, { status: 404 });
    }

    // Get all progress
    const progressResult = await getAllOnboardingStatus(orgId);
    if (progressResult.error) {
      return NextResponse.json({ error: progressResult.error }, { status: 500 });
    }

    // Get all members in org
    const { data: members } = await supabase
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', orgId)
      .eq('role', 'member'); // Only show member progress

    // Build status map
    const progressMap = new Map<string, Map<string, { status: string; completed_at: string | null }>>();
    (progressResult.data || []).forEach((p) => {
      if (!progressMap.has(p.user_id)) {
        progressMap.set(p.user_id, new Map());
      }
      progressMap.get(p.user_id)!.set(p.node_id, {
        status: p.status,
        completed_at: p.completed_at,
      });
    });

    // Build response
    const statusData = {
      flow: flowResult.data,
      members: (members || []).map((m) => ({
        user_id: (m as { user_id: string }).user_id,
        progress: flowResult.data!.nodes.map((node) => {
          const userProgress = progressMap.get((m as { user_id: string }).user_id)?.get(node.id);
          return {
            node_id: node.id,
            node_title: node.title,
            status: userProgress?.status || 'pending',
            completed_at: userProgress?.completed_at || null,
          };
        }),
      })),
    };

    return NextResponse.json({ data: statusData });
  } catch (error) {
    console.error('Error in GET /api/orgs/[orgId]/admin/onboarding/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

