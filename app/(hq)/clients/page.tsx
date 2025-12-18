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
  
  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clients/page.tsx:getUserOrgsResult',message:'getUserOrgs result',data:{hasError:!!orgsResult.error,error:orgsResult.error,userOrgsCount:userOrgs.length,userOrgs:userOrgs.map((o:any)=>({orgId:o.org_id,role:o.role,orgKind:(o.orgs as any)?.kind,orgName:(o.orgs as any)?.name,clerkOrgId:(o.orgs as any)?.clerk_org_id}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  // Find agency org
  const agencyOrg = userOrgs.find((o: any) => o.orgs.kind === 'agency');
  
  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clients/page.tsx:agencyOrgCheck',message:'Agency org check',data:{hasAgencyOrg:!!agencyOrg,agencyOrgId:agencyOrg?.org_id,allOrgKinds:userOrgs.map((o:any)=>(o.orgs as any)?.kind)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  
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

