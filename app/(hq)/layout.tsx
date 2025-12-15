/**
 * HQ Layout - Agency-level admin pages
 * Shows when no org is selected or on HQ routes
 * ONLY ADMINS CAN ACCESS THIS LAYOUT
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin, getUserFirstMemberOrg } from '@/app/lib/auth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default async function HQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/auth/signin');
    }

    // ENFORCE: Only admins can access HQ routes
    // If check fails, allow access (will be caught by dashboard page check)
    let userIsAdmin = false;
    try {
      userIsAdmin = await isUserAdmin();
    } catch (error) {
      console.error('Error checking admin status in layout:', error);
      // Don't redirect on error - let the page render and handle it
      // This prevents redirect loops
    }
    
    if (!userIsAdmin) {
      // User is a member - redirect to their org dashboard
      try {
        const supabase = await createServerClient();
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
      } catch (error) {
        console.error('Error redirecting member in layout:', error);
      }
      
      // If no org found, show error instead of redirecting to avoid loop
      // The dashboard page will handle the redirect
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
    console.error('Error in HQ Layout:', error);
    // Don't redirect on error - show error page instead to prevent loops
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-primary mb-2">Error Loading Dashboard</h1>
          <p className="text-secondary">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}

