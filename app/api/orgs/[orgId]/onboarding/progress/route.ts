import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('org_id', params.orgId)
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

  const body = await request.json();
  const { nodeId, status, metadata } = body;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('onboarding_progress')
    .upsert(
      {
        org_id: params.orgId,
        user_id: userId,
        node_id: nodeId,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        metadata,
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