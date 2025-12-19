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

    // Check if bucket exists, if not provide helpful error
    const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
    if (bucketListError) {
      console.error('Error listing buckets:', bucketListError);
    }
    
    const bucketExists = buckets?.some(b => b.id === 'onboarding_documents');
    if (!bucketExists) {
      return NextResponse.json({ 
        error: 'Storage bucket not configured. Please run migration 028_create_onboarding_documents_bucket.sql to create the bucket.' 
      }, { status: 500 });
    }

    const { error: uploadError } = await supabase.storage
      .from('onboarding_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // Provide more helpful error messages
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Storage bucket not found. Please ensure migration 028_create_onboarding_documents_bucket.sql has been run in Supabase.' 
        }, { status: 500 });
      }
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: uploadError.message || 'Failed to upload file' 
      }, { status: 500 });
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