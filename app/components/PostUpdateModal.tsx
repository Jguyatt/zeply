'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Eye, EyeOff, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostUpdateModalProps {
  deliverableId: string;
  deliverableTitle?: string;
  orgId: string;
  orgName?: string;
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
  deliverableTitle: propDeliverableTitle,
  orgId,
  orgName,
  onClose,
  onSuccess,
}: PostUpdateModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [clientVisible, setClientVisible] = useState(true); // Default to client-visible
  const [notifyClient, setNotifyClient] = useState(false);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canSubmit = () => {
    return title.trim() !== '' || note.trim() !== '';
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
      if (!canSubmit()) {
        setError('Please provide a stage and either a title or note');
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
          title: title.trim() || null,
          note: note.trim() || null,
          attachments,
          client_visible: clientVisible,
          notify_client: notifyClient && clientVisible, // Only notify if visible to client
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post update');
      }

      // Reset form
      setTitle('');
      setNote('');
      setClientVisible(true);
      setNotifyClient(false);
      setFiles([]);
      
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

          {/* Workspace indicator */}
          {orgName && (
            <div className="text-xs text-secondary flex items-center gap-1 mb-1">
              <span>Posts to:</span>
              <span className="text-primary font-medium">{orgName}</span>
            </div>
          )}

          {/* Linked Deliverable */}
          {propDeliverableTitle && (
            <div className="flex items-center gap-2 px-3 py-2 glass-subtle border border-white/10 rounded-lg mb-2">
              <FileText className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-secondary">Linked to deliverable:</p>
                <p className="text-sm text-primary font-medium truncate">{propDeliverableTitle}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Title / Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50 placeholder:text-muted"
              placeholder="e.g., GA4 connected + conversion tracking verified"
            />
            <p className="text-xs text-secondary mt-1">Brief summary of this update</p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Note {title.trim() ? '(optional)' : '*'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50 resize-none placeholder:text-muted"
              placeholder="Add details about this update..."
              required={!title.trim()}
            />
            {!title.trim() && (
              <p className="text-xs text-secondary mt-1">Required if no title is provided</p>
            )}
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
              
              {/* File Chips */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((fileWithPreview) => (
                    <div
                      key={fileWithPreview.id}
                      className="flex items-center gap-3 px-3 py-2 glass-subtle border border-white/10 rounded-lg group"
                    >
                      {fileWithPreview.preview ? (
                        <img
                          src={fileWithPreview.preview}
                          alt={fileWithPreview.file.name}
                          className="w-10 h-10 object-cover rounded border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 glass-surface border border-white/10 rounded flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-secondary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary truncate">{fileWithPreview.file.name}</p>
                        <p className="text-xs text-secondary">{formatFileSize(fileWithPreview.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(fileWithPreview.id)}
                        className="p-1.5 rounded text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Visibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setClientVisible(!clientVisible);
                  if (clientVisible) {
                    setNotifyClient(false); // Disable notify if making internal
                  }
                }}
                className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                  clientVisible ? 'bg-[#4C8DFF]' : 'bg-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  clientVisible ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {clientVisible ? (
                    <Eye className="w-4 h-4 text-[#4C8DFF]" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-secondary" />
                  )}
                  <span className="text-sm font-medium text-primary">
                    {clientVisible ? 'Visible to client' : 'Internal only'}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  {clientVisible ? 'Clients can see this update' : 'Clients won\'t see this'}
                </p>
              </div>
            </div>

            {/* Notify Client */}
            {clientVisible && (
              <div className="flex items-start gap-3 pl-14">
                <input
                  type="checkbox"
                  id="notifyClient"
                  checked={notifyClient}
                  onChange={(e) => setNotifyClient(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#4C8DFF] focus:ring-2 focus:ring-[#4C8DFF]/50 cursor-pointer"
                />
                <label htmlFor="notifyClient" className="flex-1 cursor-pointer">
                  <span className="text-sm text-primary">Email client about this update</span>
                  <p className="text-xs text-secondary mt-0.5">Send notification email</p>
                </label>
              </div>
            )}
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
            disabled={loading || uploading || !canSubmit()}
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

