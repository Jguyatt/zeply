import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserOrgs } from '@/app/actions/orgs';
import Link from 'next/link';
import { Users, Building2, Briefcase, Calendar, ArrowRight, BadgeCheck } from 'lucide-react';

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

  // Calculate accurate metrics
  const agencyOrgs = allOrgs.filter((o: any) => o.orgs?.kind === 'agency');
  const clientOrgs = allOrgs.filter((o: any) => o.orgs?.kind === 'client');
  
  // Get member counts and deliverables for each org
  const orgsWithStats = await Promise.all(
    allOrgs.map(async (org: any) => {
      const orgId = org.org_id;
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('org_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      
      // Get deliverables count
      const { count: deliverablesCount } = await supabase
        .from('deliverables')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      
      return {
        ...org,
        memberCount: memberCount || 0,
        deliverablesCount: deliverablesCount || 0,
      };
    })
  );

  // Calculate total deliverables across all orgs
  const totalDeliverables = orgsWithStats.reduce(
    (acc, org) => acc + org.deliverablesCount,
    0
  );

  // Calculate total members across all orgs (sum of all member counts)
  const totalMembers = orgsWithStats.reduce(
    (acc, org) => acc + org.memberCount,
    0
  );

  // Sort orgs by most recent activity (created_at)
  const sortedOrgs = [...orgsWithStats].sort((a, b) => {
    const dateA = new Date(a.orgs?.created_at || 0).getTime();
    const dateB = new Date(b.orgs?.created_at || 0).getTime();
    return dateB - dateA;
  });

  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';

  // Get org ID for navigation - prefer clerk_org_id if available, otherwise use Supabase UUID
  const getOrgIdForNavigation = (org: any) => {
    // Prefer clerk_org_id if it exists (Clerk format)
    if (org.orgs?.clerk_org_id) {
      return org.orgs.clerk_org_id;
    }
    // Fallback to Supabase UUID (routing will handle it)
    return org.org_id;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-light text-primary mb-2">
          Agency HQ
        </h1>
        <p className="text-secondary">
          Manage all your organizations and agency operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center border border-white/5">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {allOrgs.length}
          </div>
          <div className="text-sm text-secondary">Total Organizations</div>
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <span>{agencyOrgs.length} Agency</span>
            <span>{clientOrgs.length} Client</span>
          </div>
        </div>

        <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center border border-white/5">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {totalMembers || 0}
          </div>
          <div className="text-sm text-secondary">Total Members</div>
          <div className="mt-2 text-xs text-muted">
            Across all organizations
          </div>
        </div>

        <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center border border-white/5">
              <Briefcase className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-primary mb-1">
            {totalDeliverables}
          </div>
          <div className="text-sm text-secondary">Total Deliverables</div>
          <div className="mt-2 text-xs text-muted">
            Across all organizations
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="glass-surface rounded-lg shadow-prestige-soft border border-white/5">
        <div className="p-6 glass-border-b border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-primary">Organizations</h2>
            <p className="text-xs text-secondary mt-1">All organizations you're a member of</p>
          </div>
        </div>
        <div className="p-6">
          {sortedOrgs.length > 0 ? (
            <div className="space-y-3">
              {sortedOrgs.map((org: any) => {
                const orgIdForNav = getOrgIdForNavigation(org);
                const orgKind = org.orgs?.kind || 'client';
                const orgName = org.orgs?.name || 'Unknown Organization';
                const userRole = org.role || 'member';
                const createdDate = org.orgs?.created_at 
                  ? new Date(org.orgs.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })
                  : '';

                return (
                  <Link
                    key={org.org_id}
                    href={`/${orgIdForNav}/dashboard`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center border border-white/5 flex-shrink-0">
                        <Building2 className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary truncate">
                            {orgName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              orgKind === 'agency'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {orgKind === 'agency' ? (
                              <>
                                <BadgeCheck className="w-3 h-3" />
                                Agency
                              </>
                            ) : (
                              'Client'
                            )}
                          </span>
                          {userRole === 'owner' || userRole === 'admin' ? (
                            <span className="text-xs text-muted">• {userRole}</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-secondary">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {org.deliverablesCount} {org.deliverablesCount === 1 ? 'deliverable' : 'deliverables'}
                          </span>
                          {createdDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {createdDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0 ml-4" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
              <p className="text-sm text-secondary mb-2">No organizations yet</p>
              <p className="text-xs text-muted mb-6">
                Create or join an organization to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

