/**
 * Workspace Layout - Org-scoped pages
 * Shows when an org is selected
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/auth/signin');
    }

    const supabase = await createServerClient();
    const { orgId } = await params;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:31',message:'WorkspaceLayout entry',data:{orgId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Handle Clerk org ID vs Supabase UUID
    let supabaseOrgId = orgId;
  
    if (orgId.startsWith('org_')) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:38',message:'Looking up Clerk org',data:{clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // This is a Clerk org ID, find or create the matching Supabase org
        const orgResult = await getSupabaseOrgIdFromClerk(orgId);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:44',message:'Org lookup result',data:{hasData:'data' in orgResult,hasError:'error' in orgResult,supabaseOrgId:orgResult && 'data' in orgResult ? orgResult.data : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (orgResult && 'data' in orgResult) {
          supabaseOrgId = orgResult.data;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:48',message:'Using existing org',data:{supabaseOrgId,clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:51',message:'Org not found, syncing',data:{clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          // Org doesn't exist yet - try to sync it
          // Function will fetch org name from Clerk automatically
          const syncResult = await syncClerkOrgToSupabase(orgId);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:57',message:'Sync result',data:{hasData:'data' in syncResult,hasError:'error' in syncResult,supabaseOrgId:syncResult && 'data' in syncResult ? (syncResult.data as any).id : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          if (syncResult && 'data' in syncResult) {
            supabaseOrgId = (syncResult.data as any).id;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:61',message:'Sync successful',data:{supabaseOrgId,clerkOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
          } else {
            // Fallback: redirect to dashboard
            redirect('/dashboard');
          }
        }
      } catch (error) {
        // Don't log NEXT_REDIRECT as an error - it's expected behavior
        if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        console.error('Error syncing org:', error);
        }
        redirect('/dashboard');
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:75',message:'Final supabaseOrgId determined',data:{supabaseOrgId,originalOrgId:orgId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Ensure we have a valid org ID
    if (!supabaseOrgId) {
      redirect('/dashboard');
    }

    // Verify user has access to this org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();

    // If no membership and we just created the org, wait a moment and check again
    if (!membership && orgId.startsWith('org_')) {
      // Give it a moment for the sync to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data: retryMembership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', supabaseOrgId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!retryMembership) {
        // Try to sync the org and add user as member
        const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
        
        if (syncResult && 'data' in syncResult) {
          // Org was created, now check membership again
          const { data: finalMembership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', (syncResult.data as any).id)
            .eq('user_id', userId)
            .maybeSingle();
          
          if (!finalMembership) {
            // Add user as owner if org exists but membership doesn't
            const { data: orgExists } = await supabase
              .from('orgs')
              .select('id')
              .eq('id', (syncResult.data as any).id)
              .maybeSingle();
            
            if (orgExists) {
              await supabase
                .from('org_members')
                .upsert({
                  org_id: (syncResult.data as any).id,
                  user_id: userId,
                  role: 'owner',
                } as any, {
                  onConflict: 'org_id,user_id',
                });
            } else {
              redirect('/dashboard');
            }
          }
        } else {
          redirect('/dashboard');
        }
      }
    } else if (!membership) {
      // For non-Clerk orgs, try to add user as member if org exists
      const { data: orgExists } = await supabase
        .from('orgs')
        .select('id')
        .eq('id', supabaseOrgId)
        .maybeSingle();
      
      if (orgExists) {
        // Add user as owner
        await supabase
          .from('org_members')
          .upsert({
            org_id: supabaseOrgId,
            user_id: userId,
            role: 'owner',
          } as any, {
            onConflict: 'org_id,user_id',
          });
      } else {
        redirect('/dashboard');
      }
    }

    // ENFORCE ACCESS CONTROL:
    // 1. Get final membership status (after all sync attempts)
    let finalMembership = membership;
    if (!finalMembership) {
      try {
        const { data: checkMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', supabaseOrgId)
          .eq('user_id', userId)
          .maybeSingle();
        finalMembership = checkMembership;
      } catch (error) {
        console.error('Error checking membership:', error);
        redirect('/dashboard');
      }
    }

    // 2. If user is not a member of this org, redirect appropriately
    if (!finalMembership) {
      try {
        const { isUserAdmin, getUserFirstMemberOrg } = await import('@/app/lib/auth');
        const userIsAdmin = await isUserAdmin();
        
        if (userIsAdmin) {
          // Admin trying to access org they're not a member of - redirect to HQ
          redirect('/dashboard');
        } else {
          // Member trying to access org they're not a member of - redirect to their org
          const memberOrgId = await getUserFirstMemberOrg();
          if (memberOrgId) {
            const { data: org } = await supabase
              .from('orgs')
              .select('clerk_org_id')
              .eq('id', memberOrgId)
              .maybeSingle();
            
            if (org && (org as any).clerk_org_id) {
              redirect(`/${(org as any).clerk_org_id}/dashboard`);
            }
          }
          redirect('/dashboard');
        }
      } catch (error) {
        console.error('Error in access control check:', error);
        redirect('/dashboard');
      }
    }

    // 3. If user is a member (not admin), ensure they can only access their own org
    const userRole = (finalMembership as any)?.role || 'member';
    const isMemberOnly = userRole === 'member';
    
    if (isMemberOnly) {
      try {
        // Member can only access this org - verify they're accessing the right one
        // Get all orgs user is a member of
        const { data: userMemberships } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', userId);
        
        const userOrgIds = (userMemberships || []).map((m: any) => m.org_id);
        
        // If user is trying to access an org they're not a member of, redirect to their first org
        if (!userOrgIds.includes(supabaseOrgId)) {
          const { getUserFirstMemberOrg } = await import('@/app/lib/auth');
          const memberOrgId = await getUserFirstMemberOrg();
          
          if (memberOrgId) {
            const { data: org } = await supabase
              .from('orgs')
              .select('clerk_org_id')
              .eq('id', memberOrgId)
              .maybeSingle();
            
            if (org && (org as any).clerk_org_id) {
              redirect(`/${(org as any).clerk_org_id}/dashboard`);
            }
          }
          redirect('/dashboard');
        }
      } catch (error) {
        console.error('Error verifying member org access:', error);
        redirect('/dashboard');
      }
    }

    // Update active org in profile (use maybeSingle to handle missing profile)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        active_org_id: supabaseOrgId,
      } as any, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    // ONBOARDING GATE: Check if member needs to complete onboarding
    if (userRole === 'member') {
      const { isOnboardingEnabled, isOnboardingComplete } = await import('@/app/actions/onboarding');
      const onboardingEnabled = await isOnboardingEnabled(supabaseOrgId);
      
      if (onboardingEnabled) {
        // Get current pathname from headers
        const headersList = await headers();
        const referer = headersList.get('referer') || '';
        const pathname = referer.split(orgId)[1] || '';
        
        // Check if user is already on onboarding page
        const isOnboardingPage = pathname.includes('/onboarding');
        
        if (!isOnboardingPage) {
          const onboardingComplete = await isOnboardingComplete(supabaseOrgId, userId);
          
          if (!onboardingComplete) {
            // Get Clerk org ID for redirect
            const { data: org } = await supabase
              .from('orgs')
              .select('clerk_org_id')
              .eq('id', supabaseOrgId)
              .maybeSingle();
            
            if (org && (org as any).clerk_org_id) {
              redirect(`/${(org as any).clerk_org_id}/onboarding`);
            } else {
              // Fallback to UUID if no Clerk org ID
              redirect(`/${supabaseOrgId}/onboarding`);
            }
          }
        }
      }
    }
    // Admins and owners always bypass onboarding gate

    return (
      <div className="min-h-screen bg-charcoal flex flex-col relative">
        {/* Premium Background Gradient */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-premium opacity-100" />
        {/* Noise Texture */}
        <div className="pointer-events-none fixed inset-0 bg-noise" />
        
        <TopBar />
        <div className="flex flex-1 relative z-10">
          <Sidebar />
          <main className="flex-1 ml-56 transition-all duration-300">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    // Don't log NEXT_REDIRECT as an error - it's expected behavior
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
    console.error('Error in WorkspaceLayout:', error);
    }
    // Redirect to dashboard on any error to prevent RSC payload failures
    redirect('/dashboard');
  }
}