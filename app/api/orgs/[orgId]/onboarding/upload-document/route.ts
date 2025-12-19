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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nodeId = formData.get('nodeId') as string;

    if (!file || !nodeId) {
      return NextResponse.json({ error: 'Missing file or node ID' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const supabase = createServiceClient();
    // Use proper file path structure: {supabaseOrgId}/onboarding/{nodeId}/{timestamp}-{filename}
    const fileName = `${supabaseOrgId}/onboarding/${nodeId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('onboarding_documents')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('onboarding_documents')
      .getPublicUrl(fileName);

    // Return file metadata for node config
    return NextResponse.json({
      data: { 
        url: publicUrl.publicUrl,
      name: file.name,
      type: file.type,
        filename: file.name,
      } 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}