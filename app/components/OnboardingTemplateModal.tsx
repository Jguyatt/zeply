'use client';

import { useState } from 'react';
import { X, FileText, Sparkles, Loader2 } from 'lucide-react';
import { ONBOARDING_TEMPLATES, OnboardingTemplate } from '@/app/lib/onboarding-templates';

interface OnboardingTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => Promise<void>;
  onStartFromScratch: () => Promise<void>;
}

export default function OnboardingTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onStartFromScratch,
}: OnboardingTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartFromScratch = async () => {
    setLoading(true);
    try {
      await onStartFromScratch();
      // Don't close modal here - it will reload the page on success
    } catch (error) {
      // Error already handled in handler, just stop loading
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    setLoading(true);
    setLoadingTemplateId(templateId);
    try {
      await onSelectTemplate(templateId);
      // Don't close modal here - it will reload the page on success
    } catch (error) {
      // Error already handled in handler, just stop loading
      setLoading(false);
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-surface rounded-2xl border border-white/10 shadow-prestige-soft w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Choose Onboarding Setup</h2>
            <p className="text-sm text-secondary mt-1">Start from scratch or use a pre-built template</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Start from Scratch Option */}
          <button
            onClick={handleStartFromScratch}
            disabled={loading}
            className="w-full glass-surface rounded-xl p-6 border border-white/10 hover:border-accent/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 glass-surface rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
                {loading && !loadingTemplateId ? (
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-primary mb-1">Start from Scratch</h3>
                <p className="text-sm text-secondary">
                  Create a custom onboarding flow tailored to your specific needs. Build it step by step.
                </p>
              </div>
            </div>
          </button>

          {/* Templates Section */}
          <div>
            <h3 className="text-sm font-medium text-secondary mb-4">Or Choose a Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ONBOARDING_TEMPLATES.map((template) => {
                const isTemplateLoading = loading && loadingTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    disabled={loading}
                    className="glass-surface rounded-xl p-5 border border-white/10 hover:border-accent/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 glass-surface rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors">
                        {isTemplateLoading ? (
                          <Loader2 className="w-5 h-5 text-accent animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-accent" />
                        )}
                      </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-primary mb-1">{template.name}</h4>
                      <p className="text-xs text-secondary mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.nodes.map((node, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 glass-surface rounded border border-white/5 text-secondary"
                          >
                            {node.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

