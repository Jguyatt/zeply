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

    // Handle missing or empty filenames (common with camera roll images on mobile)
    let safeFileName = file.name || 'unnamed-file';
    // If filename is empty string or just whitespace, generate a name based on file type
    if (!safeFileName.trim()) {
      const extension = file.type.split('/')[1] || 'bin';
      safeFileName = `image.${extension}`;
    }
    // Sanitize filename to remove any problematic characters
    safeFileName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);

    const supabase = createServiceClient();
    // Use proper file path structure: {supabaseOrgId}/onboarding/{nodeId}/{timestamp}-{filename}
    const fileName = `${supabaseOrgId}/onboarding/${nodeId}/${Date.now()}-${safeFileName}`;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload-document/route.ts:filename-validation',message:'File name validation',data:{originalFileName:file.name,safeFileName,fileType:file.type,fileSize:file.size,hasOriginalName:!!file.name,fileNameLength:file.name?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload-document/route.ts:79',message:'Generated public URL',data:{fileName,publicUrl:publicUrl?.publicUrl,publicUrlLength:publicUrl?.publicUrl?.length,fileNameStructure:{supabaseOrgId,nodeId,originalFileName:file.name,timestamp:Date.now()},fileSize:file.size,fileType:file.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Return file metadata for node config
    // Use safeFileName for display, but preserve original name if it exists
    return NextResponse.json({
      data: { 
        url: publicUrl.publicUrl,
        name: file.name || safeFileName, // Use original name if available, otherwise use safe name
        type: file.type,
        filename: safeFileName, // Always use safe filename for storage
      } 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}