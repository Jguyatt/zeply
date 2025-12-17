import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, what_we_did, results, next_steps, deliverable_id } = body;

    if (!title || !what_we_did) {
      return NextResponse.json({ error: 'Title and "What We Did" are required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', params.orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || ((membership as any).role !== 'admin' && (membership as any).role !== 'owner')) {
      return NextResponse.json({ error: 'Only admins can create updates' }, { status: 403 });
    }

    // Create weekly update
    const { data: update, error: updateError } = await (supabase
      .from('weekly_updates') as any)
      .insert({
        org_id: params.orgId,
        title: title.trim(),
        what_we_did: what_we_did.trim(),
        results: results?.trim() || null,
        next_steps: next_steps?.trim() || null,
        deliverable_id: deliverable_id || null,
        created_by: userId,
        published_at: new Date().toISOString(),
        client_visible: true,
      })
      .select()
      .single();

    if (updateError) {
      console.error('Update creation error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: update });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create update' },
      { status: 500 }
    );
  }
}

