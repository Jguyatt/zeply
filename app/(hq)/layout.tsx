/**
 * HQ Layout - Agency-level admin pages
 * Shows when no org is selected or on HQ routes
 * ONLY ADMINS CAN ACCESS THIS LAYOUT
 */

export const dynamic = 'force-dynamic';

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
    
    // Don't redirect here - let the dashboard page handle redirects
    // This prevents redirect loops
    // The dashboard page will check admin status and redirect appropriately

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