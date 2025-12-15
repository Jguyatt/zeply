'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { createDeliverable } from '@/app/actions/deliverables';

interface NewDeliverableModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDeliverableModal({ orgId, onClose, onSuccess }: NewDeliverableModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Ad');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const deliverableData = {
      title,
      type,
      description: description || undefined,
      due_date: dueDate || undefined,
    };

    const result = await createDeliverable(orgId, deliverableData);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="glass-surface rounded-lg shadow-prestige-soft p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-light text-primary mb-6">Create New Deliverable</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-secondary mb-1">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10 text-sm"
              required
            >
              <option value="Ad">Ad</option>
              <option value="Creative">Creative</option>
              <option value="SEO">SEO</option>
              <option value="Web">Web</option>
              <option value="Automation">Automation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10 text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-secondary mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-prestige-soft text-sm font-medium text-accent bg-accent/20 hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Deliverable'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

