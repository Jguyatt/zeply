import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ orgId: string; deliverableId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, note, attachments, client_visible, notify_client } = body;

    const supabase = createServiceClient();

    // Verify user is admin/owner
    const { data: deliverable } = await supabase
      .from('deliverables')
      .select('org_id')
      .eq('id', params.deliverableId)
      .single();

    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', (deliverable as any).org_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || ((membership as any).role !== 'admin' && (membership as any).role !== 'owner')) {
      return NextResponse.json({ error: 'Only admins can post updates' }, { status: 403 });
    }

    // Create update
    const { data: update, error: updateError } = await (supabase
      .from('deliverable_updates') as any)
      .insert({
        deliverable_id: params.deliverableId,
        title: title || null,
        note: note || null,
        created_by: userId,
        client_visible: client_visible !== undefined ? client_visible : true,
      })
      .select()
      .single();

    if (updateError) {
      console.error('Update creation error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Link attachments to update if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        // Try to find existing asset by URL
        const { data: existingAsset } = await supabase
          .from('deliverable_assets')
          .select('id')
          .eq('deliverable_id', params.deliverableId)
          .eq('url', att.file_url)
          .maybeSingle();

        if (existingAsset) {
          // Update existing asset with update_id
          await (supabase
            .from('deliverable_assets') as any)
            .update({ update_id: (update as any).id })
            .eq('id', (existingAsset as any).id);
        } else {
          // Create new asset linked to update
          await (supabase
            .from('deliverable_assets') as any)
            .insert({
              deliverable_id: params.deliverableId,
              update_id: (update as any).id,
              kind: 'file',
              url: att.file_url,
              name: att.file_name,
              proof_type: att.type === 'image' ? 'screenshot' : 'file',
              is_required_proof: false,
            });
        }
      }
    }

    return NextResponse.json({ data: update });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

