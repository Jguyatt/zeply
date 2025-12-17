/**
 * Helper function to fetch organization members with Clerk user data
 * Returns members with names, photos, and user IDs for dropdowns
 */

import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export interface OrgMember {
  user_id: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: 'owner' | 'admin' | 'member';
}

export async function getOrgMembers(orgId: string): Promise<{ data: OrgMember[] | null; error?: string }> {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user has access to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Get all members of the org
  const { data: members, error } = await supabase
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .order('role', { ascending: true }); // Order by role (owner, admin, member)

  if (error) {
    return { error: error.message };
  }

  if (!members || members.length === 0) {
    return { data: [] };
  }

  // Enrich with Clerk user data
  const { clerkClient } = await import('@clerk/nextjs/server');
  const clerk = await clerkClient();

  const enrichedMembers = await Promise.all(
    members.map(async (member: any) => {
      try {
        const clerkUser = await clerk.users.getUser(member.user_id);
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';
        const fullName = firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || '';
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        const imageUrl = clerkUser.imageUrl || '';

        return {
          user_id: member.user_id,
          name: fullName || email?.split('@')[0] || 'Unknown User',
          email: email,
          imageUrl: imageUrl,
          role: member.role,
        };
      } catch (err) {
        // Fallback to profile data if Clerk user not found
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', member.user_id)
          .maybeSingle();

        return {
          user_id: member.user_id,
          name: (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Unknown User',
          email: (profile as any)?.email || '',
          imageUrl: undefined,
          role: member.role,
        };
      }
    })
  );

  return { data: enrichedMembers };
}

