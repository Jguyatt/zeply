/**
 * API Route for Uploading Onboarding Documents
 * Uploads PDF/image files to Supabase Storage and returns the URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    
    // Get Supabase org ID if needed
    let supabaseOrgId = orgId;
    if (orgId.startsWith('org_')) {
      const result = await getSupabaseOrgIdFromClerk(orgId);
      if (result && 'data' in result && result.data) {
        supabaseOrgId = result.data;
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nodeId = formData.get('nodeId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, JPG, GIF, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    // Use service role client for storage operations to bypass RLS
    // Authentication is already verified via Clerk auth check above
    const supabase = createServiceClient();
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `onboarding-documents/${supabaseOrgId}/${nodeId || 'temp'}/${timestamp}_${sanitizedFileName}`;
    
    // Upload to Supabase Storage
    console.log('Uploading file to:', filename);
    console.log('File size:', buffer.length, 'bytes');
    console.log('Content type:', file.type);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('onboarding-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { error: 'Failed to upload document: ' + uploadError.message },
        { status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('onboarding-documents')
      .getPublicUrl(filename);

    const documentUrl = urlData.publicUrl;
    console.log('Public URL:', documentUrl);

    return NextResponse.json({
      success: true,
      url: documentUrl,
      filename: filename,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error in upload-document route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

