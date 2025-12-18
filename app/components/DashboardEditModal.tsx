'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Save, Plus, ChevronDown, Check } from 'lucide-react';
import { updateClientPortalConfig } from '@/app/actions/client-portal';
import { getClientPortalConfig } from '@/app/actions/client-portal';

interface DashboardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  dashboardLayout?: {
    sections?: string[];
    kpis?: string[];
    theme?: string;
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

const themes = [
  { id: 'classic', name: 'Classic', description: 'Traditional, clean layout with serif-inspired fonts' },
  { id: 'sophisticated', name: 'Sophisticated', description: 'Elegant, refined design with premium typography' },
  { id: 'modern', name: 'Modern', description: 'Contemporary, minimalist design with sans-serif fonts' },
  { id: 'bold', name: 'Bold', description: 'Dynamic, impactful design with strong typography' },
];

export default function DashboardEditModal({
  isOpen,
  onClose,
  orgId,
  dashboardLayout,
}: DashboardEditModalProps) {
  const [sections, setSections] = useState<string[]>(dashboardLayout?.sections || []);
  const [kpis, setKpis] = useState<string[]>(dashboardLayout?.kpis || []);
  const [theme, setTheme] = useState<string>(dashboardLayout?.theme || 'sophisticated');
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [showAddSectionDropdown, setShowAddSectionDropdown] = useState(false);
  const [showAddKpiDropdown, setShowAddKpiDropdown] = useState(false);

  // Load services and reset layout when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to current layout from props first
      if (dashboardLayout) {
        setSections(dashboardLayout.sections || []);
        setKpis(dashboardLayout.kpis || []);
        setTheme(dashboardLayout.theme || 'sophisticated');
      }
      
      // Then load services from config
      getClientPortalConfig(orgId).then((result) => {
        if (result && 'data' in result && result.data) {
          const config = result.data as any;
          setServices((config.services || {}) as Record<string, boolean>);
          // Update sections, kpis, and theme from current layout if not already set
          if (config.dashboard_layout && !dashboardLayout) {
            setSections(config.dashboard_layout.sections || []);
            setKpis(config.dashboard_layout.kpis || []);
            setTheme(config.dashboard_layout.theme || 'sophisticated');
          }
        }
      });
    } else {
      // Reset dropdowns when modal closes
      setShowAddSectionDropdown(false);
      setShowAddKpiDropdown(false);
    }
  }, [isOpen, orgId, dashboardLayout]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside both dropdowns
      if (!target.closest('[data-dropdown-section]') && !target.closest('[data-dropdown-kpi]')) {
        setShowAddSectionDropdown(false);
        setShowAddKpiDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, showAddSectionDropdown, showAddKpiDropdown]);

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

  const handleAddSection = (sectionId: string) => {
    if (!sections.includes(sectionId)) {
      setSections([...sections, sectionId]);
    }
    setShowAddSectionDropdown(false);
  };

  const handleAddKpi = (kpiId: string) => {
    if (!kpis.includes(kpiId)) {
      setKpis([...kpis, kpiId]);
    }
    setShowAddKpiDropdown(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClientPortalConfig(orgId, {
        dashboard_layout: {
          sections,
          kpis,
          theme,
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
      setTheme(dashboardLayout.theme || 'sophisticated');
    }
    onClose();
  };

  // Get available sections/KPIs that aren't already added
  const availableSections = Object.keys(sectionsMap).filter(id => !sections.includes(id));
  const availableKpis = Object.keys(kpisMap).filter(id => !kpis.includes(id));

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
      <div className="relative glass-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-primary mb-1">Dashboard Sections</h3>
                <p className="text-xs text-secondary">Configure which sections appear on the client dashboard</p>
              </div>
              {availableSections.length > 0 && (
                <div className="relative" data-dropdown-section>
                  <button
                    onClick={() => {
                      setShowAddSectionDropdown(!showAddSectionDropdown);
                      setShowAddKpiDropdown(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs glass-surface rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-secondary hover:text-primary"
                  >
                    <Plus className="w-3 h-3" />
                    Add Section
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAddSectionDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showAddSectionDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 glass-surface rounded-xl border border-white/10 shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                      <div className="max-h-60 overflow-y-auto">
                        {availableSections.map((sectionId) => {
                          const section = sectionsMap[sectionId];
                          return (
                            <button
                              key={sectionId}
                              onClick={() => handleAddSection(sectionId)}
                              className="w-full text-left p-4 hover:bg-white/10 transition-all border-b border-white/5 last:border-b-0 group"
                            >
                              <div className="text-sm font-medium text-primary group-hover:text-accent transition-colors mb-1">
                                {section.label}
                              </div>
                              <div className="text-xs text-secondary">{section.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {sections.map((sectionId) => {
                const section = sectionsMap[sectionId];
                if (!section) return null;

                return (
                  <div
                    key={sectionId}
                    className="group flex items-center justify-between p-4 glass-surface rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary mb-0.5">{section.label}</div>
                      <div className="text-xs text-secondary">{section.description}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSection(sectionId);
                      }}
                      className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {sections.length === 0 && (
                <div className="text-sm text-secondary p-6 glass-surface rounded-lg border border-white/5 border-dashed text-center">
                  <p className="mb-1">No sections configured</p>
                  <p className="text-xs text-muted">Click "Add Section" above to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* KPIs / Metrics */}
          {sections.includes('kpis') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-primary mb-1">Metrics / KPIs</h3>
                  <p className="text-xs text-secondary">Select which metrics to display in the Executive Summary</p>
                </div>
                {availableKpis.length > 0 && (
                  <div className="relative" data-dropdown-kpi>
                    <button
                      onClick={() => {
                        setShowAddKpiDropdown(!showAddKpiDropdown);
                        setShowAddSectionDropdown(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs glass-surface rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-secondary hover:text-primary"
                    >
                      <Plus className="w-3 h-3" />
                      Add Metric
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAddKpiDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showAddKpiDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 glass-surface rounded-xl border border-white/10 shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                        <div className="max-h-60 overflow-y-auto">
                          {availableKpis.map((kpiId) => {
                            const kpiLabel = kpisMap[kpiId];
                            return (
                              <button
                                key={kpiId}
                                onClick={() => handleAddKpi(kpiId)}
                                className="w-full text-left p-3.5 hover:bg-white/10 transition-all border-b border-white/5 last:border-b-0 group"
                              >
                                <div className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                                  {kpiLabel}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {kpis.map((kpiId) => {
                  const kpiLabel = kpisMap[kpiId];
                  if (!kpiLabel) return null;

                  return (
                    <div
                      key={kpiId}
                      className="group flex items-center justify-between p-3.5 glass-surface rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
                    >
                      <div className="text-sm font-medium text-primary">{kpiLabel}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveKpi(kpiId);
                        }}
                        className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove metric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {kpis.length === 0 && (
                  <div className="text-sm text-secondary p-5 glass-surface rounded-lg border border-white/5 border-dashed text-center">
                    <p className="mb-1">No metrics configured</p>
                    <p className="text-xs text-muted">Click "Add Metric" above to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Design Theme */}
          <div>
            <h3 className="text-sm font-medium text-primary mb-3">Design Theme</h3>
            <p className="text-xs text-secondary mb-4">Choose a design theme that changes the layout and typography of the client dashboard</p>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((themeOption) => {
                const isSelected = theme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    className={`p-4 glass-surface rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-primary">{themeOption.name}</div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="text-xs text-secondary">{themeOption.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

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

