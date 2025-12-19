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
import OnboardingSignOutButton from '@/app/components/OnboardingSignOutButton';
import OnboardingWelcomeScreen from '@/app/components/OnboardingWelcomeScreen';
import OnboardingCompleteButton from '@/app/components/OnboardingCompleteButton';
import TermsOnboardingWrapper from '@/app/components/TermsOnboardingWrapper';
import { ContractSigningForm } from '@/app/components/ContractSigningWrapper';
import InvoicePaidButton from '@/app/components/InvoicePaidButton';

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:non-member-redirect',message:'Onboarding page redirecting non-member',data:{orgId,userRole,redirectTarget:userRole === 'admin' || userRole === 'owner' ? `/admin/${orgId}/dashboard` : `/client/${orgId}/dashboard`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // Redirect to canonical route based on role
    if (userRole === 'admin' || userRole === 'owner') {
      redirect(`/admin/${orgId}/dashboard`);
    } else {
      redirect(`/client/${orgId}/dashboard`);
    }
  }

  // Check if onboarding is complete
  const complete = await isOnboardingComplete(supabaseOrgId, userId);
  if (complete) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:complete-redirect',message:'Onboarding page redirecting - onboarding complete',data:{orgId,complete,redirectTarget:`/client/${orgId}/dashboard`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // Redirect to canonical client route (members always go to /client/)
    redirect(`/client/${orgId}/dashboard`);
  }

  // Get published flow
  const flowResult = await getPublishedOnboardingFlow(supabaseOrgId);
  if (!flowResult.data || !flowResult.data.nodes.length) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/page.tsx:no-flow-redirect',message:'Onboarding page redirecting - no published flow',data:{orgId,hasFlow:!!flowResult.data,nodeCount:flowResult.data?.nodes?.length || 0,redirectTarget:`/client/${orgId}/dashboard`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // No flow published, redirect to canonical client route
    redirect(`/client/${orgId}/dashboard`);
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
    <OnboardingWelcomeScreen orgName={orgName}>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D6B36A]/10 rounded-full mix-blend-screen filter blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D6B36A]/5 rounded-full mix-blend-screen filter blur-[100px]" />
        </div>

        {/* Sign Out Button - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <OnboardingSignOutButton />
        </div>

        {/* Content - Full page with 9/11 aspect ratio frame */}
        <div className="relative z-10 flex flex-col items-center py-4 px-2 md:px-4 min-h-screen">
          {/* Progress Indicator - Minimal overlay at top */}
          <div className="sticky top-4 z-30 bg-neutral-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <span 
                className="text-xs text-neutral-400 font-light whitespace-nowrap"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Progress
              </span>
              <div className="w-32 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D6B36A] to-[#D6B36A]/80 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span 
                className="text-xs font-medium text-white whitespace-nowrap"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Current Step - Full page 9/11 aspect ratio frame (no internal scroll) */}
          <div 
            className="w-full bg-neutral-900/50 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden"
            style={{ 
              width: 'min(90vw, calc(90vh * 9 / 11))',
              maxWidth: 'calc(100vw - 32px)',
              minHeight: 'min(calc(90vw * 11 / 9), 90vh)'
            }}
          >
            <OnboardingStepRenderer
              node={nextNode}
              orgId={supabaseOrgId}
              clerkOrgId={orgId}
              userId={userId}
              allNodes={nodes}
              completedNodeIds={completedNodeIds}
              hideButton={true}
            />
          </div>

          {/* Form inputs and Button - Outside the frame */}
          {nextNode.type === 'terms' ? (
            <TermsOnboardingWrapper
              nodeId={nextNode.id}
              clerkOrgId={orgId}
              termsUrl={nextNode.config?.terms_url}
              privacyUrl={nextNode.config?.privacy_url}
            />
          ) : nextNode.type === 'contract' ? (
            <div className="mt-6 mb-6 flex flex-col items-center">
              <ContractSigningForm
                node={nextNode}
                clerkOrgId={orgId}
                loading={false}
                completedNodeIds={completedNodeIds}
                allNodes={nodes}
              />
            </div>
          ) : nextNode.type === 'invoice' ? (
            <div className="mt-6 mb-6 flex flex-col items-center gap-3">
              {nextNode.config?.payment_status !== 'paid' && nextNode.config?.payment_status !== 'confirmed' && nextNode.config?.stripe_url ? (
                <>
                  <a
                    href={nextNode.config.stripe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Pay Now
                  </a>
                  <p 
                    className="text-neutral-400 text-sm text-center max-w-md"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    After completing payment, click "I've Paid" below to proceed to the next step.
                  </p>
                  <InvoicePaidButton
                    nodeId={nextNode.id}
                    clerkOrgId={orgId}
                  />
                </>
              ) : nextNode.config?.payment_status === 'paid' || nextNode.config?.payment_status === 'confirmed' ? (
                <OnboardingCompleteButton
                  nodeId={nextNode.id}
                  clerkOrgId={orgId}
                />
              ) : (
                <div className="p-4 bg-neutral-800/50 rounded-lg border border-white/10">
                  <p 
                    className="text-neutral-400 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    No payment link configured. Please contact support.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 mb-6 flex justify-center">
              <OnboardingCompleteButton
                nodeId={nextNode.id}
                clerkOrgId={orgId}
              />
            </div>
          )}
        </div>
      </div>
    </OnboardingWelcomeScreen>
  );
}

