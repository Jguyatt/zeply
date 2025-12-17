'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Clock, AlertCircle, ExternalLink, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
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
    client_visible?: boolean;
  }>;
  deliverable_updates?: Array<{
    id: string;
    stage: string;
    note?: string;
    created_at: string;
    client_visible: boolean;
  }>;
}

interface ClientViewDeliverableModalProps {
  deliverable: Deliverable;
  orgId: string;
  onClose: () => void;
}

export default function ClientViewDeliverableModal({
  deliverable,
  orgId,
  onClose,
}: ClientViewDeliverableModalProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  // Filter to only client-visible updates
  const clientVisibleUpdates = deliverable.deliverable_updates
    ?.filter(update => update.client_visible)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  // Filter to only client-visible assets
  const clientVisibleAssets = deliverable.deliverable_assets
    ?.filter(asset => asset.client_visible !== false) || [];

  // Only show certain statuses to clients
  const clientVisibleStatuses = ['in_progress', 'in_review', 'revisions_requested', 'complete'];
  const isClientVisible = clientVisibleStatuses.includes(deliverable.status);

  const handleApprove = async () => {
    if (deliverable.status !== 'in_review') return;
    
    setProcessing(true);
    try {
      const result = await clientApprove(deliverable.id);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error approving deliverable:', error);
      alert('Failed to approve deliverable');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevisions = async () => {
    if (!revisionComment.trim()) {
      alert('Please provide a comment explaining what needs to be revised');
      return;
    }

    setProcessing(true);
    try {
      const result = await clientRequestRevisions(deliverable.id, revisionComment.trim());
      if (result.error) {
        alert(result.error);
        return;
      }
      setRevisionComment('');
      setShowRevisionInput(false);
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error requesting revisions:', error);
      alert('Failed to request revisions');
    } finally {
      setProcessing(false);
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
    return date.toLocaleDateString();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#4C8DFF]/20 border border-[#4C8DFF]/30">
              <Eye className="w-5 h-5 text-[#4C8DFF]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Client View</h2>
              <p className="text-xs text-secondary">How this deliverable appears to your client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isClientVisible ? (
            <div className="text-center py-12">
              <EyeOff className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-primary mb-2">Not Visible to Client</h3>
              <p className="text-sm text-secondary">
                This deliverable is not currently visible to the client. Only deliverables with status "In Progress", "In Review", "Revisions Requested", or "Complete" are shown to clients.
              </p>
            </div>
          ) : (
            <>
              {/* Deliverable Info */}
              <div>
                <h3 className="text-2xl font-semibold text-primary mb-3">{deliverable.title}</h3>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="px-3 py-1 text-xs font-medium rounded border bg-white/5 text-secondary border-white/10">
                    {deliverable.type}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded border bg-white/5 text-secondary border-white/10">
                    {getStatusLabel(deliverable.status)}
                  </span>
                  {deliverable.progress !== undefined && deliverable.progress > 0 && (
                    <span className="px-3 py-1 text-xs font-medium rounded border bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/30">
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

                {deliverable.description && (
                  <p className="text-sm text-secondary leading-relaxed">{deliverable.description}</p>
                )}
              </div>

              {/* Client-Visible Updates Timeline */}
              {clientVisibleUpdates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary mb-3">Updates</h4>
                  <div className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-white/10" />
                    
                    <div className="space-y-4">
                      {clientVisibleUpdates.map((update, idx) => {
                        const isLast = idx === clientVisibleUpdates.length - 1;
                        return (
                          <div key={update.id} className="relative flex items-start gap-4">
                            {/* Timeline dot */}
                            <div className={`absolute left-0 w-3 h-3 rounded-full border-2 border-white/20 ${getStatusColor(update.stage).split(' ')[0]} -translate-x-[22px] translate-y-1`} />
                            {!isLast && (
                              <div className="absolute left-0 w-px h-full bg-white/10 -translate-x-[18px] translate-y-4" />
                            )}
                            
                            {/* Update content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-primary">{getStatusLabel(update.stage)}</span>
                                <span className="text-[10px] text-secondary/60">•</span>
                                <span className="text-[10px] text-secondary/60">{formatRelativeTime(update.created_at)}</span>
                              </div>
                              {update.note && (
                                <p className="text-xs text-secondary/80 leading-relaxed">{update.note}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Proof Items */}
              {clientVisibleAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-secondary mb-3 uppercase tracking-wider">
                    Proof Items
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {clientVisibleAssets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {asset.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for In Review */}
              {deliverable.status === 'in_review' && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {showRevisionInput ? (
                    <div className="space-y-3">
                      <textarea
                        value={revisionComment}
                        onChange={(e) => setRevisionComment(e.target.value)}
                        placeholder="What needs to be revised?"
                        rows={3}
                        className="w-full px-4 py-3 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRequestRevisions}
                          disabled={processing || !revisionComment.trim()}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50"
                        >
                          {processing ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button
                          onClick={() => {
                            setShowRevisionInput(false);
                            setRevisionComment('');
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
                        onClick={handleApprove}
                        disabled={processing}
                        className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {processing ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setShowRevisionInput(true)}
                        disabled={processing}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Helper function to get status color (matching DeliverablesList)
function getStatusColor(status: string): string {
  switch (status) {
    case 'complete':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'in_review':
      return 'bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/30';
    case 'revisions_requested':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'finishing_touches':
      return 'bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/30';
    case 'in_progress':
      return 'bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/30';
    case 'planned':
      return 'bg-white/5 text-secondary border-white/10';
    case 'blocked':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-white/5 text-secondary border-white/10';
  }
}

