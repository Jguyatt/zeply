'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  CheckCircle2,
  Layout,
  Eye,
  Save,
  Send,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  CreditCard,
  Calendar,
  Plug,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  getClientPortalConfig,
  updateClientPortalConfig,
  getAllOnboardingItems,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
} from '@/app/actions/client-portal';

interface ClientSetupProps {
  orgId: string; // Supabase UUID
  orgName: string;
  initialTab?: string;
  clerkOrgId?: string; // Clerk org ID for routing
}

type Tab = 'services' | 'onboarding' | 'dashboard' | 'preview';

const SERVICE_TYPES = [
  { 
    id: 'ads', 
    label: 'Paid Ads', 
    badge: 'Ads',
    defaultPlatforms: ['Meta Ads', 'Google Ads'],
    defaultGoal: 'leads',
    defaultKPIs: ['spend', 'cpl', 'roas'],
  },
  { 
    id: 'seo', 
    label: 'SEO / Local SEO', 
    badge: 'SEO',
    defaultPlatforms: ['Google Search Console', 'Local Listings'],
    defaultGoal: 'traffic',
    defaultKPIs: ['organic_traffic', 'rankings', 'leads'],
  },
  { 
    id: 'web', 
    label: 'Web / Landing Pages', 
    badge: 'Web',
    defaultPlatforms: ['WordPress', 'Webflow'],
    defaultGoal: 'leads',
    defaultKPIs: ['conversions', 'traffic'],
  },
  { 
    id: 'content', 
    label: 'Content', 
    badge: 'Content',
    defaultPlatforms: ['Blog', 'Social Media'],
    defaultGoal: 'engagement',
    defaultKPIs: ['views', 'engagement'],
  },
  { 
    id: 'crm', 
    label: 'CRM / Automation', 
    badge: 'CRM',
    defaultPlatforms: ['HubSpot', 'Salesforce'],
    defaultGoal: 'leads',
    defaultKPIs: ['leads', 'conversions'],
  },
  { 
    id: 'reporting', 
    label: 'Reporting Only', 
    badge: 'Reports',
    defaultPlatforms: ['Analytics'],
    defaultGoal: 'insights',
    defaultKPIs: ['overview'],
  },
];

const ONBOARDING_TYPES = [
  { id: 'doc', label: 'Document Upload', icon: FileText },
  { id: 'form', label: 'Form', icon: FileText },
  { id: 'contract', label: 'Contract Signing', icon: FileText },
  { id: 'connect', label: 'Connect Account', icon: Plug },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'call', label: 'Book Call', icon: Calendar },
];

