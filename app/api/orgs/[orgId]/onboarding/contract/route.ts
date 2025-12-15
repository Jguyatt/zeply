import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { nodeId, signatureData } = body;

  const supabase = createServiceClient();

  const { data: signature, error: sigError } = await supabase
    .from('contract_signatures')
    .insert({
      org_id: params.orgId,
      user_id: userId,
      node_id: nodeId,
      ...signatureData,
    })
    .select('id')
    .single();

  if (sigError) {
    return NextResponse.json({ error: sigError.message }, { status: 500 });
  }

  // FIX: Cast signature to 'any' to safely access ID
  const { error: progressError } = await supabase
    .from('onboarding_progress')
    .upsert(
      {
        org_id: params.orgId,
        user_id: userId,
        node_id: nodeId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { signature_id: (signature as any).id }, 
      },
      {
        onConflict: 'org_id,user_id,node_id',
      }
    );

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  // FIX: Cast signature to 'any' here too
  return NextResponse.json({ data: { signature_id: (signature as any).id } });
}