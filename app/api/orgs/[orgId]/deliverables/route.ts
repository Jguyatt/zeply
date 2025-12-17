import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orgId } = params;
    let supabaseOrgId = orgId;

    // Handle Clerk org ID vs Supabase UUID
    if (orgId.startsWith('org_')) {
      const orgResult = await getSupabaseOrgIdFromClerk(orgId);
      if (orgResult && 'data' in orgResult) {
        supabaseOrgId = orgResult.data;
      } else {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }

    const supabase = createServiceClient();

    // Verify user has access to this org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get deliverables (exclude archived)
    const { data: deliverables, error } = await supabase
      .from('deliverables')
      .select('id, title, type, status')
      .eq('org_id', supabaseOrgId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: deliverables || [] });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