export default function ClientSetup({ orgId, orgName, initialTab = 'services', clerkOrgId }: ClientSetupProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || 'services');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<any>(null);
  const [services, setServices] = useState<Record<string, any>>({});
  const [dashboardLayout, setDashboardLayout] = useState<any>({
    sections: ['kpis', 'deliverables', 'updates'],
    kpis: ['leads', 'spend', 'cpl', 'roas', 'work_completed'],
  });
  const [onboardingEnabled, setOnboardingEnabled] = useState(false);
  
  // Onboarding items state
  const [onboardingItems, setOnboardingItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  // Expanded service cards
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configResult, itemsResult] = await Promise.all([
        getClientPortalConfig(orgId),
        getAllOnboardingItems(orgId),
      ]);

      if (configResult.data) {
        setConfig(configResult.data);
        setServices(configResult.data.services || {});
        setDashboardLayout(configResult.data.dashboard_layout || {
          sections: ['kpis', 'deliverables', 'updates'],
          kpis: ['leads', 'spend', 'cpl', 'roas', 'work_completed'],
        });
        setOnboardingEnabled(configResult.data.onboarding_enabled || false);
      }

      if (itemsResult && 'data' in itemsResult && itemsResult.data) {
        setOnboardingItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClientPortalConfig(orgId, {
        services,
        dashboard_layout: dashboardLayout,
        onboarding_enabled: onboardingEnabled,
      });
      // Show success message
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    // Publish changes (same as save for now)
    await handleSave();
  };

  const handlePreview = () => {
    const previewOrgId = clerkOrgId || orgId;
    window.open(`/${previewOrgId}/dashboard?mode=client`, '_blank');
  };

  const handleAddOnboardingItem = async (item: any) => {
    try {
      const result: any = await createOnboardingItem(orgId, {
        ...item,
        sort_order: onboardingItems.length,
      });
      if (result && 'data' in result && result.data) {
        setOnboardingItems([...onboardingItems, result.data]);
        setShowItemForm(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdateOnboardingItem = async (itemId: string, updates: any) => {
    try {
      const result: any = await updateOnboardingItem(itemId, updates);
      if (result && 'data' in result && result.data) {
        setOnboardingItems(onboardingItems.map(item => 
          item.id === itemId ? result.data : item
        ));
        setShowItemForm(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteOnboardingItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const result = await deleteOnboardingItem(itemId);
      if (result.data) {
        setOnboardingItems(onboardingItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Calculate setup status
  const getSetupStatus = () => {
    const enabledServices = Object.values(services).filter((s: any) => s === true || (typeof s === 'object' && s.enabled)).length;
    const hasOnboarding = onboardingEnabled && onboardingItems.length > 0;
    const hasDashboardConfig = dashboardLayout?.sections?.length > 0;

    const checks = [];
    if (enabledServices > 0) checks.push('Services selected');
    if (!hasOnboarding) checks.push('Onboarding not configured');
    if (!hasDashboardConfig) checks.push('Dashboard not customized');

    return {
      isComplete: checks.length === 0,
      checks,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-secondary">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'services' as Tab, label: 'Services', step: 1 },
    { id: 'onboarding' as Tab, label: 'Onboarding', step: 2 },
    { id: 'dashboard' as Tab, label: 'Dashboard', step: 3 },
    { id: 'preview' as Tab, label: 'Preview', step: 4 },
  ];

  const setupStatus = getSetupStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-light text-primary mb-2">Client Setup</h1>
          <p className="text-secondary mb-1">Define scope, onboarding, and what this client will see</p>
          <p className="text-sm text-muted">{orgName}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {/* Setup Status */}
          <div className="glass-surface rounded-lg shadow-prestige-soft p-4 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              {setupStatus.isComplete ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-primary">Setup Status: Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-primary">Setup Status: Incomplete</span>
                </>
              )}
            </div>
            {!setupStatus.isComplete && setupStatus.checks.length > 0 && (
              <ul className="space-y-1">
                {setupStatus.checks.map((check, idx) => (
                  <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                    <span className="text-muted mt-0.5">•</span>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 glass-surface text-secondary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-prestige-soft text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={handlePreview}
          className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-prestige-soft text-sm"
        >
          <Eye className="w-4 h-4" />
          Preview Client View
        </button>
        <button
          onClick={handlePublish}
          disabled={saving}
          className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft text-sm border border-accent/30"
        >
          <Send className="w-4 h-4" />
          Publish Changes
        </button>
      </div>
      <div className="text-xs text-secondary text-right -mt-2">
        Makes changes visible to the client
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {tabs.map((tab, idx) => (
          <div key={tab.id} className="flex items-center">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-primary'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              {tab.step} {tab.label}
            </button>
            {idx < tabs.length - 1 && (
              <span className="mx-2 text-muted">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-surface rounded-lg shadow-prestige-soft p-8">
        {activeTab === 'services' && (
          <ServicesTab
            services={services}
            setServices={setServices}
            expandedServices={expandedServices}
            setExpandedServices={setExpandedServices}
          />
        )}

        {activeTab === 'onboarding' && (
          <OnboardingTab
            onboardingEnabled={onboardingEnabled}
            setOnboardingEnabled={setOnboardingEnabled}
            items={onboardingItems}
            onAdd={handleAddOnboardingItem}
            onUpdate={handleUpdateOnboardingItem}
            onDelete={handleDeleteOnboardingItem}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            showItemForm={showItemForm}
            setShowItemForm={setShowItemForm}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardBuilderTab
            layout={dashboardLayout}
            setLayout={setDashboardLayout}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab orgId={clerkOrgId || orgId} />
        )}
      </div>
    </div>
  );
}

// Services Tab Component
function ServicesTab({
  services,
  setServices,
  expandedServices,
  setExpandedServices,
}: {
  services: Record<string, any>;
  setServices: (services: Record<string, any>) => void;
  expandedServices: Record<string, boolean>;
  setExpandedServices: (expanded: Record<string, boolean>) => void;
}) {
  const toggleService = (serviceId: string) => {
    const service = SERVICE_TYPES.find(s => s.id === serviceId);
    const isEnabled = services[serviceId] === true || (typeof services[serviceId] === 'object' && services[serviceId]?.enabled);
    
    if (isEnabled) {
      // Disable service
      const newServices = { ...services };
      if (typeof newServices[serviceId] === 'object') {
        newServices[serviceId] = { ...newServices[serviceId], enabled: false };
      } else {
        delete newServices[serviceId];
      }
      setServices(newServices);
      setExpandedServices({ ...expandedServices, [serviceId]: false });
    } else {
      // Enable service with defaults
      setServices({
        ...services,
        [serviceId]: {
          enabled: true,
          platforms: service?.defaultPlatforms || [],
          goal: service?.defaultGoal || 'leads',
          kpis: service?.defaultKPIs || [],
        },
      });
      setExpandedServices({ ...expandedServices, [serviceId]: true });
    }
  };

  const toggleExpanded = (serviceId: string) => {
    setExpandedServices({
      ...expandedServices,
      [serviceId]: !expandedServices[serviceId],
    });
  };

  const updateServiceConfig = (serviceId: string, updates: any) => {
    setServices({
      ...services,
      [serviceId]: {
        ...(services[serviceId] || {}),
        ...updates,
      },
    });
  };

  const getServiceConfig = (serviceId: string) => {
    const service = services[serviceId];
    if (service === true) {
      // Legacy: convert boolean to object
      const serviceType = SERVICE_TYPES.find(s => s.id === serviceId);
      return {
        enabled: true,
        platforms: serviceType?.defaultPlatforms || [],
        goal: serviceType?.defaultGoal || 'leads',
        kpis: serviceType?.defaultKPIs || [],
      };
    }
    if (typeof service === 'object') {
      return service;
    }
    return null;
  };

  const isServiceEnabled = (serviceId: string) => {
    const config = getServiceConfig(serviceId);
    return config?.enabled === true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light text-primary mb-2">Engagement Scope</h2>
        <p className="text-sm text-secondary">
          Select the services your agency is responsible for. Each enabled service will affect deliverables, reporting, and the client dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {SERVICE_TYPES.map((service, idx) => {
          const isEnabled = isServiceEnabled(service.id);
          const config = getServiceConfig(service.id);
          const isExpanded = expandedServices[service.id] && isEnabled;
          const platforms = config?.platforms || [];
          const goal = config?.goal || 'leads';
          const kpis = config?.kpis || [];

          return (
            <div key={service.id} className="glass-surface rounded-lg shadow-prestige-soft overflow-hidden border border-white/5">
              {/* Service Card Header */}
              <div className="p-5 glass-border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-accent/20 text-accent border border-accent/30">
                      {service.badge}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-primary">{service.label}</h3>
                      {isEnabled && platforms.length > 0 && (
                        <p className="text-xs text-secondary mt-1">
                          {platforms.slice(0, 2).join(', ')}
                          {platforms.length > 2 && ` +${platforms.length - 2} more`}
                          {' • '}
                          {goal === 'leads' ? 'Lead Generation' : 
                           goal === 'sales' ? 'Sales' : 
                           goal === 'traffic' ? 'Traffic' :
                           goal === 'engagement' ? 'Engagement' :
                           goal === 'insights' ? 'Insights' : goal}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && (
                      <button
                        onClick={() => toggleExpanded(service.id)}
                        className="text-secondary hover:text-primary transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleService(service.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/30"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Expanded Service Configuration */}
              {isExpanded && isEnabled && (
                <div className="p-5 space-y-6 glass-border-t">
                  {/* Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-3">Platforms</label>
                    <div className="space-y-2">
                      {service.defaultPlatforms.map((platform) => (
                        <label
                          key={platform}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={platforms.includes(platform)}
                            onChange={(e) => {
                              const newPlatforms = e.target.checked
                                ? [...platforms, platform]
                                : platforms.filter((p: string) => p !== platform);
                              updateServiceConfig(service.id, { platforms: newPlatforms });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-primary">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Primary Goal */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-3">Primary Goal</label>
                    <div className="space-y-2">
                      {['leads', 'sales', 'traffic', 'engagement', 'insights'].map((g) => (
                        <label
                          key={g}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`goal-${service.id}`}
                            checked={goal === g}
                            onChange={() => updateServiceConfig(service.id, { goal: g })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-primary capitalize">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* KPIs Shown to Client */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-3">KPIs Shown to Client</label>
                    <div className="space-y-2">
                      {service.defaultKPIs.map((kpi) => (
                        <label
                          key={kpi}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={kpis.includes(kpi)}
                            onChange={(e) => {
                              const newKPIs = e.target.checked
                                ? [...kpis, kpi]
                                : kpis.filter((k: string) => k !== kpi);
                              updateServiceConfig(service.id, { kpis: newKPIs });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-primary">{kpi.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Disable Service Button */}
                  <div className="pt-4 glass-border-t">
                    <button
                      onClick={() => toggleService(service.id)}
                      className="px-4 py-2 glass-surface text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm"
                    >
                      Disable Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Onboarding Tab Component
function OnboardingTab({
  onboardingEnabled,
  setOnboardingEnabled,
  items,
  onAdd,
  onUpdate,
  onDelete,
  editingItem,
  setEditingItem,
  showItemForm,
  setShowItemForm,
}: {
  onboardingEnabled: boolean;
  setOnboardingEnabled: (enabled: boolean) => void;
  items: any[];
  onAdd: (item: any) => Promise<void>;
  onUpdate: (itemId: string, updates: any) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  editingItem: any;
  setEditingItem: (item: any) => void;
  showItemForm: boolean;
  setShowItemForm: (show: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-light text-primary">Onboarding</h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={onboardingEnabled}
              onChange={(e) => setOnboardingEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/30"></div>
          </label>
        </div>
        <p className="text-sm text-secondary">
          Configure the first-login experience for this client. Steps will appear until completed.
        </p>
      </div>

      {onboardingEnabled && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary">Onboarding Steps</h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowItemForm(true);
              }}
              className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          {showItemForm && (
            <OnboardingItemForm
              item={editingItem}
              onSave={async (itemData) => {
                if (editingItem) {
                  await onUpdate(editingItem.id, itemData);
                } else {
                  await onAdd(itemData);
                }
              }}
              onCancel={() => {
                setShowItemForm(false);
                setEditingItem(null);
              }}
            />
          )}

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 glass-surface rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-muted" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{item.title}</span>
                      {item.required && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Required
                        </span>
                      )}
                      {!item.published && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          Draft
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-secondary mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowItemForm(true);
                    }}
                    className="text-xs text-secondary hover:text-primary transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-secondary text-sm">
                No onboarding steps yet. Add one to get started.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Onboarding Item Form Component
function OnboardingItemForm({
  item,
  onSave,
  onCancel,
}: {
  item?: any;
  onSave: (item: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    type: item?.type || 'doc',
    required: item?.required || false,
    url: item?.url || '',
    file_url: item?.file_url || '',
    published: item?.published !== undefined ? item.published : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-surface rounded-lg p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10"
        >
          {ONBOARDING_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.required}
            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-secondary">Required</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-secondary">Published</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">URL (optional)</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 glass-surface text-secondary rounded-lg hover:bg-white/10 transition-all text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Dashboard Builder Tab Component
function DashboardBuilderTab({
  layout,
  setLayout,
}: {
  layout: any;
  setLayout: (layout: any) => void;
}) {
  const sections = [
    { id: 'kpis', label: 'Executive Summary (KPIs)' },
    { id: 'deliverables', label: 'Deliverables Feed' },
    { id: 'roadmap', label: 'Roadmap / Next Steps' },
    { id: 'reports', label: 'Reports' },
    { id: 'updates', label: 'Recent Updates' },
  ];

  const kpis = [
    { id: 'leads', label: 'Leads / Bookings' },
    { id: 'spend', label: 'Spend' },
    { id: 'cpl', label: 'CPL / CPA' },
    { id: 'roas', label: 'ROAS' },
    { id: 'work_completed', label: 'Work Completed' },
  ];

  const toggleSection = (sectionId: string) => {
    const currentSections = layout.sections || [];
    if (currentSections.includes(sectionId)) {
      setLayout({
        ...layout,
        sections: currentSections.filter((id: string) => id !== sectionId),
      });
    } else {
      setLayout({
        ...layout,
        sections: [...currentSections, sectionId],
      });
    }
  };

  const toggleKpi = (kpiId: string) => {
    const currentKpis = layout.kpis || [];
    if (currentKpis.includes(kpiId)) {
      setLayout({
        ...layout,
        kpis: currentKpis.filter((id: string) => id !== kpiId),
      });
    } else {
      setLayout({
        ...layout,
        kpis: [...currentKpis, kpiId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light text-primary mb-2">Dashboard Layout</h2>
        <p className="text-sm text-secondary">
          Control which sections and KPIs appear on the client dashboard.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-primary mb-4">Sections</h3>
        <div className="space-y-2">
          {sections.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-3 p-3 glass-surface rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(layout.sections || []).includes(section.id)}
                onChange={() => toggleSection(section.id)}
                className="w-4 h-4"
              />
              <span className="text-sm text-primary">{section.label}</span>
            </label>
          ))}
        </div>
      </div>

      {(layout.sections || []).includes('kpis') && (
        <div>
          <h3 className="text-lg font-medium text-primary mb-4">KPIs to Show</h3>
          <div className="space-y-2">
            {kpis.map((kpi) => (
              <label
                key={kpi.id}
                className="flex items-center gap-3 p-3 glass-surface rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(layout.kpis || []).includes(kpi.id)}
                  onChange={() => toggleKpi(kpi.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-primary">{kpi.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Preview Tab Component
function PreviewTab({ orgId }: { orgId: string }) {
  // Convert Supabase UUID to Clerk org ID if needed
  // For now, we'll use the orgId as-is and let the dashboard page handle the conversion
  const previewUrl = `/${orgId}/dashboard?mode=client`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-light text-primary mb-2">Preview Client Portal</h2>
        <p className="text-sm text-secondary">
          This is exactly how the client will see their dashboard, including the sidebar and all configured sections.
        </p>
      </div>

      <div className="glass-surface rounded-lg shadow-prestige-soft overflow-hidden border border-white/5">
        <div className="p-4 glass-border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>Preview Mode</span>
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="px-3 py-1 glass-surface text-primary rounded hover:bg-white/10 transition-all flex items-center gap-1 text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              Open in New Tab
            </button>
          </div>
        </div>
        <div className="relative" style={{ height: '800px', minHeight: '800px' }}>
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '800px',
            }}
            title="Client Portal Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
