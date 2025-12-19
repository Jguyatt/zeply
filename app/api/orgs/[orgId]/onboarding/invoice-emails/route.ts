import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();

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
    const clerk = await clerkClient();
    
    // Get admin email (first owner or admin)
    const { data: admins } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('org_id', supabaseOrgId)
      .in('role', ['owner', 'admin'])
      .order('role', { ascending: true })
      .limit(1);

    let adminEmail = '';
    if (admins && admins.length > 0) {
      try {
        const adminUser = await clerk.users.getUser(admins[0].user_id);
        adminEmail = adminUser.primaryEmailAddress?.emailAddress || '';
      } catch (err) {
        console.error('Error fetching admin email:', err);
      }
    }

    // Get member email (current user if they're a member)
    const { data: member } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .eq('role', 'member')
      .maybeSingle();

    let memberEmail = '';
    if (member) {
      try {
        const memberUser = await clerk.users.getUser(member.user_id);
        memberEmail = memberUser.primaryEmailAddress?.emailAddress || '';
      } catch (err) {
        console.error('Error fetching member email:', err);
      }
    }

    return NextResponse.json({
      adminEmail,
      memberEmail,
    });
  } catch (error: any) {
    console.error('Error fetching invoice emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
