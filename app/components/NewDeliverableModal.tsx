'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, File, XCircle, Calendar, User, Eye, EyeOff, AlertCircle, CheckCircle2, Clock, Circle, Zap, CheckCircle } from 'lucide-react';
import { createDeliverable } from '@/app/actions/deliverables';
import { getOrgMembers, OrgMember } from '@/app/lib/getOrgMembers';

interface NewDeliverableModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export default function NewDeliverableModal({ orgId, onClose, onSuccess }: NewDeliverableModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Ads');
  const [status, setStatus] = useState('planned');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'med' | 'high' | ''>('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [noDueDate, setNoDueDate] = useState(false);
  const [clientVisible, setClientVisible] = useState(true);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileWithPreview[] = droppedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

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
    
    // Prevent double submission
    if (loading || uploading) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const deliverableData = {
        title,
        type,
        description: description || undefined,
        due_date: noDueDate ? null : (dueDate || undefined),
        status: status || 'planned',
        assigned_to: assignedTo || null,
        priority: priority || null,
        client_visible: clientVisible,
      };

      const result = await createDeliverable(orgId, deliverableData);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Upload files if any
      if (files.length > 0 && result.data) {
        try {
          await uploadFiles((result.data as any).id);
        } catch (uploadError) {
          setError(`Deliverable created but file upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-red-400';
    if (p === 'med') return 'text-yellow-400';
    if (p === 'low') return 'text-green-400';
    return 'text-secondary';
  };

  const getPriorityIcon = (p: string) => {
    if (p === 'high') return <AlertCircle className="w-4 h-4" />;
    if (p === 'med') return <Clock className="w-4 h-4" />;
    if (p === 'low') return <CheckCircle2 className="w-4 h-4" />;
    return null;
  };

  // Pipeline Preview Component
  const PipelinePreview = ({ currentStage }: { currentStage: string }) => {
    const stages = [
      { id: 'planned', label: 'Planned', description: 'created & scoped', icon: Circle },
      { id: 'in_progress', label: 'In Progress', description: 'work underway', icon: Zap },
      { id: 'in_review', label: 'In Review', description: 'sent to client', icon: Eye },
      { id: 'approved', label: 'Approved', description: 'client approved', icon: CheckCircle },
      { id: 'complete', label: 'Complete', description: 'delivered', icon: CheckCircle2 },
    ];

    const getStageState = (stageId: string, currentStageId: string) => {
      const currentIndex = stages.findIndex(s => s.id === currentStageId);
      const stageIndex = stages.findIndex(s => s.id === stageId);
      
      if (stageIndex < currentIndex) return 'done';
      if (stageIndex === currentIndex) return 'current';
      return 'upcoming';
    };

    return (
      <div className="mb-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-primary">Pipeline Preview</h3>
          <h3 className="text-sm font-medium text-secondary">Customize</h3>
        </div>
        
        <div className="relative py-4">
          {/* Stages */}
          <div className="relative flex items-start justify-between gap-2">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const state = getStageState(stage.id, currentStage);
              const isDone = state === 'done';
              const isCurrent = state === 'current';
              const prevStageDone = index > 0 && getStageState(stages[index - 1].id, currentStage) === 'done';
              
              return (
                <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                  {/* Connector line from previous stage */}
                  {index > 0 && (
                    <div className={`absolute top-6 left-[-50%] right-[50%] h-0.5 ${
                      prevStageDone ? 'bg-accent' : 'bg-white/10'
                    }`} />
                  )}
                  
                  {/* Stage node */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-accent text-white shadow-lg shadow-accent/30' 
                      : isCurrent 
                      ? 'bg-accent/20 border-2 border-accent text-accent shadow-lg shadow-accent/20' 
                      : 'bg-white/5 border-2 border-white/20 text-secondary'
                  }`}>
                    <Icon className={`w-5 h-5 ${isDone ? 'text-white' : ''}`} />
                  </div>
                  
                  {/* Stage label */}
                  <div className="mt-3 text-center max-w-[90px]">
                    <p className={`text-xs font-medium mb-0.5 ${
                      isCurrent ? 'text-accent' : isDone ? 'text-primary' : 'text-secondary'
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-secondary leading-tight">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated time and tags */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-secondary">Estimated time: 3-5 days</p>
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md border border-accent/20">
            Client approval required at In Review
          </span>
        </div>
      </div>
    );
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="glass-panel p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium text-primary mb-6">Create Deliverable</h2>

        {/* Pipeline Preview */}
        <PipelinePreview currentStage={status} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              placeholder="Enter deliverable title"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-secondary mb-1">
              Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              required
            >
              <option value="SEO">SEO</option>
              <option value="Ads">Ads</option>
              <option value="Creative">Creative</option>
              <option value="Dev">Dev</option>
              <option value="Automation">Automation</option>
              <option value="Report">Report</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status and Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-secondary mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="complete">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-secondary mb-1">
                Assignee (Optional)
              </label>
              <select
                id="assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                disabled={loadingMembers}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-secondary mb-1">
              Priority (Optional)
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'med' | 'high' | '')}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
            >
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="med">Med</option>
              <option value="high">High</option>
            </select>
            {priority && (
              <div className={`mt-1 flex items-center gap-1 text-xs ${getPriorityColor(priority)}`}>
                {getPriorityIcon(priority)}
                <span className="capitalize">{priority} Priority</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 glass-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
              placeholder="Describe what this deliverable is for..."
            ></textarea>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-secondary mb-1">
              Due Date (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setNoDueDate(false);
                    }}
                    disabled={noDueDate}
                    className="w-full pl-10 pr-3 py-2 glass-subtle rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-3 p-3 glass-subtle rounded-xl">
            <input
              type="checkbox"
              id="clientVisible"
              checked={clientVisible}
              onChange={(e) => setClientVisible(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-accent focus:ring-accent"
            />
            <label htmlFor="clientVisible" className="flex items-center gap-2 text-sm text-primary cursor-pointer flex-1">
              {clientVisible ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-secondary" />}
              <span>Visible to client</span>
            </label>
          </div>

          {/* File Upload - Drag/Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Attach Files (Optional)
            </label>
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                isDragging
                  ? 'border-accent bg-accent/10'
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              
              {files.length === 0 ? (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-secondary mb-1">
                    Drag and drop files here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-accent hover:text-accent/80 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted">PDF, images, documents (MAX. 10MB each)</p>
                </div>
              ) : (
                <div className="space-y-2">
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
                        <XCircle className="w-4 h-4 text-secondary hover:text-primary" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 glass-surface rounded-lg text-primary hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm border border-white/10 mt-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add More Files
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 glass-subtle rounded-xl text-primary hover:bg-white/10 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2.5 bg-accent/20 text-accent rounded-xl hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading files...' : loading ? 'Creating...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Deliverable
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
