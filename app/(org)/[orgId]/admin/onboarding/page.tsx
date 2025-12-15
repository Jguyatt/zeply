/**
 * Admin Onboarding Status Page
 * View all members' onboarding completion status
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export default async function AdminOnboardingStatusPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  if (orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      redirect('/dashboard');
    }
  }

  // Verify admin access
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || (membership as { role: string }).role === 'member') {
    redirect('/dashboard');
  }

  // Fetch status data
  const statusResponse = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orgs/${orgId}/admin/onboarding/status`,
    {
      headers: {
        Cookie: `__clerk_db_jwt=${userId}`, // This won't work in server component - need to call action directly
      },
    }
  );

  // For now, return a placeholder - we'll need to call the action directly
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2">Onboarding Status</h1>
        <p className="text-secondary">View all members' onboarding completion progress</p>
      </div>

      <div className="glass-surface rounded-lg p-6">
        <p className="text-secondary">
          Onboarding status dashboard - Implementation in progress. Use the API endpoint
          `/api/orgs/{orgId}/admin/onboarding/status` to fetch the data.
        </p>
      </div>
    </div>
  );
}

