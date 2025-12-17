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
    const { title, description, timeframe } = body;

    if (!title || !timeframe) {
      return NextResponse.json({ error: 'Title and timeframe are required' }, { status: 400 });
    }

    if (!['this_week', 'next_week', 'blocker'].includes(timeframe)) {
      return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only admins can create roadmap items' }, { status: 403 });
    }

    // Get max order_index for this timeframe
    const { data: existingItems } = await supabase
      .from('roadmap_items')
      .select('order_index')
      .eq('org_id', params.orgId)
      .eq('timeframe', timeframe)
      .order('order_index', { ascending: false })
      .limit(1);

    const orderIndex = existingItems && existingItems.length > 0 
      ? (existingItems[0] as any).order_index + 1 
      : 0;

    // Create roadmap item
    const { data: item, error: itemError } = await (supabase
      .from('roadmap_items') as any)
      .insert({
        org_id: params.orgId,
        title: title.trim(),
        description: description?.trim() || null,
        timeframe,
        order_index: orderIndex,
        created_by: userId,
      })
      .select()
      .single();

    if (itemError) {
      console.error('Roadmap item creation error:', itemError);
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create roadmap item' },
      { status: 500 }
    );
  }
}

