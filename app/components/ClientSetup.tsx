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
  Phone,
  MessageSquare,
  Users,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getClientPortalConfig,
  updateClientPortalConfig,
  getAllOnboardingItems,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
} from '@/app/actions/client-portal';
import OnboardingFlowBuilder from './OnboardingFlowBuilder';

interface ClientSetupProps {
  orgId: string; // Supabase UUID
  orgName: string;
  initialTab?: string;
  clerkOrgId?: string; // Clerk org ID for routing
}

type Tab = 'onboarding' | 'services' | 'preview';

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
    id: 'ai_receptionist', 
    label: 'AI Receptionist & Call Handling', 
    badge: 'AI Phone',
    defaultPlatforms: ['Phone System', 'Calendar Integration', 'CRM'],
    defaultGoal: 'leads',
    defaultKPIs: ['calls_answered', 'appointments_booked', 'leads'],
    description: '24/7 AI-powered phone answering, appointment booking, lead qualification, and call routing',
    bestFor: 'Service businesses, clinics, real estate, sales teams',
  },
  { 
    id: 'ai_chatbot', 
    label: 'AI Chatbot (Website, SMS & Social)', 
    badge: 'AI Chat',
    defaultPlatforms: ['Website', 'SMS', 'WhatsApp', 'Instagram'],
    defaultGoal: 'leads',
    defaultKPIs: ['conversations', 'leads', 'response_time'],
    description: 'Website chat automation, SMS/WhatsApp/Instagram DM integration, FAQ handling, lead capture',
    bestFor: 'Businesses handling high inbound inquiries',
  },
  { 
    id: 'ai_lead_gen', 
    label: 'AI Lead Generation & Qualification System', 
    badge: 'AI Leads',
    defaultPlatforms: ['Ad Platforms', 'CRM', 'Website'],
    defaultGoal: 'leads',
    defaultKPIs: ['leads', 'qualified_leads', 'conversion_rate'],
    description: 'Automated lead capture, AI-based scoring and tagging, real-time routing, smart qualification',
    bestFor: 'Sales-driven businesses and agencies',
  },
  { 
    id: 'ai_followup', 
    label: 'AI Follow-Up & Nurture Automation', 
    badge: 'AI Follow-Up',
    defaultPlatforms: ['Email', 'SMS', 'CRM'],
    defaultGoal: 'leads',
    defaultKPIs: ['engagement_rate', 'appointments_confirmed', 'reengagement'],
    description: 'Automated SMS/email sequences, intelligent follow-ups, appointment reminders, re-engagement campaigns',
    bestFor: 'Businesses losing leads due to slow or inconsistent follow-up',
  },
  { 
    id: 'ai_ad_creative', 
    label: 'AI Ad Creative & Campaign Automation', 
    badge: 'AI Ads',
    defaultPlatforms: ['Meta Ads', 'Google Ads', 'TikTok Ads'],
    defaultGoal: 'leads',
    defaultKPIs: ['spend', 'cpl', 'roas', 'creative_performance'],
    description: 'AI-generated ad copy, images, and videos, platform optimization, creative testing, budget optimization',
    bestFor: 'Businesses running paid advertising at scale',
  },
  { 
    id: 'reporting', 
    label: 'Reporting Only', 
    badge: 'Reports',
    defaultPlatforms: ['Analytics'],
    defaultGoal: 'insights',
    defaultKPIs: ['overview'],
    description: 'Show performance reports and analytics without managing campaigns',
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

export default function ClientSetup({ orgId, orgName, initialTab = 'onboarding', clerkOrgId }: ClientSetupProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || 'onboarding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<any>(null);
  const [services, setServices] = useState<Record<string, any>>({});
  const [dashboardLayout, setDashboardLayout] = useState<any>({
    sections: [], // Start empty - user must select
    kpis: ['leads', 'spend', 'roas'], // Auto-select key metrics by default
  });
  const [onboardingEnabled, setOnboardingEnabled] = useState(true);
  
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
        // Load saved layout, or use defaults if none exists
        const savedLayout = configResult.data.dashboard_layout;
        if (savedLayout && (savedLayout.sections || savedLayout.kpis)) {
          // Use saved layout
          setDashboardLayout({
            sections: savedLayout.sections || [],
            kpis: savedLayout.kpis || ['leads', 'spend', 'roas'],
          });
        } else {
          // Use defaults with auto-selected key metrics
          setDashboardLayout({
            sections: [],
            kpis: ['leads', 'spend', 'roas'],
          });
        }
        // Default to true if not explicitly set (for new clients or when not configured)
        const savedOnboardingEnabled = configResult.data.onboarding_enabled;
        setOnboardingEnabled(savedOnboardingEnabled !== undefined ? savedOnboardingEnabled : true);
      } else {
        // No config exists - default onboarding to true
        setOnboardingEnabled(true);
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
      // Ensure dashboard_layout has the correct structure
      const layoutToSave = {
        sections: dashboardLayout.sections || [],
        kpis: dashboardLayout.kpis || ['leads', 'spend', 'roas'],
      };

      const result = await updateClientPortalConfig(orgId, {
        services,
        dashboard_layout: layoutToSave,
        onboarding_enabled: onboardingEnabled,
      });
      if (result && !result.error) {
        // Show success - reload data to ensure sync
        await loadData();
        alert('Settings saved successfully! Changes will appear on the client dashboard.');
      } else {
        alert(result?.error?.message || 'Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const result = await updateClientPortalConfig(orgId, {
        services,
        dashboard_layout: dashboardLayout,
        onboarding_enabled: onboardingEnabled,
      });
      if (result && !result.error) {
        // Reload data and redirect to preview or dashboard
        await loadData();
        alert('Changes published successfully! The client dashboard has been updated.');
        // Optionally refresh the page or navigate
        router.refresh();
      } else {
        alert(result?.error || 'Failed to publish changes');
      }
    } catch (error) {
      console.error('Error publishing config:', error);
      alert('Failed to publish changes');
    } finally {
      setSaving(false);
    }
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
    const hasOnboarding = onboardingEnabled; // Just check if enabled, flow builder handles the rest
    const hasDashboardConfig = dashboardLayout?.sections?.length > 0;

    const checks = [];
    if (enabledServices === 0) checks.push('Services not selected');
    if (!hasOnboarding) checks.push('Onboarding not enabled');
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
    { id: 'onboarding' as Tab, label: 'Onboarding', step: 1 },
    { id: 'services' as Tab, label: 'Services & Dashboard', step: 2 },
    { id: 'preview' as Tab, label: 'Preview', step: 3 },
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
        {activeTab === 'onboarding' && (
          <OnboardingTab
            clerkOrgId={clerkOrgId}
            orgId={orgId}
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

        {activeTab === 'services' && (
          <div className="space-y-8">
            <ServicesTab
              services={services}
              setServices={setServices}
              expandedServices={expandedServices}
              setExpandedServices={setExpandedServices}
            />
            <div className="border-t border-white/10 pt-8">
              <DashboardBuilderTab
                layout={dashboardLayout}
                setLayout={setDashboardLayout}
              />
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <PreviewTab orgId={clerkOrgId || orgId} />
        )}
      </div>
    </div>
  );
}

// Services Tab Component - Redesigned with 3 clear sections
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
  // Group services by category
  const coreServices = SERVICE_TYPES.filter(s => ['ads', 'seo', 'web', 'content', 'crm'].includes(s.id));
  const aiServices = SERVICE_TYPES.filter(s => s.id.startsWith('ai_'));
  const reportingServices = SERVICE_TYPES.filter(s => s.id === 'reporting');
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
    }
  };

  const isServiceEnabled = (serviceId: string) => {
    const service = services[serviceId];
    if (service === true) return true;
    if (typeof service === 'object') return service?.enabled === true;
    return false;
  };

  const renderServiceRow = (service: typeof SERVICE_TYPES[0]) => {
    const isEnabled = isServiceEnabled(service.id);
    
    return (
      <div
        key={service.id}
        className="flex items-center justify-between p-4 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all"
      >
        <div className="flex-1">
          <h3 className="text-sm font-medium text-primary mb-1">{service.label}</h3>
          {service.description && (
            <p className="text-xs text-secondary leading-relaxed">{service.description}</p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => toggleService(service.id)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent/30"></div>
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Engagement Scope */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-light text-primary mb-2">1. What Services Are You Providing?</h2>
          <p className="text-sm text-secondary">
            Turn on the services you're managing for this client. This determines what appears on their dashboard.
          </p>
        </div>

        {/* Core Services */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary mb-3">Core Services</h3>
          <div className="space-y-2">
            {coreServices.map(renderServiceRow)}
          </div>
        </div>

        {/* Automation & AI (Optional) */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary mb-3">Automation & AI (Optional)</h3>
          <div className="space-y-2">
            {aiServices.map(renderServiceRow)}
          </div>
        </div>

        {/* Reporting Only */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Reporting Only</h3>
          <p className="text-xs text-secondary mb-3">For clients who only need to see reports and analytics</p>
          <div className="space-y-2">
            {reportingServices.map(renderServiceRow)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Onboarding Tab Component - Embedded Flow Builder
function OnboardingTab({
  onboardingEnabled,
  setOnboardingEnabled,
  clerkOrgId,
  orgId,
  // Legacy props - kept for backwards compatibility but not used
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
  clerkOrgId?: string;
  orgId?: string;
  items?: any[];
  onAdd?: (item: any) => Promise<void>;
  onUpdate?: (itemId: string, updates: any) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  editingItem?: any;
  setEditingItem?: (item: any) => void;
  showItemForm?: boolean;
  setShowItemForm?: (show: boolean) => void;
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

      {onboardingEnabled && orgId && clerkOrgId ? (
        <div className="glass-surface rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
          <OnboardingFlowBuilder
            orgId={orgId}
            clerkOrgId={clerkOrgId}
            orgName=""
            embedded={true}
          />
        </div>
      ) : onboardingEnabled && !orgId ? (
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-sm text-secondary">
            Loading flow builder...
          </p>
        </div>
      ) : null}
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

// Dashboard Builder Tab Component - Redesigned as drag-and-order list
function DashboardBuilderTab({
  layout,
  setLayout,
}: {
  layout: any;
  setLayout: (layout: any) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const allBlocks = [
    { id: 'kpis', label: 'Executive Summary (KPIs)', description: 'Key performance indicators at a glance' },
    { id: 'deliverables', label: 'Deliverables Feed', description: 'Recent work completed and shared' },
    { id: 'roadmap', label: 'Roadmap / Next Steps', description: 'Upcoming work and milestones' },
    { id: 'reports', label: 'Reports', description: 'Performance reports and analytics' },
    { id: 'updates', label: 'Recent Updates', description: 'Latest activity and changes' },
  ];
  
  const currentSections = layout.sections || [];
  
  // Get ordered blocks (enabled first, then disabled)
  const orderedBlocks = [
    ...allBlocks.filter(b => currentSections.includes(b.id)),
    ...allBlocks.filter(b => !currentSections.includes(b.id))
  ];

  const kpis = [
    { id: 'leads', label: 'Leads / Bookings' },
    { id: 'spend', label: 'Spend' },
    { id: 'cpl', label: 'CPL / CPA' },
    { id: 'roas', label: 'ROAS' },
    { id: 'work_completed', label: 'Work Completed' },
  ];

  const toggleBlock = (blockId: string) => {
    const currentSections = layout.sections || [];
    if (currentSections.includes(blockId)) {
      setLayout({
        ...layout,
        sections: currentSections.filter((id: string) => id !== blockId),
      });
    } else {
      setLayout({
        ...layout,
        sections: [...currentSections, blockId],
      });
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const enabledBlocks = orderedBlocks.filter(b => currentSections.includes(b.id));
    const disabledBlocks = orderedBlocks.filter(b => !currentSections.includes(b.id));
    
    // Only allow reordering enabled blocks
    if (fromIndex < enabledBlocks.length && toIndex < enabledBlocks.length) {
      const newEnabled = [...enabledBlocks];
      const [moved] = newEnabled.splice(fromIndex, 1);
      newEnabled.splice(toIndex, 0, moved);
      setLayout({
        ...layout,
        sections: newEnabled.map(b => b.id),
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 2: Dashboard Builder */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-light text-primary mb-2">2. What Should the Client See?</h2>
          <p className="text-sm text-secondary">
            Choose which sections appear on the client dashboard and drag to reorder them.
          </p>
        </div>

        <div className="space-y-2">
          {orderedBlocks.map((block, index) => {
            const isEnabled = currentSections.includes(block.id);
            const enabledIndex = currentSections.indexOf(block.id);
            const canMoveUp = isEnabled && enabledIndex > 0;
            const canMoveDown = isEnabled && enabledIndex < currentSections.length - 1;
            
            return (
              <div
                key={block.id}
                className={`flex items-center gap-3 p-4 glass-surface rounded-lg border transition-all ${
                  isEnabled 
                    ? 'border-accent/30 bg-accent/5' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Drag Handle (only for enabled blocks) */}
                {isEnabled && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveBlock(enabledIndex, enabledIndex - 1)}
                      disabled={!canMoveUp}
                      className="text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBlock(enabledIndex, enabledIndex + 1)}
                      disabled={!canMoveDown}
                      className="text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}
                {!isEnabled && <div className="w-6 flex-shrink-0" />}
                
                {/* Checkbox */}
                <label className="flex items-center cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleBlock(block.id)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:border-accent peer-checked:bg-accent/20 flex items-center justify-center transition-all mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-accent opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary">{block.label}</div>
                    <div className="text-xs text-secondary">{block.description}</div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Data Source Mapping (Advanced, Collapsible) */}
      <div className="border-t border-white/10 pt-8">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full mb-4 hover:opacity-80 transition-opacity"
        >
          <div className="text-left">
            <h2 className="text-xl font-light text-primary mb-1">3. Advanced Settings (Optional)</h2>
            <p className="text-sm text-secondary">
              Data sources, automation, and technical configuration
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvanced && (
          <div className="space-y-4 glass-surface rounded-lg p-6 border border-white/5">
            <p className="text-sm text-secondary mb-4">
              These settings are for advanced users. Most agencies don't need to change these.
            </p>
            <div className="space-y-3">
              <div className="p-3 glass-surface rounded border border-white/5">
                <div className="text-sm font-medium text-primary mb-1">Metric Sources</div>
                <div className="text-xs text-secondary">How data is collected (manual entry, API connections, or automated)</div>
              </div>
              <div className="p-3 glass-surface rounded border border-white/5">
                <div className="text-sm font-medium text-primary mb-1">Update Frequency</div>
                <div className="text-xs text-secondary">How often metrics update (weekly, monthly, or real-time)</div>
              </div>
              <div className="p-3 glass-surface rounded border border-white/5">
                <div className="text-sm font-medium text-primary mb-1">Automation Hooks</div>
                <div className="text-xs text-secondary">Connect external tools and workflows (coming soon)</div>
              </div>
            </div>
          </div>
        )}
      </div>
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
