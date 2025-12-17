'use client';

import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface CsvUploadProps {
  onFileSelect: (file: File, preview: any) => void;
  preview: any;
}

export default function CsvUpload({ onFileSelect, preview }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploading(true);

    try {
      // Upload and parse CSV
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/orgs/temp/csv/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse CSV');
      }

      const result = await response.json();
      onFileSelect(selectedFile, result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    onFileSelect(null as any, null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="block">
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-[#4C8DFF]/50 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-3 text-secondary" />
            <div className="text-sm font-medium text-primary mb-1">Upload CSV File</div>
            <div className="text-xs text-secondary">Click to browse or drag and drop</div>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="p-4 rounded-lg glass-subtle border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4C8DFF]" />
              <span className="text-sm font-medium text-primary">{file.name}</span>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 rounded text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {uploading && (
            <div className="text-xs text-secondary">Parsing CSV...</div>
          )}
          {error && (
            <div className="text-xs text-red-400 mt-2">{error}</div>
          )}
        </div>
      )}

      {preview && (
        <div className="p-4 rounded-lg glass-subtle border border-white/10">
          <div className="text-sm font-medium text-primary mb-3">Extracted KPIs:</div>
          <div className="space-y-2 text-sm">
            {preview.totals && (
              <>
                <div className="flex justify-between">
                  <span className="text-secondary">Leads:</span>
                  <span className="text-primary font-medium">{preview.totals.leads?.toLocaleString() || 'Not available'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Spend:</span>
                  <span className="text-primary font-medium">
                    {preview.totals.spend !== undefined ? `$${preview.totals.spend.toLocaleString()}` : 'Not available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Revenue:</span>
                  <span className="text-primary font-medium">
                    {preview.totals.revenue !== undefined ? `$${preview.totals.revenue.toLocaleString()}` : 'Not available'}
                  </span>
                </div>
                {preview.totals.cpl && (
                  <div className="flex justify-between">
                    <span className="text-secondary">CPL:</span>
                    <span className="text-primary font-medium">${preview.totals.cpl.toLocaleString()}</span>
                  </div>
                )}
                {preview.totals.roas && (
                  <div className="flex justify-between">
                    <span className="text-secondary">ROAS:</span>
                    <span className="text-primary font-medium">{preview.totals.roas}x</span>
                  </div>
                )}
              </>
            )}
            {preview.columnMapping && Object.keys(preview.columnMapping).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs font-medium text-secondary mb-2">Column Mapping:</div>
                <div className="space-y-1 text-xs">
                  {Object.entries(preview.columnMapping).map(([normalized, original]) => (
                    <div key={normalized} className="flex justify-between">
                      <span className="text-secondary">{normalized}:</span>
                      <span className="text-primary">{original as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

