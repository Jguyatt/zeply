'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddRoadmapItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export default function AddRoadmapItemModal({
  isOpen,
  onClose,
  orgId,
}: AddRoadmapItemModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<'this_week' | 'next_week' | 'blocker'>('this_week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orgs/${orgId}/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          timeframe,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create roadmap item');
      }

      router.refresh();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setTimeframe('this_week');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setTimeframe('this_week');
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
      <div className="relative glass-surface border border-white/10 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Add Roadmap Item</h2>
            <p className="text-sm text-secondary mt-1">Add an upcoming action or milestone</p>
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
              placeholder="e.g., Review campaign performance"
              required
            />
          </div>

          {/* Timeframe */}
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-secondary mb-1">
              Timeframe *
            </label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'this_week' | 'next_week' | 'blocker')}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              required
            >
              <option value="this_week">This Week</option>
              <option value="next_week">Next Week</option>
              <option value="blocker">Blocker</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
              placeholder="Add more details about this item..."
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
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

