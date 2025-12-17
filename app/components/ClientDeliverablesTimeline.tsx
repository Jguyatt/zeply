'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { clientApprove, clientRequestRevisions } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  progress?: number;
  due_date?: string;
  description?: string;
  completed_at?: string;
  created_at: string;
  deliverable_assets?: Array<{
    id: string;
    name: string;
    url: string;
    kind: string;
    proof_type?: string;
  }>;
}

interface ClientDeliverablesTimelineProps {
  deliverables: Deliverable[];
  orgId: string;
}

export default function ClientDeliverablesTimeline({
  deliverables,
  orgId,
}: ClientDeliverablesTimelineProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState<Record<string, string>>({});
  const [showRevisionInput, setShowRevisionInput] = useState<Record<string, boolean>>({});

  // Filter to only client-visible statuses
  const visibleDeliverables = deliverables.filter((d) =>
    ['in_progress', 'in_review', 'revisions_requested', 'complete'].includes(d.status)
  );

  const handleApprove = async (deliverableId: string) => {
    setProcessingId(deliverableId);
    try {
      const result = await clientApprove(deliverableId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error('Error approving deliverable:', error);
      alert('Failed to approve deliverable');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestRevisions = async (deliverableId: string) => {
    const comment = revisionComment[deliverableId]?.trim();
    if (!comment) {
      alert('Please provide a comment explaining what needs to be revised');
      return;
    }

    setProcessingId(deliverableId);
    try {
      const result = await clientRequestRevisions(deliverableId, comment);
      if (result.error) {
        alert(result.error);
        return;
      }
      setRevisionComment((prev) => ({ ...prev, [deliverableId]: '' }));
      setShowRevisionInput((prev) => ({ ...prev, [deliverableId]: false }));
      router.refresh();
    } catch (error) {
      console.error('Error requesting revisions:', error);
      alert('Failed to request revisions');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'in_review':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'revisions_requested':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-secondary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_review':
        return 'In Review';
      case 'revisions_requested':
        return 'Revisions Requested';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.replace('_', ' ');
    }
  };

  if (visibleDeliverables.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <FileText className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
        <h2 className="text-lg font-medium text-primary mb-2">No deliverables yet</h2>
        <p className="text-sm text-secondary">
          We'll post work here as it's completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-primary mb-1.5">Deliverables Timeline</h2>
        <p className="text-sm text-secondary">Track the progress of work being completed for you</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

        <div className="space-y-8">
          {visibleDeliverables.map((deliverable) => (
            <div key={deliverable.id} className="relative flex items-start gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border-2 border-white/20 flex-shrink-0">
                {getStatusIcon(deliverable.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 glass-panel p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-primary mb-2">{deliverable.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-1 text-xs font-medium rounded border bg-white/5 text-secondary border-white/10">
                        {deliverable.type}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded border bg-white/5 text-secondary border-white/10">
                        {getStatusLabel(deliverable.status)}
                      </span>
                      {deliverable.progress !== undefined && deliverable.progress > 0 && (
                        <span className="px-2 py-1 text-xs font-medium rounded border bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/30">
                          {deliverable.progress}% complete
                        </span>
                      )}
                      {deliverable.completed_at && (
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Delivered {new Date(deliverable.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {deliverable.description && (
                  <p className="text-sm text-secondary mb-4 leading-relaxed">{deliverable.description}</p>
                )}

                {/* Proof Links */}
                {deliverable.deliverable_assets && deliverable.deliverable_assets.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">
                      Proof Items
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {deliverable.deliverable_assets.map((asset) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {asset.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons for In Review */}
                {deliverable.status === 'in_review' && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {showRevisionInput[deliverable.id] ? (
                      <div className="space-y-2">
                        <textarea
                          value={revisionComment[deliverable.id] || ''}
                          onChange={(e) =>
                            setRevisionComment((prev) => ({
                              ...prev,
                              [deliverable.id]: e.target.value,
                            }))
                          }
                          placeholder="What needs to be revised?"
                          rows={3}
                          className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRequestRevisions(deliverable.id)}
                            disabled={processingId === deliverable.id || !revisionComment[deliverable.id]?.trim()}
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50"
                          >
                            {processingId === deliverable.id ? 'Submitting...' : 'Submit Request'}
                          </button>
                          <button
                            onClick={() => {
                              setShowRevisionInput((prev) => ({ ...prev, [deliverable.id]: false }));
                              setRevisionComment((prev) => ({ ...prev, [deliverable.id]: '' }));
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-secondary hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleApprove(deliverable.id)}
                          disabled={processingId === deliverable.id}
                          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {processingId === deliverable.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() =>
                            setShowRevisionInput((prev) => ({ ...prev, [deliverable.id]: true }))
                          }
                          disabled={processingId === deliverable.id}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50"
                        >
                          Request Changes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

