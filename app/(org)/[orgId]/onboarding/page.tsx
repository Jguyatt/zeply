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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D6B36A]/10 rounded-full mix-blend-screen filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D6B36A]/5 rounded-full mix-blend-screen filter blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 
              className="text-4xl md:text-5xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              Welcome to <span className="italic font-normal text-[#D6B36A]">{orgName}</span>
            </h1>
            <p 
              className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Please complete the steps below to access your dashboard
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span 
                className="text-sm text-neutral-400 font-light"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Onboarding Progress
              </span>
              <span 
                className="text-sm font-medium text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {completedCount} of {totalCount} steps complete
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D6B36A] to-[#D6B36A]/80 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/10 mb-8">
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
          <div className="space-y-3">
            <h3 
              className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              All Steps
            </h3>
            {nodes.map((node, index) => {
              const isCompleted = completedNodeIds.has(node.id);
              const isCurrent = node.id === nextNode.id;
              
              return (
                <div
                  key={node.id}
                  className={`bg-neutral-900/30 backdrop-blur-sm rounded-xl p-4 md:p-5 flex items-center gap-4 border transition-all ${
                    isCurrent 
                      ? 'border-[#D6B36A]/50 bg-[#D6B36A]/5' 
                      : isCompleted
                      ? 'border-white/5'
                      : 'border-white/5 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                      isCompleted
                        ? 'bg-[#D6B36A]/20 text-[#D6B36A] border border-[#D6B36A]/30'
                        : isCurrent
                        ? 'bg-[#D6B36A] text-black border border-[#D6B36A]'
                        : 'bg-white/5 text-neutral-400 border border-white/10'
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={`font-medium mb-1 ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {node.title}
                    </h3>
                    {node.description && (
                      <p 
                        className="text-sm text-neutral-500 line-clamp-1"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {node.description}
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <span 
                      className="text-xs text-[#D6B36A] font-medium px-2 py-1 bg-[#D6B36A]/10 rounded-md"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Completed
                    </span>
                  )}
                  {isCurrent && !isCompleted && (
                    <span 
                      className="text-xs text-[#D6B36A] font-medium px-2 py-1 bg-[#D6B36A]/10 rounded-md"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Current Step
                    </span>
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

