import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

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
  const { 
    nodeId, 
    signed_name,
    signature_data_url,
    contract_sha256,
    contract_html,
    terms_version,
    privacy_version
  } = body;

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

  // FIX: Cast to 'any' for insert on contract_signatures
  const { data: signature, error: sigError } = await (supabase
    .from('contract_signatures') as any)
    .insert({
      org_id: supabaseOrgId,
      user_id: userId,
      node_id: nodeId,
      signed_name,
      signature_image_url: signature_data_url,
      contract_sha256,
      terms_version,
      privacy_version,
    })
    .select('id')
    .single();

  if (sigError) {
    return NextResponse.json({ error: sigError.message }, { status: 500 });
  }

  // Check if record exists (partial unique index doesn't work with ON CONFLICT)
  const { data: existing, error: checkError } = await (supabase
    .from('onboarding_progress') as any)
    .select('id')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .eq('node_id', nodeId)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  const progressData: any = {
    org_id: supabaseOrgId,
    user_id: userId,
    node_id: nodeId,
    item_id: null, // Explicitly set to null since we're using node_id
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata: { signature_id: (signature as any).id },
  };

  let progressResult;
  if (existing) {
    // Update existing record
    progressResult = await (supabase
      .from('onboarding_progress') as any)
      .update(progressData)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Insert new record
    progressResult = await (supabase
      .from('onboarding_progress') as any)
      .insert(progressData)
      .select()
      .single();
  }

  if (progressResult.error) {
    return NextResponse.json({ error: progressResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { signature_id: (signature as any).id } });
}