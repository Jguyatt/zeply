/**
 * Admin Onboarding Flow Builder Page
 * Visual flow builder for creating and editing onboarding flows
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import OnboardingFlowBuilder from '@/app/components/OnboardingFlowBuilder';

export default async function OnboardingFlowBuilderPage({
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
    .select('role, orgs!inner(name)')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    redirect('/dashboard');
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    redirect('/dashboard');
  }

  const orgName = ((membership as any).orgs as { name: string }).name || 'Organization';

  return (
    <OnboardingFlowBuilder
      orgId={supabaseOrgId}
      clerkOrgId={orgId}
      orgName={orgName}
    />
  );
}

