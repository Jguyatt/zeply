'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Globe, Zap, Target, Image as ImageIcon, Check, Upload, File, XCircle, Plus, Circle, CheckCircle2, Clock, Eye, CheckCircle } from 'lucide-react';
import { getDeliverableTemplates, getDeliverableTemplate, createDeliverableFromTemplate } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  required_proof_types: string[];
}

interface TemplateItem {
  id: string;
  title: string;
  sort_order: number;
  is_required: boolean;
}

interface DeliverableTemplateModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeliverableTemplateModal({
  orgId,
  onClose,
  onSuccess,
}: DeliverableTemplateModalProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<Array<{ file: File; preview?: string; id: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [overrides, setOverrides] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:54',message:'useEffect triggered - selectedTemplate changed',data:{selectedTemplateId:selectedTemplate?.id,selectedTemplateName:selectedTemplate?.name,isScratch:selectedTemplate?.id === 'scratch'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (selectedTemplate && selectedTemplate.id !== 'scratch') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:57',message:'Loading template details (not scratch)',data:{templateId:selectedTemplate.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      loadTemplateDetails(selectedTemplate.id);
    } else if (selectedTemplate?.id === 'scratch') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:61',message:'Skipping template details load for scratch',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setTemplateItems([]);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await getDeliverableTemplates();
      if (result.error) {
        alert(result.error);
        return;
      }
      setTemplates(result.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateDetails = async (templateId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:77',message:'loadTemplateDetails called',data:{templateId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const result = await getDeliverableTemplate(templateId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:80',message:'getDeliverableTemplate result',data:{hasError:!!result.error,errorMessage:result.error,hasData:!!result.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (result.error) {
        alert(result.error);
        return;
      }
      if (result.data) {
        setTemplateItems(result.data.items || []);
        // Pre-fill title with template name if not set
        if (!overrides.title && result.data.name) {
          setOverrides((prev) => ({ ...prev, title: result.data.name }));
        }
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:94',message:'loadTemplateDetails error caught',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error loading template details:', error);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'Report':
        return <FileText className="w-5 h-5" />;
      case 'Landing Page':
      case 'Web':
        return <Globe className="w-5 h-5" />;
      case 'Workflow':
      case 'Automation':
        return <Zap className="w-5 h-5" />;
      case 'Integration':
      case 'Integration (Advanced)':
        return <Target className="w-5 h-5" />;
      case 'Creative':
        return <ImageIcon className="w-5 h-5" />;
      case 'Strategy / Plan':
        return <FileText className="w-5 h-5" />;
      case 'Setup / Configuration':
        return <Zap className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Pipeline Timeline Component
  const PipelineTimeline = ({ currentStage }: { currentStage: string }) => {
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
      <div className="relative py-4">
        {/* Timeline line background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/10" />
        
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
                    prevStageDone ? 'bg-[#4C8DFF]' : 'bg-white/10'
                  }`} />
                )}
                
                {/* Stage node */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isDone 
                    ? 'bg-[#4C8DFF] text-white shadow-lg shadow-[#4C8DFF]/30' 
                    : isCurrent 
                    ? 'bg-[#4C8DFF]/20 border-2 border-[#4C8DFF] text-[#4C8DFF] shadow-lg shadow-[#4C8DFF]/20' 
                    : 'bg-white/5 border-2 border-white/20 text-secondary'
                }`}>
                  <Icon className={`w-5 h-5 ${isDone ? 'text-white' : ''}`} />
                </div>
                
                {/* Stage label */}
                <div className="mt-3 text-center max-w-[90px]">
                  <p className={`text-xs font-medium mb-0.5 ${
                    isCurrent ? 'text-[#4C8DFF]' : isDone ? 'text-primary' : 'text-secondary'
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
    );
  };

  const getBestFor = (templateName: string): string => {
    switch (templateName) {
      case 'Strategy / Plan':
        return 'Best for: Initial client onboarding, audits, and roadmap planning';
      case 'Setup / Configuration':
        return 'Best for: Tracking setup, analytics configuration, CRM setup, n8n environments';
      case 'Creative':
        return 'Best for: Ad creatives, social media graphics, video content';
      case 'Landing Page':
        return 'Best for: Conversion-focused landing pages and campaign pages';
      case 'Report':
        return 'Best for: Performance reports, analytics summaries, campaign insights';
      case 'Automation / Workflow':
        return 'Best for: n8n workflows, client automations, process automation';
      case 'Integration (Advanced)':
        return 'Best for: Complex API integrations and system connections';
      default:
        return '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map(file => ({
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
    try {
      const uploadPromises = files.map(async (fileWithPreview) => {
        const formData = new FormData();
        formData.append('file', fileWithPreview.file);
        formData.append('deliverableId', deliverableId);
        formData.append('proofType', fileWithPreview.file.type.startsWith('image/') ? 'screenshot' : 'file');
        formData.append('isRequiredProof', 'false');

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

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:195',message:'handleCreate called',data:{selectedTemplateId:selectedTemplate.id,isScratch:selectedTemplate.id === 'scratch',title:overrides.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    setCreating(true);
    try {
      let result;

      // Handle "Start from Scratch" - create without template
      if (selectedTemplate.id === 'scratch') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:203',message:'Creating deliverable from scratch',data:{orgId,title:overrides.title || 'New Deliverable',type:'Other'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const { createDeliverable } = await import('@/app/actions/deliverables');
        result = await createDeliverable(orgId, {
          title: overrides.title || 'New Deliverable',
          type: 'Other',
          description: overrides.description || undefined,
          due_date: overrides.due_date || undefined,
        });
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DeliverableTemplateModal.tsx:213',message:'Creating deliverable from template',data:{orgId,templateId:selectedTemplate.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Create from template
        result = await createDeliverableFromTemplate(orgId, selectedTemplate.id, {
          title: overrides.title || selectedTemplate.name,
          description: overrides.description || undefined,
          due_date: overrides.due_date || undefined,
        });
      }

      if (result.error) {
        alert(result.error);
        setCreating(false);
        return;
      }

      // Upload files if any
      if (files.length > 0 && result.data) {
        try {
          await uploadFiles((result.data as any).id);
        } catch (uploadError) {
          alert(`Deliverable created but file upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setCreating(false);
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
    } catch (error) {
      console.error('Error creating deliverable:', error);
      alert('Failed to create deliverable');
    } finally {
      setCreating(false);
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="glass-panel p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-medium text-primary mb-6">Create Deliverable</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm text-secondary">Loading templates...</p>
          </div>
        ) : !selectedTemplate ? (
          // Template Selection
          <div className="space-y-4">
            {/* Start from Scratch Option */}
            <button
              onClick={() => {
                // Create a "scratch" template object for the form
                setSelectedTemplate({
                  id: 'scratch',
                  name: 'Custom Deliverable',
                  type: 'Other',
                  description: 'Create a deliverable without a template',
                  required_proof_types: [],
                });
                setOverrides({ title: '', description: '', due_date: '' });
              }}
              className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 bg-white/2 hover:bg-white/5 hover:border-[#4C8DFF]/30 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-secondary flex-shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-primary mb-1">Start from Scratch</h3>
                  <p className="text-xs text-secondary">Create a custom deliverable without a template</p>
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-secondary uppercase tracking-wider">Or Choose a Template</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="p-6 rounded-xl border border-white/10 bg-white/2 hover:bg-white/5 hover:border-[#4C8DFF]/30 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#4C8DFF]/20 flex items-center justify-center text-[#4C8DFF] flex-shrink-0">
                      {getTemplateIcon(template.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-primary mb-1">{template.name}</h3>
                      <p className="text-xs text-secondary leading-relaxed mb-2">{template.description}</p>
                      <p className="text-xs text-[#4C8DFF] mb-3 italic">{getBestFor(template.name)}</p>
                      <div className="flex items-center gap-2">
                        {template.required_proof_types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 text-xs rounded bg-white/5 text-secondary border border-white/10"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Template Details & Overrides
          <div className="space-y-6">
            {/* Selected Template Info */}
            <div className="p-4 rounded-xl border border-[#4C8DFF]/30 bg-[#4C8DFF]/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#4C8DFF]/20 flex items-center justify-center text-[#4C8DFF] flex-shrink-0">
                  {getTemplateIcon(selectedTemplate.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-primary mb-1">{selectedTemplate.name}</h3>
                  <p className="text-xs text-secondary">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setOverrides({ title: '', description: '', due_date: '' });
                  }}
                  className="text-xs text-secondary hover:text-primary"
                >
                  Change template
                </button>
              </div>
            </div>

            {/* Pipeline Preview - Only show if not "Start from Scratch" */}
            {selectedTemplate.id !== 'scratch' && (
              <div>
                <h3 className="text-sm font-medium text-primary mb-4">Pipeline Preview</h3>
                <PipelineTimeline currentStage="planned" />
                <div className="mt-4 flex items-center gap-3 text-xs text-secondary">
                  <span>Estimated time: 3–5 days</span>
                  <span className="px-2 py-0.5 rounded bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30">
                    Client approval required at In Review
                  </span>
                </div>
              </div>
            )}

            {/* Overrides Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-primary">Customize</h3>
              
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-secondary mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={overrides.title}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                  placeholder={selectedTemplate.id === 'scratch' ? 'Enter deliverable title' : selectedTemplate.name}
                  required
                />
              </div>

              {selectedTemplate.id !== 'scratch' && (
                <div>
                  <label htmlFor="type" className="block text-xs font-medium text-secondary mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    value={selectedTemplate.type}
                    disabled
                    className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30 opacity-60"
                  >
                    <option>{selectedTemplate.type}</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-xs font-medium text-secondary mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={overrides.description}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                  placeholder={selectedTemplate.id === 'scratch' ? 'Describe what this deliverable is for...' : selectedTemplate.description}
                />
              </div>

              <div>
                <label htmlFor="due_date" className="block text-xs font-medium text-secondary mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={overrides.due_date}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 glass-subtle rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/30"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">
                  Attach Files (Optional)
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
                  Add Files or Screenshots
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
                          <XCircle className="w-4 h-4 text-secondary hover:text-primary" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-secondary hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            <button
              onClick={handleCreate}
              disabled={creating || uploading || !overrides.title.trim()}
              className="btn-primary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? 'Uploading files...' : creating ? 'Creating...' : 'Create Deliverable'}
              {!creating && !uploading && <Check className="w-4 h-4" />}
            </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

