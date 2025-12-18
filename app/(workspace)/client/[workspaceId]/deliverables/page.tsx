/**
 * Client Deliverables Page
 * Read-only view of client-visible deliverables
 */

import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getDeliverables } from '@/app/actions/deliverables';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import Link from 'next/link';
import { FileText, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default async function ClientDeliverablesPage({
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

  // Fetch deliverables (client view only)
  const deliverablesResult = await getDeliverables(supabaseWorkspaceId, true);
  const deliverables = deliverablesResult.data || [];

  // Filter to only client-visible
  const visibleDeliverables = deliverables.filter((d: any) => d.client_visible !== false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_review':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Awaiting Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approved
          </span>
        );
      case 'complete':
      case 'delivered':
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </span>
        );
      default:
        return (
          <span className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary mb-2">Deliverables</h1>
        <p className="text-secondary">Review and approve completed work</p>
      </div>

      {visibleDeliverables.length === 0 ? (
        <div className="glass-surface glass-border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">No deliverables yet</h3>
          <p className="text-secondary">
            Completed work will appear here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleDeliverables.map((deliverable: any) => (
            <Link
              key={deliverable.id}
              href={`/client/${workspaceId}/deliverables/${deliverable.id}`}
              className="block glass-surface glass-border rounded-lg p-8 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <FileText className="w-6 h-6 text-accent" />
                    <h3 className="text-2xl font-medium text-primary">{deliverable.title}</h3>
                  </div>
                  {deliverable.description && (
                    <p className="text-secondary text-base mb-4 line-clamp-3">
                      {deliverable.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-base text-secondary">
                    <span>Updated {formatDate(deliverable.updated_at || deliverable.created_at)}</span>
                    {deliverable.type && (
                      <span className="px-3 py-1 rounded bg-white/10 text-sm">
                        {deliverable.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-6">
                  {getStatusBadge(deliverable.status)}
                  {deliverable.status === 'in_review' && (
                    <ArrowRight className="w-6 h-6 text-accent" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
