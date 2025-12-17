import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { createOnboardingEdge } from '@/app/actions/onboarding';

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();
  
  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = params.orgId;
  if (params.orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(params.orgId);
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
  }

  // Check for draft flow if ?draft=true query param
  const url = new URL(request.url);
  const isDraft = url.searchParams.get('draft') === 'true';
  const flowIdParam = url.searchParams.get('flowId');

  let flow;
  if (flowIdParam) {
    // Get edges for specific flow ID
    const { data: specificFlow } = await supabase
      .from('onboarding_flows')
      .select('id')
      .eq('id', flowIdParam)
      .maybeSingle();
    flow = specificFlow;
  } else if (isDraft) {
    // Get draft flow (or most recent flow if no draft exists)
    const { data: draftFlow } = await supabase
      .from('onboarding_flows')
      .select('id')
      .eq('org_id', supabaseOrgId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    flow = draftFlow;
    
    // If no draft, check for published flow
    if (!flow) {
      const { data: publishedFlow } = await supabase
        .from('onboarding_flows')
        .select('id')
        .eq('org_id', supabaseOrgId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      flow = publishedFlow;
    }
  } else {
    // Get published flow only
    const { data: publishedFlow } = await supabase
      .from('onboarding_flows')
      .select('id')
      .eq('org_id', supabaseOrgId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    flow = publishedFlow;
  }

  if (!flow) {
    return NextResponse.json({ data: [] });
  }

  // FIX: Cast flow to 'any' to safely access ID
  const { data: edges, error } = await supabase
    .from('onboarding_edges')
    .select('*')
    .eq('flow_id', (flow as any).id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: edges || [] });
}

export async function POST(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();
  
  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = params.orgId;
  if (params.orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(params.orgId);
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
  }

  try {
    const body = await request.json();
    const { flowId, sourceId, targetId } = body;

    if (!flowId || !sourceId || !targetId) {
      return NextResponse.json({ error: 'flowId, sourceId, and targetId are required' }, { status: 400 });
    }

    // Verify flow belongs to org
    const { data: flow } = await supabase
      .from('onboarding_flows')
      .select('org_id')
      .eq('id', flowId)
      .single();

    if (!flow || (flow as any).org_id !== supabaseOrgId) {
      return NextResponse.json({ error: 'Flow not found or unauthorized' }, { status: 404 });
    }

    // Create the edge
    const result = await createOnboardingEdge(flowId, sourceId, targetId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error creating edge:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create edge' },
      { status: 500 }
    );
  }
}