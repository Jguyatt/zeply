/**
 * Client Onboarding Page
 * Members complete onboarding steps here before accessing dashboard
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { getPublishedOnboardingFlow, getOnboardingProgress, isOnboardingComplete } from '@/app/actions/onboarding';
import OnboardingStepRenderer from '@/app/components/OnboardingStepRenderer';

export default async function OnboardingPage({
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

  // Verify membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role, orgs!inner(name)')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    redirect('/dashboard');
  }

  const orgName = ((membership as any).orgs as { name: string }).name || 'Organization';
  const userRole = (membership as any).role || 'member';

  // Only members need onboarding (admins bypass)
  if (userRole !== 'member') {
    redirect(`/${orgId}/dashboard`);
  }

  // Check if onboarding is complete
  const complete = await isOnboardingComplete(supabaseOrgId, userId);
  if (complete) {
    redirect(`/${orgId}/dashboard`);
  }

  // Get published flow
  const flowResult = await getPublishedOnboardingFlow(supabaseOrgId);
  if (!flowResult.data || !flowResult.data.nodes.length) {
    // No flow published, allow access
    redirect(`/${orgId}/dashboard`);
  }

  // Get user's progress
  const progressResult = await getOnboardingProgress(supabaseOrgId, userId);
  const completedNodeIds = new Set(
    (progressResult.data || [])
      .filter((p) => p.status === 'completed')
      .map((p) => p.node_id)
  );

  // Find next incomplete node
  const nodes = flowResult.data.nodes;
  const nextNode = nodes.find((node) => !completedNodeIds.has(node.id));

  if (!nextNode) {
    // All nodes complete but gate didn't catch it - redirect
    redirect(`/${orgId}/dashboard`);
  }

  // Calculate progress
  const completedCount = completedNodeIds.size;
  const totalCount = nodes.filter((n) => n.required).length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-charcoal flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Welcome to {orgName}
            </h1>
            <p className="text-secondary text-lg">
              Please complete the onboarding steps below to get started
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="glass-surface rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary">Progress</span>
              <span className="text-sm font-medium text-primary">
                {completedCount} of {totalCount} steps complete
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="glass-surface rounded-lg p-8">
            <OnboardingStepRenderer
              node={nextNode}
              orgId={supabaseOrgId}
              clerkOrgId={orgId}
              userId={userId}
              allNodes={nodes}
              completedNodeIds={completedNodeIds}
            />
          </div>

          {/* Step List */}
          <div className="mt-8 space-y-3">
            {nodes.map((node, index) => {
              const isCompleted = completedNodeIds.has(node.id);
              const isCurrent = node.id === nextNode.id;
              
              return (
                <div
                  key={node.id}
                  className={`glass-surface rounded-lg p-4 flex items-center gap-4 ${
                    isCurrent ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-secondary'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-primary font-medium">{node.title}</h3>
                    {node.description && (
                      <p className="text-sm text-secondary">{node.description}</p>
                    )}
                  </div>
                  {isCompleted && (
                    <span className="text-xs text-green-400">Completed</span>
                  )}
                  {isCurrent && !isCompleted && (
                    <span className="text-xs text-purple-400">In Progress</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

