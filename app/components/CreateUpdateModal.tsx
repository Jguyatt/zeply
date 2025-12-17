'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
}

export default function CreateUpdateModal({
  isOpen,
  onClose,
  orgId,
}: CreateUpdateModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [whatWeDid, setWhatWeDid] = useState('');
  const [results, setResults] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>('');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load deliverables when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDeliverables();
    }
  }, [isOpen, orgId]);

  const loadDeliverables = async () => {
    setLoadingDeliverables(true);
    try {
      const response = await fetch(`/api/orgs/${orgId}/deliverables`);
      if (!response.ok) {
        throw new Error('Failed to load deliverables');
      }
      const result = await response.json();
      if (result.error) {
        console.error('Error loading deliverables:', result.error);
        setDeliverables([]);
      } else {
        setDeliverables(result.data || []);
      }
    } catch (error) {
      console.error('Error loading deliverables:', error);
      setDeliverables([]);
    } finally {
      setLoadingDeliverables(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orgs/${orgId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          what_we_did: whatWeDid.trim(),
          results: results.trim() || null,
          next_steps: nextSteps.trim() || null,
          deliverable_id: selectedDeliverableId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create update');
      }

      router.refresh();
      onClose();
      // Reset form
      setTitle('');
      setWhatWeDid('');
      setResults('');
      setNextSteps('');
      setSelectedDeliverableId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setWhatWeDid('');
    setResults('');
    setNextSteps('');
    setSelectedDeliverableId('');
    setError(null);
    onClose();
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative glass-surface border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Create Update</h2>
            <p className="text-sm text-secondary mt-1">Share what your team accomplished this week</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              placeholder="e.g., Weekly Progress Update"
              required
            />
          </div>

          {/* Deliverable Selection */}
          <div>
            <label htmlFor="deliverable" className="block text-sm font-medium text-secondary mb-1">
              Related Deliverable (Optional)
            </label>
            <select
              id="deliverable"
              value={selectedDeliverableId}
              onChange={(e) => setSelectedDeliverableId(e.target.value)}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm cursor-pointer"
              disabled={loadingDeliverables}
            >
              <option value="">None - General update</option>
              {deliverables.map((deliverable) => (
                <option key={deliverable.id} value={deliverable.id}>
                  {deliverable.title} ({deliverable.type}) - {deliverable.status}
                </option>
              ))}
            </select>
            {loadingDeliverables && (
              <p className="text-xs text-secondary mt-1">Loading deliverables...</p>
            )}
          </div>

          {/* What We Did */}
          <div>
            <label htmlFor="whatWeDid" className="block text-sm font-medium text-secondary mb-1">
              What We Did *
            </label>
            <textarea
              id="whatWeDid"
              value={whatWeDid}
              onChange={(e) => setWhatWeDid(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
              placeholder="Describe what your team accomplished..."
              required
            />
          </div>

          {/* Results */}
          <div>
            <label htmlFor="results" className="block text-sm font-medium text-secondary mb-1">
              Results (Optional)
            </label>
            <textarea
              id="results"
              value={results}
              onChange={(e) => setResults(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
              placeholder="Share any results or outcomes..."
            />
          </div>

          {/* Next Steps */}
          <div>
            <label htmlFor="nextSteps" className="block text-sm font-medium text-secondary mb-1">
              Next Steps (Optional)
            </label>
            <textarea
              id="nextSteps"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
              placeholder="What's coming up next..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 glass-surface rounded-lg hover:bg-white/10 transition-all text-sm border border-white/10 text-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 flex items-center gap-2 text-sm border border-accent/30 font-medium"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Update'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

