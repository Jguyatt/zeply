'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostUpdateModalProps {
  deliverableId: string;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export default function PostUpdateModal({
  deliverableId,
  orgId,
  onClose,
  onSuccess,
}: PostUpdateModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<string>('');
  const [note, setNote] = useState('');
  const [clientVisible, setClientVisible] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileWithPreview[] = selectedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFile = async (fileWithPreview: FileWithPreview) => {
    const formData = new FormData();
    formData.append('file', fileWithPreview.file);
    formData.append('deliverableId', deliverableId);
    formData.append('proofType', 'screenshot');
    formData.append('isRequiredProof', 'false');

    const response = await fetch(`/api/orgs/${orgId}/deliverables/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    const result = await response.json();
    return {
      file_url: result.url,
      file_name: fileWithPreview.file.name,
      type: fileWithPreview.file.type.startsWith('image/') ? 'image' : 'file',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!stage.trim()) {
        setError('Please select a stage');
        setLoading(false);
        return;
      }

      let attachments: any[] = [];

      // Upload files if any
      if (files.length > 0) {
        setUploading(true);
        const uploadPromises = files.map(fileWithPreview => uploadFile(fileWithPreview));
        const results = await Promise.all(uploadPromises);
        attachments = results;
        
        // Clean up preview URLs
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      }

      // Create update
      const response = await fetch(`/api/orgs/${orgId}/deliverables/${deliverableId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage,
          note: note.trim() || null,
          attachments,
          client_visible: clientVisible,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post update');
      }

      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setUploading(false);
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
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-primary">Post Update</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
              required
            >
              <option value="">Select stage...</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50 resize-none"
              placeholder="Add a note about this update..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Attachments (optional)
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 glass-subtle border border-white/10 rounded-lg text-secondary hover:text-primary hover:border-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Add Files or Screenshots
              </button>
              
              {/* File Previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {files.map((fileWithPreview) => (
                    <div key={fileWithPreview.id} className="relative group">
                      {fileWithPreview.preview ? (
                        <img
                          src={fileWithPreview.preview}
                          alt={fileWithPreview.file.name}
                          className="w-full h-20 object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-full h-20 glass-subtle border border-white/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-secondary" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(fileWithPreview.id)}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Visibility */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setClientVisible(!clientVisible)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                clientVisible ? 'bg-[#4C8DFF]' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                clientVisible ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
            <div className="flex items-center gap-2">
              {clientVisible ? (
                <Eye className="w-4 h-4 text-[#4C8DFF]" />
              ) : (
                <EyeOff className="w-4 h-4 text-secondary" />
              )}
              <span className="text-sm text-secondary">
                {clientVisible ? 'Visible to client' : 'Internal only'}
              </span>
            </div>
          </div>
        </form>

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
            type="submit"
            onClick={handleSubmit}
            disabled={loading || uploading || !stage}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : loading ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

