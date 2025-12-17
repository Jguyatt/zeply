'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, TrendingUp, Upload, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import KpiForm from './reports/KpiForm';
import CsvUpload from './reports/CsvUpload';

interface GenerateReportModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateReportModal({
  orgId,
  onClose,
  onSuccess,
}: GenerateReportModalProps) {
  const router = useRouter();
  const [tier, setTier] = useState<'auto' | 'kpi' | 'csv'>('auto');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState({
    leads: 0,
    spend: undefined as number | undefined,
    revenue: undefined as number | undefined,
    notes: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) {
      setError('Please select a period');
      return;
    }

    if (tier === 'kpi' && kpiData.leads === undefined) {
      setError('Leads is required for KPI reports');
      return;
    }

    if (tier === 'csv' && !csvFile) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (tier === 'auto') {
        response = await fetch(`/api/orgs/${orgId}/reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'auto',
            periodStart,
            periodEnd,
          }),
        });
      } else if (tier === 'kpi') {
        response = await fetch(`/api/orgs/${orgId}/reports/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'kpi',
            periodStart,
            periodEnd,
            kpiData: {
              leads: kpiData.leads,
              spend: kpiData.spend,
              revenue: kpiData.revenue,
              notes: kpiData.notes,
            },
          }),
        });
      } else if (tier === 'csv') {
        const formData = new FormData();
        formData.append('file', csvFile!);
        formData.append('periodStart', periodStart);
        formData.append('periodEnd', periodEnd);

        response = await fetch(`/api/orgs/${orgId}/reports/generate`, {
          method: 'POST',
          body: formData,
        });
      }

      const result = await response?.json();

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success - close modal and refresh
      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setLoading(false);
    }
  };

  const handleCsvPreview = async (file: File, preview: any) => {
    setCsvFile(file);
    setCsvPreview(preview);
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
          <div>
            <h2 className="text-xl font-semibold text-primary">Generate Report</h2>
            <p className="text-sm text-secondary mt-1">Choose generation method</p>
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
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Generation Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTier('auto')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  tier === 'auto'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 glass-subtle hover:bg-white/5'
                }`}
              >
                <Sparkles className={`w-5 h-5 mb-2 ${tier === 'auto' ? 'text-accent' : 'text-text-secondary'}`} />
                <div className="text-sm font-medium text-primary">Auto</div>
                <div className="text-xs text-secondary mt-1">From existing data</div>
              </button>
              <button
                onClick={() => setTier('kpi')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  tier === 'kpi'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 glass-subtle hover:bg-white/5'
                }`}
              >
                <TrendingUp className={`w-5 h-5 mb-2 ${tier === 'kpi' ? 'text-accent' : 'text-text-secondary'}`} />
                <div className="text-sm font-medium text-primary">KPI Check-in</div>
                <div className="text-xs text-secondary mt-1">Manual input</div>
              </button>
              <button
                onClick={() => setTier('csv')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  tier === 'csv'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 glass-subtle hover:bg-white/5'
                }`}
              >
                <Upload className={`w-5 h-5 mb-2 ${tier === 'csv' ? 'text-accent' : 'text-text-secondary'}`} />
                <div className="text-sm font-medium text-primary">CSV Upload</div>
                <div className="text-xs text-secondary mt-1">Parse & aggregate</div>
              </button>
            </div>
          </div>

          {/* Period Picker */}
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
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
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
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Conditional Forms */}
          {tier === 'kpi' && (
            <KpiForm
              data={kpiData}
              onChange={setKpiData}
            />
          )}

          {tier === 'csv' && (
            <CsvUpload
              onFileSelect={handleCsvPreview}
              preview={csvPreview}
            />
          )}
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
            onClick={handleGenerate}
            disabled={loading || !periodStart || !periodEnd}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

