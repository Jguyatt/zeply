import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import { Building2, AlertTriangle } from 'lucide-react';
import StripeCustomerMapping from '@/app/components/StripeCustomerMapping';

/**
 * Client Settings Page - Admin-only client management settings
 */
export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      // Try to sync the org
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
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
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { data: retryMembership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!retryMembership) {
      const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        const { data: finalMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (syncResult.data as any).id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!finalMembership) {
          redirect('/dashboard');
        }
      } else {
        redirect('/dashboard');
      }
    }
  } else if (!membership) {
    redirect('/dashboard');
  }

  const userRole = (membership as any)?.role || 'member';
  const isAdmin = userRole === 'owner' || userRole === 'admin';

  if (!isAdmin) {
    redirect(`/${orgId}/dashboard`);
  }

  // Get org info
  const { data: activeOrg } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', supabaseOrgId)
    .single();

  // Get agency workspace ID if this is a client org
  let agencyWorkspaceId: string | null = null;
  const orgKind = (activeOrg as any)?.kind;
  
  if (orgKind === 'client') {
    const { data: agencyClient } = await supabase
      .from('agency_clients')
      .select('agency_org_id')
      .eq('client_org_id', supabaseOrgId)
      .maybeSingle();
    
    if (agencyClient) {
      agencyWorkspaceId = (agencyClient as any).agency_org_id;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-primary">Client Settings</h1>
          <p className="text-secondary mt-2">Manage client status, billing, and organization settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Client Status */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Client Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Status</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Organization</span>
              <span className="text-primary">{(activeOrg as any)?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Stripe Billing Configuration */}
        {orgKind === 'client' && agencyWorkspaceId && (
          <StripeCustomerMapping
            workspaceId={agencyWorkspaceId}
            clientId={supabaseOrgId}
            clientName={(activeOrg as any)?.name || 'Client'}
            initialExternalBillingRef={(activeOrg as any)?.external_billing_ref || ''}
          />
        )}

        {/* Billing Plan */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Billing Plan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Current Plan</span>
              <span className="text-primary">-</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Billing Cycle</span>
              <span className="text-primary">-</span>
            </div>
          </div>
        </div>

        {/* Internal Tags */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Internal Tags</h3>
          <div className="space-y-3">
            <p className="text-secondary text-sm">No tags assigned</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border border-red-500/20">
          <h3 className="text-lg font-light text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <div className="space-y-3">
            <button className="px-4 py-2 glass-surface text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm border border-red-500/20">
              Archive Client
            </button>
            <button className="px-4 py-2 glass-surface text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm border border-red-500/20">
              Transfer Ownership
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
