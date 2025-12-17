import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserOrgs } from '@/app/actions/orgs';
import DashboardContent from '@/app/components/DashboardContent';

/**
 * HQ Dashboard - Agency-level overview
 * Shows when no org is selected
 */
export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function HQDashboardPage() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect('/auth/signin');
    }

    const user = await currentUser();
    const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';

    // Get basic org list
    let allOrgs: any[] = [];
    try {
      const orgsResult = await getUserOrgs();
      allOrgs = (orgsResult.data || []) as any[];
    } catch (error) {
      console.error('Error fetching user orgs:', error);
    }

    // Calculate basic metrics
    const agencyOrgs = allOrgs.filter((o: any) => o.orgs?.kind === 'agency');
    const clientOrgs = allOrgs.filter((o: any) => o.orgs?.kind === 'client');
    
    // Sort orgs by created_at
    const sortedOrgs = [...allOrgs].sort((a, b) => {
      const dateA = new Date(a.orgs?.created_at || 0).getTime();
      const dateB = new Date(b.orgs?.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Load stats efficiently
    const supabase = await createServerClient();
    const orgIds = allOrgs.map(org => org.org_id);
    
    let totalMembers = 0;
    let totalDeliverables = 0;
    
    if (orgIds.length > 0) {
      try {
        const memberCountsByOrg = await Promise.all(
          orgIds.map(async (orgId) => {
            const { count } = await supabase
              .from('org_members')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId);
            return { orgId, count: count || 0 };
          })
        );
      
        const deliverablesCountsByOrg = await Promise.all(
          orgIds.map(async (orgId) => {
            const { count } = await supabase
              .from('deliverables')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId);
            return { orgId, count: count || 0 };
          })
        );
        
        totalMembers = memberCountsByOrg.reduce((sum, m) => sum + m.count, 0);
        totalDeliverables = deliverablesCountsByOrg.reduce((sum, d) => sum + d.count, 0);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }

    // Get first owned org for financial metrics
    const orgsYouOwn = sortedOrgs.filter((org: any) => 
      org.role === 'owner' || org.role === 'admin'
    );
    const firstOwnedOrg = orgsYouOwn.length > 0 ? orgsYouOwn[0] : null;
    const workspaceId = firstOwnedOrg?.org_id || null;

    // Check Stripe connection
    let isStripeConnected = false;
    if (workspaceId) {
      const { data: stripeAccount } = await supabase
        .from('stripe_accounts')
        .select('stripe_account_id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();
      isStripeConnected = !!stripeAccount;
    }
    
    return <DashboardContent 
      userName={userName}
      allOrgs={allOrgs}
      agencyOrgs={agencyOrgs}
      clientOrgs={clientOrgs}
      totalMembers={totalMembers}
      totalDeliverables={totalDeliverables}
      workspaceId={workspaceId}
      workspaceName={firstOwnedOrg?.orgs?.name || firstOwnedOrg?.orgName || null}
      isStripeConnected={isStripeConnected}
    />;
  } catch (error) {
    console.error('Error in HQ Dashboard:', error);
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-text-primary mb-2">Error Loading Dashboard</h1>
          <p className="text-text-secondary mb-4">Please try refreshing the page.</p>
          <a href="/dashboard" className="text-accent hover:text-accent/80">
            Retry
          </a>
        </div>
      </div>
    );
  }
}

