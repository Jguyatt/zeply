import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { deleteOnboardingNode, createOnboardingNode } from '@/app/actions/onboarding';

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
    // Get nodes for specific flow ID
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
  const { data: nodes, error } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', (flow as any).id)
    .order('order_index', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: nodes || [] });
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
    const { flowId, type, title, description, required, config, position, order_index } = body;

    if (!flowId || !type || !title) {
      return NextResponse.json({ error: 'flowId, type, and title are required' }, { status: 400 });
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

    // Create the node
    const result = await createOnboardingNode(flowId, {
      type,
      title,
      description,
      required: required ?? true,
      config: config || {},
      position: position || { x: 0, y: 0 },
      order_index,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create node' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { nodeId, position, title, description, required, config } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
    }

    // Import updateOnboardingNode
    const { updateOnboardingNode } = await import('@/app/actions/onboarding');
    
    const updates: any = {};
    if (position !== undefined) updates.position = position;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (required !== undefined) updates.required = required;
    if (config !== undefined) updates.config = config;

    const result = await updateOnboardingNode(nodeId, updates);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update node' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get nodeId from query params or request body
  const url = new URL(request.url);
  const nodeId = url.searchParams.get('nodeId');

  if (!nodeId) {
    return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
  }

  // Use the server action to delete the node (it handles auth and org verification)
  const result = await deleteOnboardingNode(nodeId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}