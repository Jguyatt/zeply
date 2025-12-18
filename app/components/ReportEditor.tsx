'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, GripVertical, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createReport, updateReport, createReportSection, updateReportSection, deleteReportSection, getCompletedDeliverablesForPeriod } from '@/app/actions/reports';
import ReportSectionEditor from './ReportSectionEditor';
import DeliverablesSelector from './reports/DeliverablesSelector';

interface ReportSection {
  id?: string;
  section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom' | 'proof_of_work';
  title?: string;
  content: string;
  order_index: number;
}

interface Report {
  id: string;
  title: string;
  summary?: string;
  period_start?: string;
  period_end?: string;
  status: 'draft' | 'published';
  client_visible: boolean;
  report_sections?: ReportSection[];
}

interface ReportEditorProps {
  report?: Report | null;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialSections?: Array<{
    section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom' | 'proof_of_work';
    title?: string;
    content: string;
  }>;
}

export default function ReportEditor({ report, orgId, onClose, onSuccess, initialSections }: ReportEditorProps) {
  const router = useRouter();
  const isEditing = !!report;
  
  const [title, setTitle] = useState(report?.title || '');
  const [summary, setSummary] = useState(report?.summary || '');
  const [periodStart, setPeriodStart] = useState(
    report?.period_start ? report.period_start.split('T')[0] : ''
  );
  const [periodEnd, setPeriodEnd] = useState(
    report?.period_end ? report.period_end.split('T')[0] : ''
  );
  const [clientVisible, setClientVisible] = useState(report?.client_visible ?? true);
  const [sections, setSections] = useState<ReportSection[]>(
    report?.report_sections || initialSections?.map((s, idx) => ({
      ...s,
      order_index: idx,
    })) || []
  );
  const [editingSection, setEditingSection] = useState<ReportSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeliverablesSelector, setShowDeliverablesSelector] = useState(false);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);

  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setSummary(report.summary || '');
      setPeriodStart(report.period_start ? report.period_start.split('T')[0] : '');
      setPeriodEnd(report.period_end ? report.period_end.split('T')[0] : '');
      setClientVisible(report.client_visible);
      setSections(report.report_sections || []);
    }
  }, [report]);

  // Auto-fetch deliverables when period changes (only for new reports)
  useEffect(() => {
    if (periodStart && periodEnd && !isEditing && sections.length === 0) {
      autoPopulateDeliverables();
    }
  }, [periodStart, periodEnd]);

  const autoPopulateDeliverables = async () => {
    if (!periodStart || !periodEnd) return;

    setDeliverablesLoading(true);
    try {
      const result = await getCompletedDeliverablesForPeriod(
        orgId,
        `${periodStart}T00:00:00.000Z`,
        `${periodEnd}T23:59:59.999Z`
      );

      if (result.error || !result.data || result.data.length === 0) {
        setDeliverablesLoading(false);
        return;
      }

      // Create Proof of Work section with auto-populated deliverables
      const formattedContent = formatDeliverablesForProofOfWork(result.data);
      const newSection: ReportSection = {
        section_type: 'proof_of_work',
        title: 'Proof of Work',
        content: formattedContent,
        order_index: sections.length,
      };
      setSections([newSection]);
    } catch (error) {
      console.error('Error auto-populating deliverables:', error);
    } finally {
      setDeliverablesLoading(false);
    }
  };

  const formatDeliverablesForProofOfWork = (deliverables: any[]): string => {
    const formatted = deliverables.map((d) => {
      const date = d.completed_at || d.updated_at;
      const dateStr = date
        ? new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';
      return `- ${d.title} (${d.type}) - Completed ${dateStr} | [View Deliverable](/projects?deliverable=${d.id})`;
    });

    return `DELIVERABLES COMPLETED:
${formatted.join('\n')}

CHANGES SHIPPED:
[Auto-populated from deliverable updates/activity log]

TESTS LAUNCHED:
[Optional manual entry]`;
  };

  const handleAddDeliverables = async (deliverableIds: string[]) => {
    if (deliverableIds.length === 0) return;

    try {
      const result = await getCompletedDeliverablesForPeriod(
        orgId,
        periodStart ? `${periodStart}T00:00:00.000Z` : '',
        periodEnd ? `${periodEnd}T23:59:59.999Z` : ''
      );

      if (result.error || !result.data) return;

      const selectedDeliverables = result.data.filter((d: any) =>
        deliverableIds.includes(d.id)
      );

      // Find or create Proof of Work section
      let proofOfWorkSection = sections.find(
        (s) => s.section_type === 'proof_of_work'
      );

      if (proofOfWorkSection) {
        // Append to existing content
        const existingContent = proofOfWorkSection.content;
        const newItems = selectedDeliverables.map((d: any) => {
          const date = d.completed_at || d.updated_at;
          const dateStr = date
            ? new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A';
          return `- ${d.title} (${d.type}) - Completed ${dateStr} | [View Deliverable](/projects?deliverable=${d.id})`;
        });

        // Check if DELIVERABLES COMPLETED section exists
        if (existingContent.includes('DELIVERABLES COMPLETED:')) {
          // Append to existing list
          const updatedContent = existingContent.replace(
            /(DELIVERABLES COMPLETED:[\s\S]*?)(?=CHANGES SHIPPED:|TESTS LAUNCHED:|$)/,
            (match, p1) => {
              return p1 + '\n' + newItems.join('\n');
            }
          );
          const updatedSections = sections.map((s) =>
            s.id === proofOfWorkSection!.id
              ? { ...s, content: updatedContent }
              : s
          );
          setSections(updatedSections);
        } else {
          // Add new DELIVERABLES COMPLETED section
          const updatedContent = `DELIVERABLES COMPLETED:\n${newItems.join('\n')}\n\n${existingContent}`;
          const updatedSections = sections.map((s) =>
            s.id === proofOfWorkSection!.id
              ? { ...s, content: updatedContent }
              : s
          );
          setSections(updatedSections);
        }
      } else {
        // Create new Proof of Work section
        const formattedContent = formatDeliverablesForProofOfWork(selectedDeliverables);
        const newSection: ReportSection = {
          section_type: 'proof_of_work',
          title: 'Proof of Work',
          content: formattedContent,
          order_index: sections.length,
        };
        setSections([...sections, newSection]);
      }
    } catch (error) {
      console.error('Error adding deliverables:', error);
    }
  };

  const handleAddSection = () => {
    const newSection: ReportSection = {
      section_type: 'summary',
      content: '',
      order_index: sections.length,
    };
    setEditingSection(newSection);
  };

  const handleEditSection = (section: ReportSection) => {
    setEditingSection({ ...section });
  };

  const handleSaveSection = async (section: ReportSection) => {
    if (!report?.id) {
      // If creating new report, just add to local state
      const updatedSections = editingSection?.id
        ? sections.map(s => s.id === editingSection.id ? section : s)
        : [...sections, { ...section, order_index: sections.length }];
      setSections(updatedSections);
      setEditingSection(null);
      return;
    }

    // Save section to database
    try {
      if (editingSection?.id) {
        const result = await updateReportSection(editingSection.id, {
          title: section.title,
          content: section.content,
          order_index: section.order_index,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createReportSection(report.id, {
          section_type: section.section_type as any,
          title: section.title,
          content: section.content,
          order_index: section.order_index,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      
      // Update local state
      const updatedSections = editingSection?.id
        ? sections.map(s => s.id === editingSection.id ? section : s)
        : [...sections, { ...section, order_index: sections.length }];
      setSections(updatedSections);
      setEditingSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId: string | undefined, index?: number) => {
    // If no ID, it's a new section - delete by index
    if (!sectionId) {
      if (index !== undefined) {
        setSections(sections.filter((_, i) => i !== index));
      }
      return;
    }

    // If report doesn't exist yet, just remove from local state
    if (!report?.id) {
      setSections(sections.filter(s => s.id !== sectionId));
      return;
    }

    // Delete from database
    try {
      const result = await deleteReportSection(sectionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updatedSections = [...sections];
    [updatedSections[index], updatedSections[newIndex]] = [
      updatedSections[newIndex],
      updatedSections[index],
    ];
    updatedSections[index].order_index = index;
    updatedSections[newIndex].order_index = newIndex;
    setSections(updatedSections);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let reportId = report?.id;

      // Create or update report
      if (isEditing && reportId) {
        const result = await updateReport(reportId, {
          title: title.trim(),
          summary: summary.trim() || undefined,
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          status: publish ? 'published' : 'draft',
          client_visible: clientVisible,
        });

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        reportId = result.data?.id || reportId;
      } else {
        const result = await createReport(orgId, {
          title: title.trim(),
          summary: summary.trim() || undefined,
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          status: publish ? 'published' : 'draft',
          client_visible: clientVisible,
        });

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        reportId = result.data?.id;
      }

      // Save sections if report was just created
      if (!isEditing && reportId) {
        for (const section of sections) {
          await createReportSection(reportId, {
            section_type: section.section_type as any,
            title: section.title,
            content: section.content,
            order_index: section.order_index,
          });
        }
      }

      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
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
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-primary">
            {isEditing ? 'Edit Report' : 'Create New Report'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
                placeholder="e.g., Monthly Performance Report - January 2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Period Start
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Period End
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="clientVisible"
                checked={clientVisible}
                onChange={(e) => setClientVisible(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-[#4C8DFF] focus:ring-[#4C8DFF]"
              />
              <label htmlFor="clientVisible" className="text-sm text-primary flex items-center gap-2">
                {clientVisible ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-secondary" />}
                Visible to client when published
              </label>
            </div>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary">
                Report Sections
              </label>
              <button
                onClick={handleAddSection}
                className="px-3 py-1.5 text-xs font-medium rounded-lg glass-subtle text-primary hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="p-8 text-center glass-subtle rounded-lg border border-white/10">
                <p className="text-sm text-secondary mb-3">No sections yet</p>
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 text-sm font-medium rounded-lg btn-primary"
                >
                  Add First Section
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.id || index}
                    className="glass-subtle border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 pt-1">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveSection(index, 'up')}
                            className="p-1 rounded text-secondary hover:text-primary hover:bg-white/10"
                          >
                            <GripVertical className="w-4 h-4 rotate-90" />
                          </button>
                        )}
                        {index < sections.length - 1 && (
                          <button
                            onClick={() => handleMoveSection(index, 'down')}
                            className="p-1 rounded text-secondary hover:text-primary hover:bg-white/10"
                          >
                            <GripVertical className="w-4 h-4 -rotate-90" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30 capitalize">
                            {section.section_type.replace('_', ' ')}
                          </span>
                          {section.title && (
                            <span className="text-sm font-medium text-primary">{section.title}</span>
                          )}
                          {section.section_type === 'proof_of_work' && periodStart && periodEnd && (
                            <button
                              onClick={() => setShowDeliverablesSelector(true)}
                              className="ml-auto px-2 py-1 text-xs font-medium rounded-lg glass-subtle text-[#4C8DFF] hover:bg-[#4C8DFF]/10 transition-colors"
                            >
                              + Add More
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-secondary line-clamp-2">
                          {section.content || 'No content'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSection(section)}
                          className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-white/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id, index)}
                          className="p-2 rounded-lg text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={loading || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium glass-subtle text-primary hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Section Editor Modal */}
      {editingSection && (
        <ReportSectionEditor
          section={editingSection}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
          orgId={orgId}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      )}

      {/* Deliverables Selector Modal */}
      {showDeliverablesSelector && periodStart && periodEnd && (
        <DeliverablesSelector
          orgId={orgId}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onSelect={handleAddDeliverables}
          onClose={() => setShowDeliverablesSelector(false)}
        />
      )}
    </div>,
    document.body
  );
}

