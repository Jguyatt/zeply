/**
 * Client Deliverable Detail Page
 * Read-only view of a single deliverable
 */

import { redirect, notFound } from 'next/navigation';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getDeliverables } from '@/app/actions/deliverables';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import ClientDeliverableActions from './ClientDeliverableActions';

export default async function ClientDeliverableDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; id: string }>;
}) {
  const { workspaceId, id } = await params;

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

  // Find the specific deliverable
  const deliverable = deliverables.find((d: any) => d.id === id);

  if (!deliverable) {
    notFound();
  }

  // Filter to only client-visible updates and assets
  const clientVisibleUpdates = (deliverable.deliverable_updates || [])
    .filter((update: any) => update.client_visible !== false)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const clientVisibleAssets = (deliverable.deliverable_assets || [])
    .filter((asset: any) => asset.client_visible !== false);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Link
        href={`/client/${workspaceId}/deliverables`}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deliverables
      </Link>

      {/* Main Deliverable Card - Large */}
      <div className="glass-surface glass-border rounded-lg p-10 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-light text-primary">{deliverable.title}</h1>
            </div>
            {deliverable.type && (
              <span className="inline-block px-4 py-2 rounded-lg bg-white/10 text-base mb-4">
                {deliverable.type}
              </span>
            )}
          </div>
          <div>
            {getStatusBadge(deliverable.status)}
          </div>
        </div>

        {deliverable.description && (
          <div className="mb-6">
            <p className="text-lg text-secondary leading-relaxed whitespace-pre-wrap">
              {deliverable.description}
            </p>
          </div>
        )}

        <div className="flex items-center gap-6 text-base text-secondary pt-6 border-t border-white/10">
          {deliverable.updated_at && (
            <span>Updated {formatDate(deliverable.updated_at)}</span>
          )}
          {deliverable.due_date && (
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due {formatDate(deliverable.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Updates Timeline */}
      {clientVisibleUpdates.length > 0 && (
        <div className="glass-surface glass-border rounded-lg p-10 mb-6">
          <h2 className="text-2xl font-light text-primary mb-6">Updates</h2>
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/10" />
            
            <div className="space-y-6">
              {clientVisibleUpdates.map((update: any, idx: number) => {
                const isLast = idx === clientVisibleUpdates.length - 1;
                return (
                  <div key={update.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white/20 bg-white/5 -translate-x-[26px] translate-y-1`} />
                    {!isLast && (
                      <div className="absolute left-0 w-px h-full bg-white/10 -translate-x-[22px] translate-y-6" />
                    )}
                    
                    {/* Update content */}
                    <div className="pl-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-medium text-primary">{update.stage}</span>
                        <span className="text-sm text-secondary">•</span>
                        <span className="text-sm text-secondary">{formatRelativeTime(update.created_at)}</span>
                      </div>
                      {update.note && (
                        <p className="text-base text-secondary leading-relaxed whitespace-pre-wrap">{update.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assets */}
      {clientVisibleAssets.length > 0 && (
        <div className="glass-surface glass-border rounded-lg p-10 mb-6">
          <h2 className="text-2xl font-light text-primary mb-6">Attachments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientVisibleAssets.map((asset: any) => (
              <a
                key={asset.id}
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-base text-primary truncate">{asset.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions (Approve/Request Changes) - Only for in_review status */}
      {deliverable.status === 'in_review' && (
        <div className="glass-surface glass-border rounded-lg p-10">
          <ClientDeliverableActions deliverableId={id} />
        </div>
      )}
    </div>
  );
}
