'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Save } from 'lucide-react';
import { updateClientPortalConfig } from '@/app/actions/client-portal';
import { getClientPortalConfig } from '@/app/actions/client-portal';

interface DashboardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  dashboardLayout?: {
    sections?: string[];
    kpis?: string[];
  };
}

const sectionsMap: Record<string, { label: string; description: string }> = {
  kpis: { label: 'Executive Summary (KPIs)', description: 'Key performance indicators at a glance' },
  deliverables: { label: 'Deliverables Feed', description: 'Recent work completed and shared' },
  roadmap: { label: 'Roadmap / Next Steps', description: 'Upcoming work and milestones' },
  reports: { label: 'Reports', description: 'Performance reports and analytics' },
  updates: { label: 'Recent Updates', description: 'Latest activity and changes' },
};

const kpisMap: Record<string, string> = {
  leads: 'Leads / Bookings',
  spend: 'Spend',
  cpl: 'CPL / CPA',
  roas: 'ROAS',
  work_completed: 'Work Completed',
};

export default function DashboardEditModal({
  isOpen,
  onClose,
  orgId,
  dashboardLayout,
}: DashboardEditModalProps) {
  const [sections, setSections] = useState<string[]>(dashboardLayout?.sections || []);
  const [kpis, setKpis] = useState<string[]>(dashboardLayout?.kpis || []);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>({});

  // Load services and reset layout when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to current layout from props first
      if (dashboardLayout) {
        setSections(dashboardLayout.sections || []);
        setKpis(dashboardLayout.kpis || []);
      }
      
      // Then load services from config
      getClientPortalConfig(orgId).then((result) => {
        if (result && 'data' in result && result.data) {
          const config = result.data as any;
          setServices((config.services || {}) as Record<string, boolean>);
          // Update sections and kpis from current layout if not already set
          if (config.dashboard_layout && !dashboardLayout) {
            setSections(config.dashboard_layout.sections || []);
            setKpis(config.dashboard_layout.kpis || []);
          }
        }
      });
    }
  }, [isOpen, orgId, dashboardLayout]);

  const handleRemoveSection = (sectionId: string) => {
    const newSections = sections.filter((s) => s !== sectionId);
    setSections(newSections);
    // If removing KPIs section, also remove all KPIs
    if (sectionId === 'kpis') {
      setKpis([]);
    }
  };

  const handleRemoveKpi = (kpiId: string) => {
    const newKpis = kpis.filter((k) => k !== kpiId);
    setKpis(newKpis);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClientPortalConfig(orgId, {
        dashboard_layout: {
          sections,
          kpis,
        },
      });
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      alert('Failed to save dashboard changes');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original layout
    if (dashboardLayout) {
      setSections(dashboardLayout.sections || []);
      setKpis(dashboardLayout.kpis || []);
    }
    onClose();
  };

  if (!isOpen || typeof window === 'undefined') return null;

  const enabledServices = Object.keys(services).filter((id) => services[id]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative glass-surface border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Edit Dashboard</h2>
            <p className="text-sm text-secondary mt-1">Customize which sections and metrics appear on the client dashboard</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dashboard Sections */}
          <div>
            <h3 className="text-sm font-medium text-primary mb-3">Dashboard Sections</h3>
            <div className="space-y-2">
              {sections.map((sectionId) => {
                const section = sectionsMap[sectionId];
                if (!section) return null;

                return (
                  <div
                    key={sectionId}
                    className="flex items-center justify-between p-4 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary">{section.label}</div>
                      <div className="text-xs text-secondary">{section.description}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveSection(sectionId)}
                      className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {sections.length === 0 && (
                <div className="text-sm text-secondary p-4 glass-surface rounded-lg border border-white/5 text-center">
                  No sections configured.
                </div>
              )}
            </div>
          </div>

          {/* KPIs / Metrics */}
          {sections.includes('kpis') && (
            <div>
              <h3 className="text-sm font-medium text-primary mb-3">Metrics / KPIs</h3>
              <div className="space-y-2">
                {kpis.map((kpiId) => {
                  const kpiLabel = kpisMap[kpiId];
                  if (!kpiLabel) return null;

                  return (
                    <div
                      key={kpiId}
                      className="flex items-center justify-between p-3 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="text-sm text-primary">{kpiLabel}</div>
                      <button
                        onClick={() => handleRemoveKpi(kpiId)}
                        className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove metric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {kpis.length === 0 && (
                  <div className="text-sm text-secondary p-3 glass-surface rounded-lg border border-white/5 text-center">
                    No metrics configured.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Services (read-only) */}
          {enabledServices.length > 0 && (
            <div className="glass-surface rounded-lg p-4 border border-white/5">
              <p className="text-xs text-muted mb-2 uppercase tracking-wider">Selected Services</p>
              <div className="flex flex-wrap gap-2">
                {enabledServices.map((serviceId) => {
                  // Simple service labels - you can enhance this with SERVICE_TYPES if needed
                  const serviceLabels: Record<string, string> = {
                    ads: 'Paid Ads',
                    seo: 'SEO',
                    web: 'Web Development',
                    content: 'Content',
                    crm: 'CRM',
                    ai_automation: 'AI Automation',
                    reporting: 'Reporting',
                  };
                  const label = serviceLabels[serviceId] || serviceId;
                  return (
                    <span
                      key={serviceId}
                      className="px-3 py-1 text-xs glass-surface rounded border border-white/5 text-secondary"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={handleCancel}
            className="px-4 py-2 glass-surface rounded-lg hover:bg-white/10 transition-all text-sm border border-white/10 text-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 flex items-center gap-2 text-sm border border-accent/30 font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

