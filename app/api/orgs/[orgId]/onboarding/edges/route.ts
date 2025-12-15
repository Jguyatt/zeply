import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();
  
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('id')
    .eq('org_id', params.orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

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