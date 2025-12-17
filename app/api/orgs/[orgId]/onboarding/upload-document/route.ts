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
    const nodeId = formData.get('nodeId') as string;

    if (!file || !nodeId) {
      return NextResponse.json({ error: 'Missing file or node ID' }, { status: 400 });
    }

    const supabase = createServiceClient();
    // Use proper file path structure: {orgId}/onboarding/{nodeId}/{timestamp}-{filename}
    const fileName = `${params.orgId}/onboarding/${nodeId}/${Date.now()}-${file.name}`;

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