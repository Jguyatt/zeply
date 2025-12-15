/**
 * API Routes for Onboarding Flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import {
  getPublishedOnboardingFlow,
  getOnboardingFlowDraft,
  createOnboardingFlow,
  updateOnboardingFlow,
  publishOnboardingFlow,
  initializeDefaultFlow,
} from '@/app/actions/onboarding';

async function getSupabaseOrgId(orgId: string): Promise<string | null> {
  if (orgId.startsWith('org_')) {
    try {
      const result = await getSupabaseOrgIdFromClerk(orgId);
      if (result && 'data' in result && result.data) {
        return result.data;
      }
      if (result && 'error' in result) {
        console.error('Error getting Supabase org ID:', result.error);
      }
      return null;
    } catch (error) {
      console.error('Exception getting Supabase org ID:', error);
      return null;
    }
  }
  // Already a Supabase UUID
  return orgId;
}

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
    let supabaseOrgId = await getSupabaseOrgId(orgId);
    
    // If org doesn't exist, try to sync it first
    if (!supabaseOrgId && orgId.startsWith('org_')) {
      const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Client Organization');
      if (syncResult && 'data' in syncResult && syncResult.data) {
        supabaseOrgId = (syncResult.data as { id: string }).id;
      }
    }
    
    if (!supabaseOrgId) {
      console.error('Failed to convert org ID:', orgId);
      return NextResponse.json({ error: 'Invalid org ID or organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const draft = searchParams.get('draft') === 'true';

    if (draft) {
      const result = await getOnboardingFlowDraft(supabaseOrgId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ data: result.data });
    } else {
      const result = await getPublishedOnboardingFlow(supabaseOrgId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ data: result.data });
    }
  } catch (error) {
    console.error('Error in GET /api/orgs/[orgId]/onboarding/flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    let supabaseOrgId = await getSupabaseOrgId(orgId);
    
    // If org doesn't exist, try to sync it first
    if (!supabaseOrgId && orgId.startsWith('org_')) {
      const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Client Organization');
      if (syncResult && 'data' in syncResult && syncResult.data) {
        supabaseOrgId = (syncResult.data as { id: string }).id;
      }
    }
    
    if (!supabaseOrgId) {
      console.error('Failed to convert org ID:', orgId);
      return NextResponse.json({ error: 'Invalid org ID or organization not found' }, { status: 400 });
    }

    const body = await request.json();
    const { name, action } = body;

    if (action === 'init') {
      const result = await initializeDefaultFlow(supabaseOrgId);
      if (result.error) {
        console.error('Error initializing flow:', result.error);
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      if (!result.data) {
        console.error('No data returned from initializeDefaultFlow');
        return NextResponse.json({ error: 'Failed to initialize flow' }, { status: 500 });
      }
      return NextResponse.json({ data: result.data });
    }

    if (action === 'publish') {
      const { flowId } = body;
      const result = await publishOnboardingFlow(flowId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ data: result.data });
    }

    if (name) {
      const result = await createOnboardingFlow(supabaseOrgId, name);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ data: result.data });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/orgs/[orgId]/onboarding/flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flowId, ...updates } = body;

    if (!flowId) {
      return NextResponse.json({ error: 'flowId required' }, { status: 400 });
    }

    const result = await updateOnboardingFlow(flowId, updates);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in PUT /api/orgs/[orgId]/onboarding/flow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

