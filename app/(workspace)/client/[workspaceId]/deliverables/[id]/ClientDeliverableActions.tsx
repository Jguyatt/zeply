'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { clientApprove, clientRequestRevisions } from '@/app/actions/deliverables';

interface ClientDeliverableActionsProps {
  deliverableId: string;
}

export default function ClientDeliverableActions({ deliverableId }: ClientDeliverableActionsProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  const handleApprove = async () => {
    setProcessing(true);
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
      const result = await clientRequestRevisions(deliverableId, revisionComment.trim());
      if (result.error) {
        alert(result.error);
        return;
      }
      setRevisionComment('');
      setShowRevisionInput(false);
      router.refresh();
    } catch (error) {
      console.error('Error requesting revisions:', error);
      alert('Failed to request revisions');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-light text-primary mb-6">Your Action Required</h2>
      
      {showRevisionInput ? (
        <div className="space-y-4">
          <textarea
            value={revisionComment}
            onChange={(e) => setRevisionComment(e.target.value)}
            placeholder="What needs to be revised? Please provide specific feedback..."
            rows={5}
            className="w-full px-4 py-3 glass-subtle rounded-lg text-base text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleRequestRevisions}
              disabled={processing || !revisionComment.trim()}
              className="px-6 py-3 rounded-lg text-base font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {processing ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              onClick={() => {
                setShowRevisionInput(false);
                setRevisionComment('');
              }}
              className="px-6 py-3 rounded-lg text-base font-medium bg-white/5 text-secondary hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="px-8 py-4 rounded-lg text-base font-medium bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {processing ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRevisionInput(true)}
            disabled={processing}
            className="px-8 py-4 rounded-lg text-base font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            Request Changes
          </button>
        </div>
      )}
    </div>
  );
}
