import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { initializeDefaultFlow } from '@/app/actions/onboarding';

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

  let flow;
  if (isDraft) {
    // Get draft flow (or most recent flow if no draft exists)
    const { data: draftFlow } = await supabase
      .from('onboarding_flows')
      .select('*')
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
        .select('*')
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
    .select('*')
      .eq('org_id', supabaseOrgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    flow = publishedFlow;
  }

  // If no flow exists and we're looking for draft, initialize default flow
  if (!flow && isDraft) {
    const initResult = await initializeDefaultFlow(supabaseOrgId);
    if (initResult.data) {
      flow = initResult.data as any;
    } else {
      return NextResponse.json({ data: null });
    }
  } else if (!flow) {
    return NextResponse.json({ data: null });
  }

  // FIX: Cast flow to 'any' to safely access ID
  const { data: nodes } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', (flow as any).id) 
    .order('order_index', { ascending: true });

  // FIX: Cast flow to 'any'
  const { data: edges } = await supabase
    .from('onboarding_edges')
    .select('*')
    .eq('flow_id', (flow as any).id);

  return NextResponse.json({
    data: {
      ...(flow as any),
      nodes: nodes || [],
      edges: edges || [],
    },
  });
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

  // Get template ID from request body if provided
  let templateId: string | undefined | null = undefined;
  try {
    const body = await request.json();
    templateId = body.templateId;
  } catch (error) {
    // No body provided, use default template
    templateId = undefined;
  }

  // Initialize flow (with template if provided, or empty if templateId is null)
  const result = templateId === null 
    ? await initializeDefaultFlow(supabaseOrgId, undefined) // Empty flow (no nodes)
    : await initializeDefaultFlow(supabaseOrgId, templateId); // Template or default
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (!result.data) {
    return NextResponse.json({ error: 'Failed to initialize flow' }, { status: 500 });
  }

  // Enable onboarding in client_portal_config after flow is created
  // This ensures that after page reload, onboarding will be shown as enabled
  // We update directly to avoid triggering the auto-initialize flow logic in updateClientPortalConfig
  const supabase = createServiceClient();
  const { error: configError } = await (supabase
    .from('client_portal_config') as any)
    .upsert({
      org_id: supabaseOrgId,
      onboarding_enabled: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id',
    });

  if (configError) {
    // Log error but don't fail the request - flow was created successfully
    console.error('Failed to update onboarding_enabled in config:', configError);
  }

  // Fetch the flow with nodes and edges
  const { data: nodes } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', (result.data as any).id)
    .order('order_index', { ascending: true });

  const { data: edges } = await supabase
    .from('onboarding_edges')
    .select('*')
    .eq('flow_id', (result.data as any).id);

  return NextResponse.json({
    data: {
      ...(result.data as any),
      nodes: nodes || [],
      edges: edges || [],
    },
  });
}