import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export async function GET(
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

  const supabase = createServiceClient();
  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: progress || [] });
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

  const body = await request.json();
  const { nodeId, status = 'completed', metadata } = body;

  if (!nodeId) {
    return NextResponse.json({ error: 'Missing nodeId' }, { status: 400 });
  }

  const supabase = createServiceClient();
  
  // FIX: Cast to 'any' for upsert on onboarding_progress
  const { data, error } = await (supabase
    .from('onboarding_progress') as any)
    .upsert(
      {
        org_id: supabaseOrgId,
        user_id: userId,
        node_id: nodeId,
        status: status || 'completed',
        completed_at: (status === 'completed' || !status) ? new Date().toISOString() : null,
        metadata: metadata || {},
      },
      {
        onConflict: 'org_id,user_id,node_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}