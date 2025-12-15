/**
 * Client Setup Page - Agency-only configuration
 * Route: /org/:orgId/setup
 * 4 tabs: Services, Onboarding, Dashboard Builder, Preview
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import ClientSetup from '@/app/components/ClientSetup';

export default async function ClientSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const { tab } = await searchParams;
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
  }

  // Get org info
  const { data: activeOrg } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', supabaseOrgId)
    .single();

  // If no org found, try to sync it first
  if (!activeOrg && orgId.startsWith('org_')) {
    const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
    
    if (syncResult && 'data' in syncResult) {
      supabaseOrgId = (syncResult.data as any).id;
      
      // Re-fetch org
      const { data: newOrg } = await supabase
        .from('orgs')
        .select('*')
        .eq('id', supabaseOrgId)
        .single();
      
      if (!newOrg) {
        redirect('/dashboard');
      }
    } else {
      redirect('/dashboard');
    }
  } else if (!activeOrg) {
    redirect('/dashboard');
  }

  // Verify user is admin/owner of agency that manages this client
  const orgKind = ((activeOrg as any) || {})?.kind || 'client';
  
  // Check user's membership in this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();
  
  // If no membership, try to add user as owner (for setup/testing)
  if (!membership) {
    // Try to sync org first if it's a Clerk org
    if (orgId.startsWith('org_')) {
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      }
    }
    
    // Add user as owner if org exists
    const { data: orgExists } = await supabase
      .from('orgs')
      .select('id')
      .eq('id', supabaseOrgId)
      .single();
    
    if (orgExists) {
      await supabase
        .from('org_members')
        .upsert({
          org_id: supabaseOrgId,
          user_id: userId,
          role: 'owner',
        } as any, {
          onConflict: 'org_id,user_id',
        });
    }
  }
  
  // Re-check membership after potential sync
  const { data: finalMembership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!finalMembership || !['owner', 'admin'].includes((finalMembership as any).role)) {
    // For client orgs, check if user is agency admin
    if (orgKind === 'client') {
      const { data: agencyAccess } = await supabase
        .from('agency_clients')
        .select('agency_org_id')
        .eq('client_org_id', supabaseOrgId)
        .maybeSingle();
      
      if (agencyAccess && (agencyAccess as any).agency_org_id) {
        const { data: agencyMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (agencyAccess as any).agency_org_id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!agencyMembership || !['owner', 'admin'].includes((agencyMembership as any).role)) {
          redirect(`/${orgId}/dashboard`);
        }
      } else {
        redirect(`/${orgId}/dashboard`);
      }
    } else {
      redirect(`/${orgId}/dashboard`);
    }
  }

  return (
    <ClientSetup
      orgId={supabaseOrgId}
      orgName={(activeOrg as any)?.name || 'Organization'}
      initialTab={tab || 'services'}
      clerkOrgId={orgId.startsWith('org_') ? orgId : undefined}
    />
  );
}

