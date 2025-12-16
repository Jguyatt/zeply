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
    const fileName = `${params.orgId}/${userId}/${nodeId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('onboarding_documents')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('onboarding_documents')
      .getPublicUrl(fileName);

    // Mark node as completed with file URL
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
          metadata: { file_url: publicUrl.publicUrl, file_name: file.name },
        },
        {
          onConflict: 'org_id,user_id,node_id',
        }
      );

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { url: publicUrl.publicUrl } });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}