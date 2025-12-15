import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAgencyClients, getUserOrgs } from '@/app/actions/orgs';
import ClientsList from '@/app/components/ClientsList';

/**
 * HQ Clients Page - Manage all client organizations
 */
export default async function HQClientsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const supabase = await createServerClient();

  // Get user's orgs
  const orgsResult = await getUserOrgs();
  const userOrgs = (orgsResult.data || []) as any[];

  // Find agency org
  const agencyOrg = userOrgs.find((o: any) => o.orgs.kind === 'agency');
  
  if (!agencyOrg) {
    return (
      <div>
        <h1 className="text-3xl font-light text-primary mb-8">Clients</h1>
        <div className="glass-surface border border-yellow-400/20 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            You need to be part of an agency organization to manage clients.
          </p>
        </div>
      </div>
    );
  }

  // Get clients for this agency
  const clientsResult = await getAgencyClients(agencyOrg.org_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-primary">Clients</h1>
          <p className="text-secondary mt-2">Manage all client organizations</p>
        </div>
      </div>

      <ClientsList
        clients={clientsResult.data || []}
        agencyOrgId={agencyOrg.org_id}
      />
    </div>
  );
}

