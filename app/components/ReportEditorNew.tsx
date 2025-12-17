'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, RotateCcw, Eye, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getReport, updateReportBlock } from '@/app/actions/reports';

interface ReportBlock {
  id: string;
  block_type: string;
  title?: string;
  content: string;
  order_index: number;
  is_auto_generated: boolean;
}

interface Report {
  id: string;
  title: string;
  period_start?: string;
  period_end?: string;
  status: 'draft' | 'published';
  tier?: 'auto' | 'kpi' | 'csv';
  version?: number;
  previous_version_id?: string;
  report_sections?: ReportBlock[];
}

interface ReportEditorProps {
  reportId: string;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportEditorNew({
  reportId,
  orgId,
  onClose,
  onSuccess,
}: ReportEditorProps) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [blocks, setBlocks] = useState<ReportBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getReport(reportId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReport(result.data);
      setBlocks(result.data.report_sections || []);
      if (result.data.report_sections && result.data.report_sections.length > 0) {
        setSelectedBlockId(result.data.report_sections[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockContentChange = async (blockId: string, content: string) => {
    if (!report || report.status === 'published') return;

    // Optimistically update
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b));

    // Save to server
    try {
      const result = await updateReportBlock(reportId, blockId, content);
      if (result.error) {
        setError(result.error);
        // Revert on error
        loadReport();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
      loadReport();
    }
  };

  const handlePublish = async () => {
    if (!report) return;

    setPublishing(true);
    try {
      const response = await fetch(`/api/orgs/${orgId}/reports/${reportId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to publish report');
      }

      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish report');
    } finally {
      setPublishing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!report) return;

    setRegenerating(true);
    try {
      const response = await fetch(`/api/orgs/${orgId}/reports/${reportId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to regenerate report');
      }

      const result = await response.json();
      // Navigate to new report version
      router.push(`/${orgId}/reports?edit=${result.data.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate report');
    } finally {
      setRegenerating(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  if (typeof window === 'undefined') return null;

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="text-primary">Loading report...</div>
      </div>,
      document.body
    );
  }

  if (!report) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="text-red-400">Report not found</div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Sidebar */}
      <div className="w-64 glass-panel border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-primary">Blocks</h2>
            <button
              onClick={onClose}
              className="p-1 rounded text-secondary hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {report.version && report.version > 1 && (
            <div className="text-xs text-secondary mb-2">
              Version {report.version}
            </div>
          )}
          {report.previous_version_id && (
            <a
              href={`/${orgId}/reports?view=${report.previous_version_id}`}
              className="text-xs text-accent hover:text-accent/80 flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              View previous version
            </a>
          )}
        </div>

        {/* Blocks List */}
        <div className="flex-1 overflow-y-auto p-2">
          {blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                selectedBlockId === block.id
                  ? 'bg-accent/20 border border-accent/30'
                  : 'glass-subtle border border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary capitalize">
                  {block.block_type.replace('_', ' ')}
                </span>
                {block.is_auto_generated && (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-white/10 text-secondary border border-white/10">
                    Auto
                  </span>
                )}
              </div>
              {block.title && (
                <div className="text-xs text-secondary">{block.title}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-primary">{report.title}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
              {report.period_start && report.period_end && (
                <span>
                  {new Date(report.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(report.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {report.tier && (
                <span className="capitalize">{report.tier}</span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded ${
                report.status === 'published'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {report.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.status === 'draft' && (
              <>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-3 py-2 text-sm font-medium rounded-lg glass-subtle text-secondary hover:text-primary transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-2 text-sm font-medium rounded-lg btn-primary disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </>
            )}
            {report.status === 'published' && (
              <button
                onClick={() => {
                  router.push(`/${orgId}/reports?view=${reportId}`);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg glass-subtle text-primary hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {selectedBlock ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary mb-1">
                  {selectedBlock.title || selectedBlock.block_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                {selectedBlock.is_auto_generated && (
                  <p className="text-xs text-secondary">
                    This block was auto-generated. You can edit it, but regenerating will overwrite your changes.
                  </p>
                )}
              </div>
              <textarea
                value={selectedBlock.content}
                onChange={(e) => handleBlockContentChange(selectedBlock.id, e.target.value)}
                disabled={report.status === 'published'}
                rows={20}
                className="w-full px-4 py-3 glass-subtle border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Block content..."
              />
            </div>
          ) : (
            <div className="text-center py-12 text-secondary">
              Select a block from the sidebar to edit
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

