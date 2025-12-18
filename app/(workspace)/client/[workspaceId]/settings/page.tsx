/**
 * Client Settings Page
 * Limited settings view for clients
 */

import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { Settings, User, Bell } from 'lucide-react';

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // CRITICAL SECURITY CHECK
  await requireWorkspaceAccess(workspaceId, 'member', '/dashboard');

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      redirect('/dashboard');
    }
  }

  const supabase = await createServerClient();
  const { userId } = await auth();

  // Get workspace name
  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', supabaseWorkspaceId)
    .maybeSingle();

  const orgName = (org as any)?.name || 'Workspace';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary mb-2">Settings</h1>
        <p className="text-secondary">Manage your workspace preferences</p>
      </div>

      <div className="space-y-6">
        {/* Workspace Info */}
        <div className="glass-surface glass-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-medium text-primary">Workspace</h2>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-secondary text-sm mb-1">Workspace Name</p>
              <p className="text-primary">{orgName}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-surface glass-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-medium text-primary">Account</h2>
          </div>
          <p className="text-secondary text-sm">
            Account settings are managed by your organization administrator.
            Contact your team lead for changes to your account.
          </p>
        </div>

        {/* Notifications */}
        <div className="glass-surface glass-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-medium text-primary">Notifications</h2>
          </div>
          <p className="text-secondary text-sm">
            Notification preferences are managed by your organization administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
