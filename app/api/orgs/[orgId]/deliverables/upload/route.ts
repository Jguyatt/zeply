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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deliverableId = formData.get('deliverableId') as string;

    if (!file || !deliverableId) {
      return NextResponse.json({ error: 'Missing file or deliverable ID' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const fileName = `${params.orgId}/${deliverableId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('deliverables')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('deliverables')
      .getPublicUrl(fileName);

    // Get proof_type and is_required_proof from form data
    const proofType = formData.get('proofType') as string || 'file';
    const isRequiredProof = formData.get('isRequiredProof') === 'true';

    // Determine proof type based on file type or explicit setting
    let finalProofType = proofType;
    if (proofType === 'file') {
      // Auto-detect screenshot
      if (file.type.startsWith('image/')) {
        finalProofType = 'screenshot';
      } else {
        finalProofType = 'file';
      }
    }

    // Create deliverable_asset record
    const { data: asset, error: assetError } = await (supabase
      .from('deliverable_assets') as any)
      .insert({
        deliverable_id: deliverableId,
        kind: 'file',
        url: publicUrl.publicUrl,
        name: file.name,
        proof_type: finalProofType,
        is_required_proof: isRequiredProof,
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset creation error:', assetError);
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data: { 
        id: (asset as any).id,
        url: publicUrl.publicUrl,
        name: file.name,
        kind: 'file',
        proof_type: finalProofType,
        is_required_proof: isRequiredProof,
      } 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

