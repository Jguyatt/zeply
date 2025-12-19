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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-start',message:'POST request received',data:{orgId:params.orgId,hasUserId:!!userId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = params.orgId;
  if (params.orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(params.orgId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-org-lookup',message:'Org ID lookup result',data:{clerkOrgId:params.orgId,orgResult,hasData:orgResult && 'data' in orgResult,supabaseOrgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
  }

  const body = await request.json();
  const { nodeId, status = 'completed', metadata } = body;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-body-parsed',message:'Request body parsed',data:{nodeId,status,metadata,hasNodeId:!!nodeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!nodeId) {
    return NextResponse.json({ error: 'Missing nodeId' }, { status: 400 });
  }

  const supabase = createServiceClient();
  
  const upsertData: any = {
    org_id: supabaseOrgId,
    user_id: userId,
    node_id: nodeId,
    item_id: null, // Explicitly set to null since we're using node_id
    status: status || 'completed',
    completed_at: (status === 'completed' || !status) ? new Date().toISOString() : null,
    metadata: metadata || {},
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-before-check',message:'About to check for existing record',data:{upsertData,supabaseOrgId,userId,nodeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Check if record exists (partial unique index doesn't work with ON CONFLICT)
  const { data: existing, error: checkError } = await (supabase
    .from('onboarding_progress') as any)
    .select('id')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .eq('node_id', nodeId)
    .maybeSingle();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-after-check',message:'Check completed',data:{hasCheckError:!!checkError,checkError:checkError?.message,hasExisting:!!existing,existingId:existing?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  if (checkError) {
    console.error('Supabase check error:', checkError);
    return NextResponse.json({ error: checkError.message, details: checkError.details, code: checkError.code }, { status: 500 });
  }

  let data, error;

  if (existing) {
    // Update existing record
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-updating',message:'Updating existing record',data:{existingId:existing.id,upsertData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    const result = await (supabase
      .from('onboarding_progress') as any)
      .update(upsertData)
      .eq('id', existing.id)
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  } else {
    // Insert new record
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-inserting',message:'Inserting new record',data:{upsertData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    const result = await (supabase
      .from('onboarding_progress') as any)
      .insert(upsertData)
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'progress/route.ts:POST-after-operation',message:'Operation completed',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,errorDetails:error?.details,hasData:!!data,data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message, details: error.details, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ data });
}