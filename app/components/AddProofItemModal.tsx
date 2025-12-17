'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Link as LinkIcon, Video, ExternalLink, Image as ImageIcon, File, Check } from 'lucide-react';
import { addProofItem } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';

interface AddProofItemModalProps {
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

export default function AddProofItemModal({
  deliverableId,
  orgId,
  onClose,
  onSuccess,
}: AddProofItemModalProps) {
  const router = useRouter();
  const [proofType, setProofType] = useState<'file' | 'link' | 'loom' | 'gdrive'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [isRequiredProof, setIsRequiredProof] = useState(false);
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
    formData.append('proofType', proofType === 'file' ? 'file' : proofType);
    formData.append('isRequiredProof', isRequiredProof.toString());

    const response = await fetch(`/api/orgs/${orgId}/deliverables/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to upload file' };
    }

    const result = await response.json();
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (proofType === 'file') {
        // Upload files
        if (files.length === 0) {
          setError('Please select at least one file');
          setLoading(false);
          return;
        }

        setUploading(true);
        const uploadPromises = files.map(fileWithPreview => uploadFile(fileWithPreview));
        const results = await Promise.all(uploadPromises);
        
        // Check for any errors in upload results
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          throw new Error(errors[0].error || 'Failed to upload files');
        }

        // Clean up preview URLs
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      } else {
        // Add link
        if (!linkUrl.trim() || !linkName.trim()) {
          setError('Please provide both name and URL for the link');
          setLoading(false);
          return;
        }

        // Determine kind based on URL
        let kind: 'link' | 'loom' | 'gdrive' = 'link';
        if (linkUrl.includes('loom.com')) {
          kind = 'loom';
        } else if (linkUrl.includes('drive.google.com') || linkUrl.includes('docs.google.com')) {
          kind = 'gdrive';
        }

        const result = await addProofItem(deliverableId, {
          name: linkName.trim(),
          url: linkUrl.trim(),
          kind,
          proof_type: kind === 'loom' ? 'loom' : kind === 'gdrive' ? 'gdrive' : 'url',
          is_required_proof: isRequiredProof,
        });

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="glass-panel p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium text-primary mb-6">Add Proof Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Proof Type Selector */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Proof Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'file', label: 'File/Screenshot', icon: Upload },
                { value: 'link', label: 'Link', icon: LinkIcon },
                { value: 'loom', label: 'Loom Video', icon: Video },
                { value: 'gdrive', label: 'Google Drive', icon: ExternalLink },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProofType(option.value as any)}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      proofType === option.value
                        ? 'border-[#4C8DFF] bg-[#4C8DFF]/10 text-[#4C8DFF]'
                        : 'border-white/10 bg-white/2 text-secondary hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          {proofType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Files
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 glass-surface rounded-lg text-primary hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm border border-white/10"
              >
                <Upload className="w-4 h-4" />
                Select Files
              </button>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((fileWithPreview) => (
                    <div
                      key={fileWithPreview.id}
                      className="flex items-center gap-3 p-2 glass-subtle rounded-lg"
                    >
                      {fileWithPreview.preview ? (
                        <img
                          src={fileWithPreview.preview}
                          alt={fileWithPreview.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 glass-surface rounded flex items-center justify-center">
                          <File className="w-5 h-5 text-secondary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary truncate">{fileWithPreview.file.name}</p>
                        <p className="text-xs text-secondary">
                          {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(fileWithPreview.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-secondary hover:text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link Input */}
          {proofType !== 'file' && (
            <>
              <div>
                <label htmlFor="linkName" className="block text-sm font-medium text-secondary mb-1">
                  Link Name
                </label>
                <input
                  type="text"
                  id="linkName"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder={proofType === 'loom' ? 'e.g., Product Demo Video' : proofType === 'gdrive' ? 'e.g., Design Files' : 'e.g., Figma Design'}
                  className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                  required
                />
              </div>
              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium text-secondary mb-1">
                  URL
                </label>
                <input
                  type="url"
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder={proofType === 'loom' ? 'https://loom.com/share/...' : proofType === 'gdrive' ? 'https://drive.google.com/...' : 'https://...'}
                  className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                  required
                />
              </div>
            </>
          )}

          {/* Required Proof Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/2">
            <input
              type="checkbox"
              id="isRequiredProof"
              checked={isRequiredProof}
              onChange={(e) => setIsRequiredProof(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-[#4C8DFF] focus:ring-[#4C8DFF]/30"
            />
            <label htmlFor="isRequiredProof" className="text-sm text-primary cursor-pointer">
              Mark as required proof
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-secondary hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || (proofType === 'file' && files.length === 0) || (proofType !== 'file' && (!linkUrl.trim() || !linkName.trim()))}
              className="btn-primary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? 'Uploading...' : loading ? 'Adding...' : 'Add Proof Item'}
              {!loading && !uploading && <Check className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

