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

  // Check admin access
  const supabase = createServiceClient();
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', params.orgId)
    .eq('user_id', userId)
    .single();

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('user_id, node_id, status, completed_at')
    .eq('org_id', params.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: progress || [] });
}