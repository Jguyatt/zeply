import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserOrgs, getAgencyClients } from '@/app/actions/orgs';
import Link from 'next/link';
import { FileText, Users, TrendingUp, Building2, Plus, ArrowRight } from 'lucide-react';

/**
 * HQ Dashboard - Agency-level overview
 * Shows when no org is selected
 */
export default async function HQDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const user = await currentUser();
  const supabase = await createServerClient();

  // Get user's orgs with error handling
  let allOrgs: any[] = [];
  try {
    const orgsResult = await getUserOrgs();
    allOrgs = (orgsResult.data || []) as any[];
  } catch (error) {
    console.error('Error fetching user orgs:', error);
    // Continue with empty array
  }

  // Layout already enforces admin access, so we can trust it
  // No need to check again and redirect - just render the page

    // Find agency org
    const agencyOrg = allOrgs.find((o: any) => o.orgs?.kind === 'agency');

    // Get clients if this is an agency
    let clients: any[] = [];
    if (agencyOrg) {
      try {
        const clientsResult = await getAgencyClients(agencyOrg.org_id);
        clients = clientsResult?.data || [];
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Continue with empty array
      }
    }

    const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-light text-primary mb-2">
          Agency HQ
        </h1>
        <p className="text-secondary">
          Manage all your clients and agency operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <Link
              href="/clients"
              className="text-sm text-secondary hover:text-accent transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {clients.length}
          </div>
          <div className="text-sm text-secondary">Active Clients</div>
        </div>

        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {allOrgs.length}
          </div>
          <div className="text-sm text-secondary">Total Organizations</div>
        </div>

        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {clients.length > 0 ? clients.reduce((acc: number, client: any) => {
              // This would be calculated from actual project counts
              return acc;
            }, 0) : 0}
          </div>
          <div className="text-sm text-secondary">Total Projects</div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="glass-surface rounded-lg shadow-prestige-soft">
        <div className="p-6 glass-border-b flex items-center justify-between">
          <h2 className="text-lg font-medium text-primary">Clients</h2>
          <Link
            href="/clients"
            className="text-sm text-secondary hover:text-accent flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-6">
          {clients.length > 0 ? (
            <ul className="space-y-4">
              {clients.slice(0, 5).map((client: any) => (
                <li key={client.client_org_id}>
                  <Link
                    href={`/${client.client_org_id}/dashboard`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 glass-surface rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {client.orgs?.name || 'Unknown Client'}
                        </div>
                        <div className="text-xs text-secondary">
                          Client Organization
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-sm text-secondary mb-4">No clients yet</p>
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm shadow-prestige-soft"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

