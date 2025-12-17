'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Upload, FileText, Image as ImageIcon, XCircle, Calendar, Eye, EyeOff, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateDeliverable, removeProofItem } from '@/app/actions/deliverables';
import { getOrgMembers, OrgMember } from '@/app/lib/getOrgMembers';

interface EditDeliverableModalProps {
  deliverable: {
    id: string;
    title: string;
    type: string;
    status?: string;
    description?: string;
    due_date?: string;
    assigned_to?: string;
    client_visible?: boolean;
    deliverable_assets?: Array<{
      id: string;
      name: string;
      url: string;
      kind: string;
      proof_type?: string;
    }>;
    deliverable_updates?: Array<{
      id: string;
      stage: string;
      note?: string;
      created_at: string;
      client_visible: boolean;
    }>;
  };
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export default function EditDeliverableModal({
  deliverable,
  orgId,
  onClose,
  onSuccess,
}: EditDeliverableModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deliverable.title);
  const [type, setType] = useState(deliverable.type);
  const [status, setStatus] = useState(deliverable.status || 'planned');
  const [assignedTo, setAssignedTo] = useState(deliverable.assigned_to || '');
  const [description, setDescription] = useState(deliverable.description || '');
  const [dueDate, setDueDate] = useState(deliverable.due_date ? deliverable.due_date.split('T')[0] : '');
  const [noDueDate, setNoDueDate] = useState(!deliverable.due_date);
  const [clientVisible, setClientVisible] = useState(deliverable.client_visible !== false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [existingAssets, setExistingAssets] = useState(deliverable.deliverable_assets || []);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update-related state
  const [updates, setUpdates] = useState<Array<{
    id: string;
    stage: string;
    note?: string;
    created_at: string;
    client_visible: boolean;
  }>>(deliverable.deliverable_updates || []);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updateStage, setUpdateStage] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateClientVisible, setUpdateClientVisible] = useState(false);
  const [updateFiles, setUpdateFiles] = useState<FileWithPreview[]>([]);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(deliverable.title);
    setType(deliverable.type);
    setStatus(deliverable.status || 'planned');
    setAssignedTo(deliverable.assigned_to || '');
    setDescription(deliverable.description || '');
    setDueDate(deliverable.due_date ? deliverable.due_date.split('T')[0] : '');
    setNoDueDate(!deliverable.due_date);
    setClientVisible(deliverable.client_visible !== false);
    setExistingAssets(deliverable.deliverable_assets || []);
    setUpdates(deliverable.deliverable_updates || []);
  }, [deliverable]);

  // Load org members for assignee dropdown (only admins/owners)
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch(`/api/orgs/${orgId}/members`);
        if (response.ok) {
          const data = await response.json();
          // API already filters to admins/owners only
          setMembers(data.data || []);
        }
      } catch (err) {
        console.error('Error loading members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [orgId]);

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

  const removeExistingAsset = async (assetId: string) => {
    try {
      const result = await removeProofItem(assetId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setExistingAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove asset');
    }
  };

  const handleUpdateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileWithPreview[] = selectedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUpdateFiles(prev => [...prev, ...newFiles]);
  };

  const removeUpdateFile = (id: string) => {
    setUpdateFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadUpdateFile = async (fileWithPreview: FileWithPreview) => {
    const formData = new FormData();
    formData.append('file', fileWithPreview.file);
    formData.append('deliverableId', deliverable.id);
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
      file_url: result.data.url,
      file_name: result.data.name,
      type: fileWithPreview.file.type.startsWith('image/') ? 'image' : 'file',
    };
  };

  const handlePostUpdate = async () => {
    if (!updateStage.trim()) {
      setError('Please select a stage');
      return;
    }

    setPostingUpdate(true);
    setError(null);

    try {
      let attachments: any[] = [];

      // Upload files if any
      if (updateFiles.length > 0) {
        const uploadPromises = updateFiles.map(fileWithPreview => uploadUpdateFile(fileWithPreview));
        const results = await Promise.all(uploadPromises);
        attachments = results;
        
        // Clean up preview URLs
        updateFiles.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      }

      // Create update
      const response = await fetch(`/api/orgs/${orgId}/deliverables/${deliverable.id}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: updateStage,
          note: updateNote.trim() || null,
          attachments,
          client_visible: updateClientVisible,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post update');
      }

      const newUpdate = await response.json();
      setUpdates(prev => [...prev, newUpdate.data]);
      
      // Reset form
      setUpdateStage('');
      setUpdateNote('');
      setUpdateClientVisible(false);
      setUpdateFiles([]);
      setShowAddUpdate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
  };

  const uploadFiles = async (deliverableId: string) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(async (fileWithPreview) => {
      const formData = new FormData();
      formData.append('file', fileWithPreview.file);
      formData.append('deliverableId', deliverableId);

      const response = await fetch(`/api/orgs/${orgId}/deliverables/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      return response.json();
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await updateDeliverable(deliverable.id, {
        title: title.trim(),
        type: type.trim(),
        status: status,
        assigned_to: assignedTo || null,
        description: description.trim() || null,
        due_date: noDueDate ? null : (dueDate || null),
        client_visible: clientVisible,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Upload files if any
      if (files.length > 0) {
        try {
          await uploadFiles(deliverable.id);
        } catch (uploadError) {
          setError(`Deliverable updated but file upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      // Clean up preview URLs
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

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
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-primary">Edit Deliverable</h2>
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Type *
            </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                required
              >
                <option value="SEO" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>SEO</option>
                <option value="Ads" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Ads</option>
                <option value="Creative" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Creative</option>
                <option value="Dev" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Dev</option>
                <option value="Automation" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Automation</option>
                <option value="Report" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Report</option>
                <option value="Other" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Other</option>
              </select>
          </div>

          {/* Status and Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <option value="planned" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Planned</option>
                <option value="in_progress" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>In Progress</option>
                <option value="in_review" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>In Review</option>
                <option value="approved" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Approved</option>
                <option value="complete" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Assignee (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                disabled={loadingMembers}
              >
                <option value="" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id} style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Due Date (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setNoDueDate(false);
                    }}
                    disabled={noDueDate}
                    className="w-full pl-10 pr-3 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noDueDate}
                    onChange={(e) => {
                      setNoDueDate(e.target.checked);
                      if (e.target.checked) {
                        setDueDate('');
                      }
                    }}
                    className="w-4 h-4 rounded border-white/20 text-accent focus:ring-accent"
                  />
                  <span>No due date</span>
                </label>
              </div>
            </div>
          </div>

          {/* Client Visible Toggle */}
          <div className="flex items-center gap-3 p-3 glass-subtle border border-white/10 rounded-lg">
            <input
              type="checkbox"
              id="clientVisible"
              checked={clientVisible}
              onChange={(e) => setClientVisible(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-accent focus:ring-accent"
            />
            <label htmlFor="clientVisible" className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <Eye className="w-4 h-4" />
              <span>Visible to client</span>
            </label>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Files & Visuals
            </label>
            
            {/* Existing Assets */}
            {existingAssets.length > 0 && (
              <div className="mb-3 space-y-2">
                {existingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-3 glass-subtle border border-white/10 rounded-lg"
                  >
                    {asset.kind === 'file' && asset.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <ImageIcon className="w-5 h-5 text-[#4C8DFF] flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-[#4C8DFF] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{asset.name}</p>
                      {asset.proof_type && (
                        <p className="text-xs text-secondary capitalize">{asset.proof_type}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingAsset(asset.id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Files */}
            {files.length > 0 && (
              <div className="mb-3 space-y-2">
                {files.map((fileWithPreview) => (
                  <div
                    key={fileWithPreview.id}
                    className="flex items-center gap-3 p-3 glass-subtle border border-white/10 rounded-lg"
                  >
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-[#4C8DFF] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{fileWithPreview.file.name}</p>
                      <p className="text-xs text-secondary">
                        {(fileWithPreview.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileWithPreview.id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File Input */}
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
              className="w-full px-4 py-3 glass-subtle border border-white/10 rounded-lg text-primary text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Add Files or Screenshots
            </button>
          </div>

          {/* Updates Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-primary">
                Updates
              </label>
              <button
                type="button"
                onClick={() => setShowAddUpdate(!showAddUpdate)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
                style={{
                  background: 'rgba(214, 179, 106, 0.1)',
                  border: '1px solid rgba(214, 179, 106, 0.3)',
                  color: 'rgba(214, 179, 106, 1)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Update
              </button>
            </div>

            {/* Existing Updates */}
            {updates.length > 0 && (
              <div className="mb-3 space-y-2 max-h-48 overflow-y-auto">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="p-3 glass-subtle border border-white/10 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded border" style={{
                            background: 'rgba(214, 179, 106, 0.1)',
                            borderColor: 'rgba(214, 179, 106, 0.3)',
                            color: 'rgba(214, 179, 106, 1)',
                          }}>
                            {update.stage.replace('_', ' ')}
                          </span>
                          {update.client_visible ? (
                            <Eye className="w-3 h-3 text-secondary" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-secondary" />
                          )}
                        </div>
                        {update.note && (
                          <p className="text-sm text-secondary mt-1">{update.note}</p>
                        )}
                        <p className="text-xs text-secondary mt-1">
                          {new Date(update.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Update Form */}
            {showAddUpdate && (
              <div className="p-4 glass-subtle border border-white/10 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">
                    Stage *
                  </label>
                  <select
                    value={updateStage}
                    onChange={(e) => setUpdateStage(e.target.value)}
                    className="w-full px-3 py-2 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    required
                  >
                    <option value="" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Select stage...</option>
                    <option value="planned" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Planned</option>
                    <option value="in_progress" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>In Progress</option>
                    <option value="in_review" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>In Review</option>
                    <option value="approved" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Approved</option>
                    <option value="complete" style={{ background: '#0B0F14', color: 'rgba(255,255,255,0.92)' }}>Complete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                    placeholder="Add a note about this update..."
                  />
                </div>

                {/* Update File Upload */}
                <div>
                  <input
                    ref={updateFileInputRef}
                    type="file"
                    multiple
                    onChange={handleUpdateFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => updateFileInputRef.current?.click()}
                    className="w-full px-3 py-2 text-xs glass-subtle border border-white/10 rounded-lg text-secondary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Add Files or Screenshots
                  </button>
                  
                  {updateFiles.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {updateFiles.map((fileWithPreview) => (
                        <div key={fileWithPreview.id} className="relative group">
                          {fileWithPreview.preview ? (
                            <img
                              src={fileWithPreview.preview}
                              alt={fileWithPreview.file.name}
                              className="w-full h-16 object-cover rounded border border-white/10"
                            />
                          ) : (
                            <div className="w-full h-16 glass-subtle border border-white/10 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-secondary" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeUpdateFile(fileWithPreview.id)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateClientVisible(!updateClientVisible)}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center ${
                      updateClientVisible ? 'bg-accent/30' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      updateClientVisible ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {updateClientVisible ? (
                      <Eye className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-secondary" />
                    )}
                    <span className="text-xs text-secondary">
                      {updateClientVisible ? 'Visible to client' : 'Internal only'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUpdate(false);
                      setUpdateStage('');
                      setUpdateNote('');
                      setUpdateClientVisible(false);
                      setUpdateFiles([]);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg glass-subtle text-secondary hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostUpdate}
                    disabled={postingUpdate || !updateStage}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(214, 179, 106, 0.2)',
                      border: '1px solid rgba(214, 179, 106, 0.3)',
                      color: 'rgba(214, 179, 106, 1)',
                    }}
                  >
                    {postingUpdate ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
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
            disabled={loading || uploading || !title.trim() || !type.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

