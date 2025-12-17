'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Search } from 'lucide-react';
import { getCompletedDeliverablesForPeriod } from '@/app/actions/reports';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  completed_at?: string;
  updated_at?: string;
  client_visible: boolean;
}

interface DeliverablesSelectorProps {
  orgId: string;
  periodStart?: string;
  periodEnd?: string;
  selectedIds?: string[];
  onSelect: (deliverableIds: string[]) => void;
  onClose: () => void;
}

export default function DeliverablesSelector({
  orgId,
  periodStart,
  periodEnd,
  selectedIds = [],
  onSelect,
  onClose,
}: DeliverablesSelectorProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [filteredDeliverables, setFilteredDeliverables] = useState<Deliverable[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (periodStart && periodEnd) {
      loadDeliverables();
    } else {
      setLoading(false);
    }
  }, [orgId, periodStart, periodEnd]);

  useEffect(() => {
    filterDeliverables();
  }, [deliverables, searchQuery, filterType]);

  const loadDeliverables = async () => {
    if (!periodStart || !periodEnd) return;

    setLoading(true);
    try {
      const result = await getCompletedDeliverablesForPeriod(orgId, periodStart, periodEnd);
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
      setLoading(false);
    }
  };

  const filterDeliverables = () => {
    let filtered = deliverables;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((d) => d.type === filterType);
    }

    setFilteredDeliverables(filtered);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredDeliverables.map((d) => d.id));
    setSelected(allIds);
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  const getUniqueTypes = () => {
    const types = new Set(deliverables.map((d) => d.type));
    return Array.from(types).sort();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Add Deliverables</h2>
            <p className="text-sm text-secondary mt-1">
              Select deliverables completed in this period
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables..."
                className="w-full pl-10 pr-4 py-2 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterType === 'all'
                    ? 'bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30'
                    : 'glass-subtle text-secondary hover:text-primary'
                }`}
              >
                All
              </button>
              {getUniqueTypes().map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterType === type
                      ? 'bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30'
                      : 'glass-subtle text-secondary hover:text-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Deliverables List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-sm text-secondary">Loading deliverables...</p>
              </div>
            ) : filteredDeliverables.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-secondary">
                  {deliverables.length === 0
                    ? 'No completed deliverables found in this period'
                    : 'No deliverables match your search'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-secondary">
                    {selected.size} of {filteredDeliverables.length} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-[#4C8DFF] hover:text-[#4C8DFF]/80"
                    >
                      Select All
                    </button>
                    <span className="text-secondary">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-xs text-[#4C8DFF] hover:text-[#4C8DFF]/80"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredDeliverables.map((deliverable) => (
                    <label
                      key={deliverable.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected.has(deliverable.id)
                          ? 'bg-[#4C8DFF]/10 border-[#4C8DFF]/30'
                          : 'glass-subtle border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(deliverable.id)}
                        onChange={() => toggleSelect(deliverable.id)}
                        className="mt-1 w-4 h-4 rounded border-white/20 text-[#4C8DFF] focus:ring-[#4C8DFF]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary">
                            {deliverable.title}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/10 text-secondary border border-white/10">
                            {deliverable.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-secondary">
                          <span>Completed: {formatDate(deliverable.completed_at || deliverable.updated_at)}</span>
                          {deliverable.status === 'approved' && (
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium glass-subtle text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Add {selected.size > 0 ? `${selected.size} ` : ''}Deliverable{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

