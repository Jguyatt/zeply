import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getUserWorkspaces } from '@/app/lib/routing';
import { redirectToWorkspace } from '@/app/lib/routing';
import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';

export default async function SelectWorkspacePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const workspaces = await getUserWorkspaces();

  // If only one workspace, auto-redirect
  if (workspaces.length === 1) {
    const workspaceId = workspaces[0].clerkOrgId || workspaces[0].id;
    await redirectToWorkspace(workspaceId);
  }

  // If no workspaces, redirect to dashboard
  if (workspaces.length === 0) {
    redirect('/dashboard');
  }

  const getRoleBadge = (role: string) => {
    if (role === 'owner' || role === 'admin') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-accent/20 text-accent border border-accent/30">
          Admin
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/10 text-secondary border border-white/10">
        Member
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-primary mb-2">Select Workspace</h1>
          <p className="text-secondary">Choose a workspace to continue</p>
        </div>

        <div className="space-y-3">
          {workspaces.map((workspace) => {
            const workspaceId = workspace.clerkOrgId || workspace.id;
            const routeType = workspace.role === 'member' ? 'client' : 'admin';
            const href = routeType === 'client' 
              ? `/client/${workspaceId}/dashboard`
              : `/admin/${workspaceId}/dashboard`;

            return (
              <Link
                key={workspace.id}
                href={href}
                className="block glass-surface glass-border rounded-lg p-6 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-primary mb-1">
                        {workspace.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(workspace.role)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
