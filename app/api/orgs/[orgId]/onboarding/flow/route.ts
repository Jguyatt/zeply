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
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('*')
    .eq('org_id', params.orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!flow) {
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