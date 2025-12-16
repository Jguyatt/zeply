import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
  const { nodeId, signatureData } = body;

  const supabase = createServiceClient();

  // FIX: Cast to 'any' for insert on contract_signatures
  const { data: signature, error: sigError } = await (supabase
    .from('contract_signatures') as any)
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

  // FIX: Cast to 'any' for upsert on onboarding_progress
  const { error: progressError } = await (supabase
    .from('onboarding_progress') as any)
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

  return NextResponse.json({ data: { signature_id: (signature as any).id } });
}