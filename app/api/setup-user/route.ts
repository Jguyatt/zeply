import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

/**
 * API route to set up a new user after signup
 * Creates agency org and user profile
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const supabase = await createServerClient();

    // Check if user already has an org
    const { data: existingOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1);

    if (existingOrgs && existingOrgs.length > 0) {
      // User already has an org, just ensure profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('active_org_id')
        .eq('user_id', userId)
        .single();

      const typedProfile = profile as Pick<UserProfileRow, 'active_org_id'> | null;
      if (!typedProfile?.active_org_id) {
        type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
        const existingOrg = existingOrgs[0] as { org_id: string };
        
        await (supabase
          .from('user_profiles') as any)
          .upsert({
            user_id: userId,
            active_org_id: existingOrg.org_id,
            full_name: user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
          } as UserProfileInsert);
      }

      return NextResponse.json({ success: true, message: 'User already set up' });
    }

    // Create agency org for new user
    const fullName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';

    const { data: newOrg, error: orgError } = await (supabase
      .from('orgs') as any)
      .insert({
        name: `${fullName}'s Agency`,
        kind: 'agency',
      })
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error('Error creating org:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Add user as owner
    type OrgMemberInsert = Database['public']['Tables']['org_members']['Insert'];
    
    const { error: memberError } = await (supabase
      .from('org_members') as any)
      .insert({
        org_id: (newOrg as any).id,
        user_id: userId,
        role: 'owner',
      } as OrgMemberInsert);

    if (memberError) {
      console.error('Error adding user to org:', memberError);
      return NextResponse.json(
        { error: 'Failed to add user to organization' },
        { status: 500 }
      );
    }

    // Create/update user profile
    type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
    
    const { error: profileError } = await (supabase
      .from('user_profiles') as any)
      .upsert({
        user_id: userId,
        active_org_id: (newOrg as any).id,
        full_name: fullName,
      } as UserProfileInsert);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail - org is created, profile can be fixed later
    }

    return NextResponse.json({ success: true, orgId: (newOrg as any).id });
  } catch (error: any) {
    console.error('Error in setup-user route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

