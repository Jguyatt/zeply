import Header from './components/Header';
import Hero from './components/Hero';
import LogoBanner from './components/LogoBanner';
import Steps from './components/Steps';
import FileManagement from './components/FileManagement';
import AutomatedWorkflows from './components/AutomatedWorkflows';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server'; // CHANGED: Import Service Client

export default async function Home() {
  // If user is signed in, redirect them to appropriate dashboard
  const { userId } = await auth();
  
  if (userId) {
    // CHANGED: Use service client to bypass RLS for onboarding checks
    const supabase = createServiceClient();
    
    const { isUserAdmin, getUserFirstMemberOrg } = await import('@/app/lib/auth');
    const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
    
    // Check if user has any org memberships at all
    const { data: existingMemberships } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId);
    
    // If user has no org memberships, automatically create agency org
    if (!existingMemberships || existingMemberships.length === 0) {
      // Create a new agency org for the user automatically
      const user = await currentUser();
      const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
      
      const { data: newOrg } = await (supabase
        .from('orgs') as any)
        .insert({
          name: `${userName}'s Agency`,
          kind: 'agency',
        })
        .select()
        .single();
      
      if (newOrg) {
        // Await membership creation so it's ready for redirect check
        await (supabase
          .from('org_members') as any)
          .insert({
            org_id: (newOrg as any).id,
            user_id: userId,
            role: 'owner',
          });
      }
    } else {
      // User has memberships - ensure they're an owner/admin of at least one org
      const hasAdminRole = existingMemberships.some((m: any) => m.role === 'owner' || m.role === 'admin');
      
      if (!hasAdminRole) {
        // User is only a member - check if they should be an admin
        // If they have an agency org, make them owner
        for (const membership of existingMemberships) {
          const membershipTyped = membership as { org_id: string; role: string };
          const { data: org } = await (supabase
            .from('orgs') as any)
            .select('kind')
            .eq('id', membershipTyped.org_id)
            .maybeSingle();
          
          if (org && (org as any).kind === 'agency') {
            // Update to owner
            await (supabase
              .from('org_members') as any)
              .update({ role: 'owner' })
              .eq('org_id', membershipTyped.org_id)
              .eq('user_id', userId);
            break; // Found agency org, update and exit
          }
        }
      }
    }
    
    // Handle invitation acceptance: Sync any Clerk orgs the user is a member of
    // This ensures that when a user accepts an invitation, the org is synced to Supabase
    try {
      const user = await currentUser();
      const userWithOrgs = user as any;
      if (userWithOrgs?.organizationMemberships && userWithOrgs.organizationMemberships.length > 0) {
        // User is a member of Clerk orgs - ensure they're synced to Supabase
        for (const membership of userWithOrgs.organizationMemberships) {
          const clerkOrgId = membership.organization.id;
          const clerkOrgName = membership.organization.name || 'Organization';
          
          // Check if this Clerk org exists in Supabase
          const { data: existingOrg } = await supabase
            .from('orgs')
            .select('id')
            .eq('clerk_org_id', clerkOrgId)
            .maybeSingle();
          
          if (!existingOrg) {
            // Org doesn't exist in Supabase - sync it
            await syncClerkOrgToSupabase(clerkOrgId, clerkOrgName);
          } else {
            // Org exists - ensure user is a member in Supabase
            const { data: memberCheck } = await supabase
              .from('org_members')
              .select('id, role')
              .eq('org_id', (existingOrg as any).id)
              .eq('user_id', userId)
              .maybeSingle();
            
            if (!memberCheck) {
              // User is not a member in Supabase but is in Clerk - add them
              // Determine role: check if they're an admin in Clerk
              // Clerk roles: 'org:admin' or 'org:member' with permissions
              const clerkRole = membership.role;
              const isClerkAdmin = clerkRole === 'org:admin' || 
                                   (clerkRole === 'org:member' && membership.permissions?.includes('org:members:manage'));
              const supabaseRole = isClerkAdmin ? 'admin' : 'member';
              
              await (supabase
                .from('org_members') as any)
                .upsert({
                  org_id: (existingOrg as any).id,
                  user_id: userId,
                  role: supabaseRole,
                }, {
                  onConflict: 'org_id,user_id',
                });
            } else {
              // Check if user should be upgraded to admin based on Clerk role
              const clerkRole = membership.role;
              const isClerkAdmin = clerkRole === 'org:admin' || 
                                   (clerkRole === 'org:member' && membership.permissions?.includes('org:members:manage'));
              
              const memberCheckTyped = memberCheck as { role: string } | null;
              if (memberCheckTyped?.role === 'member' && isClerkAdmin) {
                // User is a member but should be admin - upgrade them
                await (supabase
                  .from('org_members') as any)
                  .update({ role: 'admin' })
                  .eq('org_id', (existingOrg as any).id)
                  .eq('user_id', userId);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Clerk orgs:', error);
      // Continue with redirect even if sync fails
    }
    
    // No wait needed - org is already created if it was needed
    // Check role - single attempt, fast
    let memberOrgId: string | null = null;
    let userIsAdmin = false;
    
    try {
      userIsAdmin = await isUserAdmin();
      if (!userIsAdmin) {
        memberOrgId = await getUserFirstMemberOrg();
      }
    } catch (error) {
      console.error('Error checking role:', error);
      // On error, redirect to dashboard - it will handle properly
      redirect('/dashboard');
    }
    
    // Redirect authenticated users based on their role
    if (userIsAdmin) {
      redirect('/dashboard');
    } else if (memberOrgId) {
      const { data: org } = await supabase
        .from('orgs')
        .select('clerk_org_id')
        .eq('id', memberOrgId)
        .maybeSingle();
      
      if (org && (org as any).clerk_org_id) {
        redirect(`/${(org as any).clerk_org_id}/dashboard`);
      } else {
        redirect('/dashboard');
      }
    } else {
      // No org found - redirect to dashboard anyway
      redirect('/dashboard');
    }
  }
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-charcoal">
      {/* Full-bleed background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#151823] via-[#0B0D10] to-[#0B0D10]" />
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1E3A8A]/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[700px] -translate-y-1/2 rounded-full bg-[#4C1D95]/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[600px] rounded-full bg-[#1E40AF]/15 blur-3xl" />
      </div>

      <Header />
      <Hero />
      <LogoBanner />
      <Steps />
      <FileManagement />
      <AutomatedWorkflows />
      <CTASection />
      <Footer />
    </main>
  );
}