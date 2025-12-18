'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus } from 'lucide-react';
import DeliverablesSelector from './reports/DeliverablesSelector';

interface ReportSection {
  id?: string;
  section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom' | 'proof_of_work';
  title?: string;
  content: string;
  order_index: number;
}

interface ReportSectionEditorProps {
  section: ReportSection;
  onSave: (section: ReportSection) => void | Promise<void>;
  onClose: () => void;
  orgId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export default function ReportSectionEditor({
  section,
  onSave,
  onClose,
  orgId,
  periodStart,
  periodEnd,
}: ReportSectionEditorProps) {
  const [sectionType, setSectionType] = useState<ReportSection['section_type']>(section.section_type);
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [showDeliverablesSelector, setShowDeliverablesSelector] = useState(false);

  useEffect(() => {
    setSectionType(section.section_type);
    setTitle(section.title || '');
    setContent(section.content || '');
  }, [section]);

  const handleSave = () => {
    if (!content.trim()) {
      alert('Content is required');
      return;
    }

    onSave({
      ...section,
      section_type: sectionType,
      title: title.trim() || undefined,
      content: content.trim(),
    });
  };

  const getSectionTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-primary">Edit Section</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Section Type *
            </label>
            <select
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value as ReportSection['section_type'])}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
            >
              <option value="summary">Executive Summary</option>
              <option value="metrics">Metrics (Auto-filled)</option>
              <option value="insights">Insights</option>
              <option value="recommendations">Recommendations</option>
              <option value="proof_of_work">Proof of Work</option>
              <option value="next_steps">Next Period Plan</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
              placeholder={`${getSectionTypeLabel(sectionType)} section title...`}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={sectionType === 'insights' ? 20 : sectionType === 'next_steps' ? 15 : 12}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50 resize-none font-mono"
              placeholder={
                sectionType === 'insights'
                  ? `INSIGHT 1:
Observation: [What happened?]
Cause: [Why did it happen?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]`
                  : sectionType === 'next_steps'
                  ? `Action | Why | Owner | ETA | Status
[Action 1] | [Reason] | [Name] | [Date] | Planned
[Action 2] | [Reason] | [Name] | [Date] | Planned`
                  : sectionType === 'proof_of_work'
                  ? `DELIVERABLES COMPLETED:
- [Deliverable 1]
- [Deliverable 2]

CHANGES SHIPPED:
- [Change 1]
- [Change 2]`
                  : `Enter ${getSectionTypeLabel(sectionType).toLowerCase()} content...`
              }
              required
            />
            <p className="text-xs text-secondary mt-2">
              {sectionType === 'insights' 
                ? 'Use structured format: Observation, Cause, Action Taken, Expected Impact, Risk/Watch-outs'
                : sectionType === 'next_steps'
                ? 'Use table format: Action | Why | Owner | ETA | Status'
                : sectionType === 'proof_of_work'
                ? 'List deliverables completed, changes shipped, tests launched'
                : 'Use plain text or markdown formatting. Line breaks are preserved.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium glass-subtle text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Section
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

