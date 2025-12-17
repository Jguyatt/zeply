'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { updateChecklistItem, addChecklistItem } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  done_at?: string;
  done_by?: string;
}

interface DeliverableChecklistProps {
  deliverableId: string;
  items: ChecklistItem[];
  progress: number;
  isAdmin: boolean;
  onProgressChange?: (progress: number) => void;
}

export default function DeliverableChecklist({
  deliverableId,
  items,
  progress,
  isAdmin,
  onProgressChange,
}: DeliverableChecklistProps) {
  const router = useRouter();
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleToggleItem = async (itemId: string, currentDone: boolean) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await updateChecklistItem(itemId, !currentDone);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
      // Progress will be recalculated server-side
    } catch (error) {
      console.error('Error updating checklist item:', error);
      alert('Failed to update checklist item');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;

    setAddingItem(true);
    try {
      const result = await addChecklistItem(deliverableId, newItemTitle.trim());
      if (result.error) {
        alert(result.error);
        return;
      }
      setNewItemTitle('');
      setAddingItem(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding checklist item:', error);
      alert('Failed to add checklist item');
      setAddingItem(false);
    }
  };

  const isReadyForReview = progress >= 80;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-primary mb-1">Checklist Progress</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4C8DFF] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-secondary min-w-[3rem] text-right">
              {progress}%
            </span>
          </div>
        </div>
        {isReadyForReview && (
          <div className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
            Ready for review
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const isUpdating = updatingItems.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.is_done
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/2 border-white/5'
              }`}
            >
              <button
                onClick={() => isAdmin && handleToggleItem(item.id, item.is_done)}
                disabled={!isAdmin || isUpdating}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  item.is_done
                    ? 'bg-[#4C8DFF] border-[#4C8DFF]'
                    : 'border-white/20 hover:border-[#4C8DFF]/50'
                } ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {item.is_done && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    item.is_done ? 'text-secondary line-through' : 'text-primary'
                  }`}
                >
                  {item.title}
                </p>
                {item.is_done && item.done_at && (
                  <p className="text-xs text-muted mt-1">
                    Completed {new Date(item.done_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item (Admin only) */}
      {isAdmin && (
        <div>
          {addingItem ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-white/2">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem();
                  } else if (e.key === 'Escape') {
                    setAddingItem(false);
                    setNewItemTitle('');
                  }
                }}
                placeholder="Add checklist item..."
                className="flex-1 px-3 py-1.5 glass-subtle rounded-lg text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                autoFocus
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim()}
                className="p-1.5 rounded-lg bg-[#4C8DFF]/20 text-[#4C8DFF] hover:bg-[#4C8DFF]/30 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setAddingItem(false);
                  setNewItemTitle('');
                }}
                className="p-1.5 rounded-lg bg-white/5 text-secondary hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/2 text-sm text-secondary hover:bg-white/5 hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

