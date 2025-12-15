'use client';

import { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import { Trash2, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface NodeSettingsPanelProps {
  node: Node;
  orgId: string;
  clerkOrgId: string;
  onUpdate: (updatedNodeData?: any) => void | Promise<void>;
}

export default function NodeSettingsPanel({
  node,
  orgId,
  clerkOrgId,
  onUpdate,
}: NodeSettingsPanelProps) {
  const [title, setTitle] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [required, setRequired] = useState(node.data.required ?? true);
  const [config, setConfig] = useState(node.data.config || {});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setTitle(node.data.label || '');
    setDescription(node.data.description || '');
    setRequired(node.data.required ?? true);
    // Update config from node - this will sync when node changes from external updates
    const nodeConfig = node.data.config || {};
    setConfig(nodeConfig);
  }, [node.id]); // Only update when node ID changes (node selection changes)

  const handleSave = async (configToSave?: typeof config) => {
    // Check if node has a temporary ID (not yet saved to database)
    if (node.id.startsWith('temp-')) {
      showNotification('error', 'Please wait for the node to finish loading before saving changes.');
      return;
    }

    setSaving(true);
    try {
      // Use provided config or current state
      const configToUse = configToSave || config;
      console.log('Saving node:', node.id);
      console.log('Current config:', configToUse);
      
      // Clean config to remove any non-serializable values (React elements, functions, etc.)
      const cleanConfig = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;
        if (obj instanceof Date) return obj.toISOString();
        if (Array.isArray(obj)) {
          return obj.map(cleanConfig);
        }
        const cleaned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            // Skip functions, React elements, and DOM elements
            if (typeof value === 'function') continue;
            if (value && typeof value === 'object' && value.$$typeof) continue; // React element
            if (value instanceof HTMLElement) continue;
            cleaned[key] = cleanConfig(value);
          }
        }
        return cleaned;
      };
      
      const cleanedConfig = cleanConfig(configToUse);
      console.log('Cleaned config:', cleanedConfig);
      
      // For document nodes, don't update title/description - keep existing values
      const updateData: any = {
        nodeId: node.id,
        config: cleanedConfig,
      };
      
      // Only include title/description/required for non-document nodes
      if (node.data.type !== 'welcome' && node.data.type !== 'contract') {
        updateData.title = title;
        updateData.description = description;
        updateData.required = required;
      }
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log('Save response:', result);
      console.log('Save response data:', result.data);
      console.log('Save response config:', result.data?.config);

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to update node';
        console.error('Error updating node:', errorMessage, result);
        showNotification('error', `Failed to save: ${errorMessage}`);
        return;
      }

      console.log('Save successful, updating UI...');
      // Success - pass the updated node data to onUpdate
      await onUpdate(result.data);
      showNotification('success', 'Changes saved successfully');
    } catch (error) {
      console.error('Error updating node:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update node';
      showNotification('error', `Failed to save: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this node?')) return;

    try {
      const response = await fetch(
        `/api/orgs/${clerkOrgId}/onboarding/nodes?nodeId=${node.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        onUpdate();
      } else {
        throw new Error('Failed to delete node');
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      showNotification('error', 'Failed to delete node');
    }
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Show notification and auto-hide after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 glass-surface rounded-lg shadow-prestige-soft p-4 flex items-center gap-3 min-w-[300px] animate-in slide-in-from-top-5 ${
          notification.type === 'success' 
            ? 'border border-green-500/30 bg-green-500/10' 
            : 'border border-red-500/30 bg-red-500/10'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <p className={`text-sm flex-1 ${
            notification.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {notification.message}
          </p>
          <button
            onClick={() => setNotification(null)}
            className="text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary">Node Settings</h3>
        <button
          onClick={handleDelete}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Only show title/description for non-document nodes */}
      {node.data.type !== 'welcome' && node.data.type !== 'contract' && (
        <>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-sm text-primary">Required</span>
            </label>
          </div>
        </>
      )}

      {/* Type-specific config */}
      {node.data.type === 'payment' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Invoice URL
            </label>
            <input
              type="url"
              value={config.stripe_url || ''}
              onChange={(e) => updateConfig('stripe_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Amount Label
            </label>
            <input
              type="text"
              value={config.amount_label || ''}
              onChange={(e) => updateConfig('amount_label', e.target.value)}
              placeholder="e.g., $1,000"
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>
        </div>
      )}

      {node.data.type === 'welcome' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Upload Document (PDF or Image)
            </label>
            {config.document_file ? (
              <div className="glass-surface rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{config.document_file.name}</p>
                      <p className="text-xs text-secondary">Click to replace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateConfig('document_file', null)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size
                    if (file.size > 10 * 1024 * 1024) {
                      showNotification('error', 'File size exceeds 10MB limit');
                      return;
                    }
                    
                    // Upload to storage
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('nodeId', node.id);
                    
                    try {
                      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/upload-document`, {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok || result.error) {
                        console.error('Upload error response:', result);
                        throw new Error(result.error || 'Failed to upload file');
                      }
                      
                      console.log('File uploaded successfully:', result);
                      
                      // Store URL instead of base64
                      const documentFileData = {
                        name: result.name,
                        type: result.type,
                        url: result.url,
                        filename: result.filename,
                      };
                      
                      console.log('Updating config with:', documentFileData);
                      
                      // Update config state and save immediately with the new config
                      const newConfig = {
                        ...config,
                        document_file: documentFileData,
                      };
                      console.log('Config updated to:', newConfig);
                      
                      // Update state
                      setConfig(newConfig);
                      
                      // Save immediately with the new config (don't wait for state update)
                      setTimeout(async () => {
                        await handleSave(newConfig);
                      }, 100);
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      showNotification('error', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="hidden"
                  id="welcome-file-input"
                />
                <label
                  htmlFor="welcome-file-input"
                  className="mt-3 block text-center text-sm text-accent hover:text-accent/80 cursor-pointer"
                >
                  Replace file
                </label>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size
                    if (file.size > 10 * 1024 * 1024) {
                      showNotification('error', 'File size exceeds 10MB limit');
                      return;
                    }
                    
                    // Upload to storage
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('nodeId', node.id);
                    
                    try {
                      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/upload-document`, {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok || result.error) {
                        console.error('Upload error response:', result);
                        throw new Error(result.error || 'Failed to upload file');
                      }
                      
                      console.log('File uploaded successfully:', result);
                      
                      // Store URL instead of base64
                      const documentFileData = {
                        name: result.name,
                        type: result.type,
                        url: result.url,
                        filename: result.filename,
                      };
                      
                      console.log('Updating config with:', documentFileData);
                      
                      // Update config state and save immediately with the new config
                      const newConfig = {
                        ...config,
                        document_file: documentFileData,
                      };
                      console.log('Config updated to:', newConfig);
                      
                      // Update state
                      setConfig(newConfig);
                      
                      // Save immediately with the new config (don't wait for state update)
                      setTimeout(async () => {
                        await handleSave(newConfig);
                      }, 100);
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      showNotification('error', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="hidden"
                  id="welcome-file-input"
                />
                <label
                  htmlFor="welcome-file-input"
                  className="flex flex-col items-center justify-center w-full h-32 glass-surface rounded-lg border-2 border-dashed border-white/20 hover:border-accent/50 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-secondary group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-primary font-medium">
                      <span className="text-accent">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-secondary">PDF, PNG, JPG, GIF or WEBP (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {node.data.type === 'contract' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Upload Contract Document (PDF or Image)
            </label>
            {config.document_file ? (
              <div className="glass-surface rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/30">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{config.document_file.name}</p>
                      <p className="text-xs text-secondary">Click to replace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateConfig('document_file', null)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size
                    if (file.size > 10 * 1024 * 1024) {
                      showNotification('error', 'File size exceeds 10MB limit');
                      return;
                    }
                    
                    // Upload to storage
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('nodeId', node.id);
                    
                    try {
                      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/upload-document`, {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok || result.error) {
                        console.error('Upload error response:', result);
                        throw new Error(result.error || 'Failed to upload file');
                      }
                      
                      console.log('File uploaded successfully:', result);
                      
                      // Store URL instead of base64
                      const documentFileData = {
                        name: result.name,
                        type: result.type,
                        url: result.url,
                        filename: result.filename,
                      };
                      
                      console.log('Updating config with:', documentFileData);
                      
                      // Update config state and save immediately with the new config
                      const newConfig = {
                        ...config,
                        document_file: documentFileData,
                      };
                      console.log('Config updated to:', newConfig);
                      
                      // Update state
                      setConfig(newConfig);
                      
                      // Save immediately with the new config (don't wait for state update)
                      setTimeout(async () => {
                        await handleSave(newConfig);
                      }, 100);
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      showNotification('error', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="hidden"
                  id="contract-file-input"
                />
                <label
                  htmlFor="contract-file-input"
                  className="mt-3 block text-center text-sm text-accent hover:text-accent/80 cursor-pointer"
                >
                  Replace file
                </label>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size
                    if (file.size > 10 * 1024 * 1024) {
                      showNotification('error', 'File size exceeds 10MB limit');
                      return;
                    }
                    
                    // Upload to storage
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('nodeId', node.id);
                    
                    try {
                      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/upload-document`, {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok || result.error) {
                        console.error('Upload error response:', result);
                        throw new Error(result.error || 'Failed to upload file');
                      }
                      
                      console.log('File uploaded successfully:', result);
                      
                      // Store URL instead of base64
                      const documentFileData = {
                        name: result.name,
                        type: result.type,
                        url: result.url,
                        filename: result.filename,
                      };
                      
                      console.log('Updating config with:', documentFileData);
                      
                      // Update config state and save immediately with the new config
                      const newConfig = {
                        ...config,
                        document_file: documentFileData,
                      };
                      console.log('Config updated to:', newConfig);
                      
                      // Update state
                      setConfig(newConfig);
                      
                      // Save immediately with the new config (don't wait for state update)
                      setTimeout(async () => {
                        await handleSave(newConfig);
                      }, 100);
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      showNotification('error', `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="hidden"
                  id="contract-file-input"
                />
                <label
                  htmlFor="contract-file-input"
                  className="flex flex-col items-center justify-center w-full h-32 glass-surface rounded-lg border-2 border-dashed border-white/20 hover:border-accent/50 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-secondary group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-primary font-medium">
                      <span className="text-accent">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-secondary">PDF, PNG, JPG, GIF or WEBP (MAX. 10MB)</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {node.data.type === 'consent' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Terms URL
            </label>
            <input
              type="url"
              value={config.terms_url || ''}
              onChange={(e) => updateConfig('terms_url', e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Privacy URL
            </label>
            <input
              type="url"
              value={config.privacy_url || ''}
              onChange={(e) => updateConfig('privacy_url', e.target.value)}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 border border-accent/30"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

