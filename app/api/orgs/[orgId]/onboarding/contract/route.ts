/**
 * API Route for Contract Signing
 * Handles signature upload and contract signature creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { signContract } from '@/app/actions/onboarding';

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
    const body = await request.json();
    const { nodeId, signed_name, signature_data_url, contract_sha256, terms_version, privacy_version } = body;

    if (!nodeId || !signed_name || !signature_data_url) {
      return NextResponse.json(
        { error: 'nodeId, signed_name, and signature_data_url required' },
        { status: 400 }
      );
    }

    // Convert data URL to blob and upload to Supabase Storage
    const supabase = await createServerClient();
    
    // Extract base64 data from data URL
    const base64Data = signature_data_url.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `signatures/${orgId}/${userId}/${timestamp}.png`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading signature:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload signature' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('signatures')
      .getPublicUrl(filename);

    const signature_image_url = urlData.publicUrl;

    // Get IP and user agent from request
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Create contract signature
    const result = await signContract(orgId, userId, nodeId, {
      signed_name,
      signature_image_url,
      contract_sha256: contract_sha256 || null,
      terms_version: terms_version || null,
      privacy_version: privacy_version || null,
      ip,
      user_agent,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in POST /api/orgs/[orgId]/onboarding/contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

