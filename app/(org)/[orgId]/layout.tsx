/**
 * Workspace Layout - Org-scoped pages
 * Shows when an org is selected
 */

import { redirect } from 'next/navigation';
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

    // Handle Clerk org ID vs Supabase UUID
    let supabaseOrgId = orgId;
  
    if (orgId.startsWith('org_')) {
      try {
        // This is a Clerk org ID, find or create the matching Supabase org
        const orgResult = await getSupabaseOrgIdFromClerk(orgId);
        
        if (orgResult && 'data' in orgResult) {
          supabaseOrgId = orgResult.data;
        } else {
          // Org doesn't exist yet - try to sync it
          // Get org name from Clerk (you might need to pass this differently)
          const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
          
          if (syncResult && 'data' in syncResult) {
            supabaseOrgId = (syncResult.data as any).id;
          } else {
            // Fallback: redirect to dashboard
            redirect('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error syncing org:', error);
        redirect('/dashboard');
      }
    }

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

    return (
      <div className="min-h-screen bg-charcoal flex flex-col">
        <TopBar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 ml-64 transition-all duration-300">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in WorkspaceLayout:', error);
    // Redirect to dashboard on any error to prevent RSC payload failures
    redirect('/dashboard');
  }
}
