'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  CheckCircle2,
  Layout,
  Save,
  Plus,
  Trash2,
  GripVertical,
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
  ArrowRight,
  FileCheck,
  BarChart3,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import {
  getClientPortalConfig,
  updateClientPortalConfig,
  getAllOnboardingItems,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
} from '@/app/actions/client-portal';
import { getOnboardingFlowDraft } from '@/app/actions/onboarding';
import { checkNodeCompletion } from '@/app/lib/onboarding-node-validation';
import OnboardingFlowBuilder from './OnboardingFlowBuilder';
import OnboardingTemplateModal from './OnboardingTemplateModal';
import { buildDefaultDashboard } from '@/app/lib/dashboard-templates';

interface ClientSetupProps {
  orgId: string; // Supabase UUID
  orgName: string;
  initialTab?: string;
  clerkOrgId?: string; // Clerk org ID for routing
}

type Tab = 'onboarding' | 'services' | 'dashboard';
type ActiveTab = Tab | null;

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

export default function ClientSetup({ orgId, orgName, initialTab = 'onboarding', clerkOrgId }: ClientSetupProps) {
  const router = useRouter();
  // Map 'dashboard' tab to 'services' since dashboard is part of services card
  const mappedTab = initialTab === 'dashboard' ? 'services' : initialTab;
  const [activeTab, setActiveTab] = useState<ActiveTab>((mappedTab as Tab) || 'onboarding');
  const [loading, setLoading] = useState(true); // Start as true to show loading initially
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Config state
  const [config, setConfig] = useState<any>(null);
  const [services, setServices] = useState<Record<string, any>>({});
  const [dashboardLayout, setDashboardLayout] = useState<any>({
    sections: [],
    kpis: ['leads', 'spend', 'roas'],
  });
  const [onboardingEnabled, setOnboardingEnabled] = useState(true);
  
  // Onboarding items state
  const [onboardingItems, setOnboardingItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [onboardingNodesComplete, setOnboardingNodesComplete] = useState(false);

  // Expanded service cards
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configResult, itemsResult, flowResult] = await Promise.all([
        getClientPortalConfig(orgId),
        getAllOnboardingItems(orgId),
        getOnboardingFlowDraft(orgId).catch(() => ({ data: null })),
      ]);

      if (configResult.data) {
        setConfig(configResult.data);
        const loadedServices = configResult.data.services || {};
        setServices(loadedServices);
        const savedLayout = configResult.data.dashboard_layout;
        if (savedLayout && (savedLayout.sections || savedLayout.kpis)) {
          setDashboardLayout({
            sections: savedLayout.sections || [],
            kpis: savedLayout.kpis || ['leads', 'spend', 'roas'],
          });
        } else {
          setDashboardLayout({
            sections: [],
            kpis: ['leads', 'spend', 'roas'],
          });
        }
        const savedOnboardingEnabled = configResult.data.onboarding_enabled;
        const finalOnboardingEnabled = savedOnboardingEnabled !== undefined ? savedOnboardingEnabled : true;
        setOnboardingEnabled(finalOnboardingEnabled);
      } else {
        setOnboardingEnabled(true);
      }

      if (itemsResult && 'data' in itemsResult && itemsResult.data) {
        setOnboardingItems(itemsResult.data);
      }
      
      // Determine final onboarding enabled state for node completion check
      const finalOnboardingEnabled = configResult.data?.onboarding_enabled !== undefined 
        ? configResult.data.onboarding_enabled 
        : true;
      
      // Check if all onboarding nodes are complete
      if (flowResult.data && flowResult.data.nodes && flowResult.data.nodes.length > 0) {
        const allComplete = flowResult.data.nodes.every((node: any) => {
          const completion = checkNodeCompletion(
            node.type,
            node.config || {},
            node.title || node.label
          );
          return completion.isComplete;
        });
        setOnboardingNodesComplete(allComplete);
      } else {
        // If no flow or no nodes, consider it complete (or incomplete if onboarding is enabled but no flow)
        setOnboardingNodesComplete(!finalOnboardingEnabled);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]); // Only depend on orgId to prevent re-render loops

  useEffect(() => {
    loadData();
  }, [orgId, loadData]); // Removed loading from deps to prevent loop

  // Auto-save debounced
  useEffect(() => {
    if (!autoSaveEnabled || loading) return;
    
    const timeoutId = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [services, dashboardLayout, onboardingEnabled, autoSaveEnabled, loading]);

  const handleAutoSave = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      // Auto-build dashboard based on selected services
      const enabledServices = Object.keys(services).filter(id => services[id]);
      let layoutToSave;
      
      if (enabledServices.length > 0) {
        // Build intelligent dashboard based on services
        layoutToSave = buildDefaultDashboard(services, true);
        setDashboardLayout(layoutToSave);
      } else {
        // Use existing layout or default
        layoutToSave = {
          sections: dashboardLayout.sections || [],
          kpis: dashboardLayout.kpis || ['leads', 'spend', 'roas'],
        };
      }

      const result = await updateClientPortalConfig(orgId, {
        services,
        dashboard_layout: layoutToSave,
        onboarding_enabled: onboardingEnabled,
      });
      
      if (result && !result.error) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
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
  const getSetupStatus = useCallback(() => {
    const enabledServices = Object.values(services).filter((s: any) => s === true || (typeof s === 'object' && s.enabled)).length;
    const hasDashboardConfig = dashboardLayout?.sections?.length > 0;
    // Onboarding is complete ONLY if enabled AND all nodes are complete (not just enabled)
    const onboardingComplete = onboardingEnabled && onboardingNodesComplete;

    // Order: Services → Dashboard → Onboarding
    const checks = [
      { id: 'services', label: 'Services selected', complete: enabledServices > 0, action: () => setActiveTab('services') },
      { id: 'dashboard', label: 'Dashboard customized', complete: hasDashboardConfig, action: () => setActiveTab('services') },
      { id: 'onboarding', label: 'Onboarding completed', complete: onboardingComplete, action: () => setActiveTab('onboarding') },
    ];

    return {
      isComplete: checks.every(c => c.complete),
      checks,
      progress: Math.round((checks.filter(c => c.complete).length / checks.length) * 100),
    };
  }, [services, dashboardLayout, onboardingEnabled, onboardingNodesComplete, setActiveTab]);

  // Memoize computed values - MUST be called before any conditional returns
  const setupStatus = useMemo(() => getSetupStatus(), [getSetupStatus]);
  const enabledServices = useMemo(() => 
    Object.values(services).filter((s: any) => s === true || (typeof s === 'object' && s.enabled)).length,
    [services]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-panel p-8 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
            <div className="text-secondary">Loading setup...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary mb-1">Client Setup</h1>
          <p className="text-secondary text-sm">{orgName}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-secondary">
            {lastSaved && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
              )}
            {saving && (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          <button
            onClick={handleAutoSave}
            disabled={saving}
            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
      </div>
      </div>

      {/* Main Content - Improved Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column - Main Setup Cards */}
        <div className="lg:col-span-3 space-y-4">
          {/* Onboarding Card */}
          <SetupCard
            title="Onboarding"
            description="Configure the first-login experience for this client"
            isComplete={onboardingEnabled && onboardingNodesComplete}
            isActive={activeTab === 'onboarding'}
            onActivate={() => setActiveTab(activeTab === 'onboarding' ? null : 'onboarding')}
          >
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
          </SetupCard>

          {/* Services & Dashboard Card */}
          <SetupCard
            title="Services & Dashboard"
            description="Select services and edit dashboard layout"
            isComplete={enabledServices > 0 && dashboardLayout?.sections?.length > 0}
            isActive={activeTab === 'services'}
            onActivate={() => setActiveTab(activeTab === 'services' ? null : 'services')}
          >
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
                services={services}
              />
            </div>
          </div>
        )}
          </SetupCard>

        </div>

        {/* Right Column - Setup Status & Summary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Setup Status */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {setupStatus.isComplete ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-primary">Complete</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-primary">Incomplete</span>
                  </>
                )}
              </div>
              <span className="text-xs text-secondary">{setupStatus.progress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
              <div 
                className="h-full bg-accent/50 transition-all duration-300"
                style={{ width: `${setupStatus.progress}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              {setupStatus.checks.map((check) => (
                <button
                  key={check.id}
                  onClick={check.action}
                  className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-all text-left group"
                >
                  {check.complete ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs flex-1 ${check.complete ? 'text-secondary line-through' : 'text-primary'}`}>
                    {check.label}
                  </span>
                  {!check.complete && (
                    <ArrowRight className="w-3 h-3 text-muted group-hover:text-accent transition-colors opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Client View Summary */}
          <ClientViewSummary
            orgName={orgName}
            onboardingEnabled={onboardingEnabled}
            enabledServices={enabledServices}
            dashboardSections={dashboardLayout?.sections || []}
          />
        </div>
      </div>
    </div>
  );
}

// Setup Card Component
function SetupCard({
  title,
  description,
  isComplete,
  isActive,
  onActivate,
  children,
}: {
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={onActivate}
        className={`w-full p-5 flex items-start justify-between hover:bg-white/4 transition-all ${
          isActive ? 'bg-white/4' : ''
        }`}
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h2 className="text-lg font-medium text-primary">{title}</h2>
            {isComplete && (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-secondary leading-relaxed">{description}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-secondary transition-transform flex-shrink-0 ${isActive ? 'rotate-90' : ''}`} />
      </button>
      
      {isActive && (
        <div className="p-5 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}

// Client View Summary Component
function ClientViewSummary({
  orgName,
  onboardingEnabled,
  enabledServices,
  dashboardSections,
}: {
  orgName: string;
  onboardingEnabled: boolean;
  enabledServices: number;
  dashboardSections: string[];
}) {
  return (
    <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border border-white/5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-primary">Client View Summary</h3>
      </div>

      <div className="space-y-4">
        {/* Onboarding */}
        <div className="p-3 glass-surface rounded-lg border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-[#4C8DFF]" />
            <span className="text-sm font-medium text-primary">Onboarding</span>
          </div>
          <p className="text-xs text-secondary">
            {onboardingEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        {/* Services */}
        <div className="p-3 glass-surface rounded-lg border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-[#4C8DFF]" />
            <span className="text-sm font-medium text-primary">Services</span>
          </div>
          <p className="text-xs text-secondary">
            {enabledServices > 0 ? `${enabledServices} service${enabledServices !== 1 ? 's' : ''} enabled` : 'No services selected'}
          </p>
        </div>

        {/* Dashboard Modules */}
        <div className="p-3 glass-surface rounded-lg border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#4C8DFF]" />
            <span className="text-sm font-medium text-primary">Dashboard Modules</span>
          </div>
          <p className="text-xs text-secondary mb-2">
            {dashboardSections.length > 0 ? `${dashboardSections.length} module${dashboardSections.length !== 1 ? 's' : ''}` : 'No modules configured'}
          </p>
          {dashboardSections.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dashboardSections.slice(0, 3).map((section) => (
                <span
                  key={section}
                  className="px-2 py-0.5 text-xs glass-surface rounded border border-white/5 text-secondary"
                >
                  {section}
                </span>
              ))}
              {dashboardSections.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-muted">
                  +{dashboardSections.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

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
  const coreServices = SERVICE_TYPES.filter(s => ['ads', 'seo', 'web', 'content', 'crm'].includes(s.id));
  const aiServices = SERVICE_TYPES.filter(s => s.id.startsWith('ai_'));
  const reportingServices = SERVICE_TYPES.filter(s => s.id === 'reporting');
  
  const toggleService = (serviceId: string) => {
    const service = SERVICE_TYPES.find(s => s.id === serviceId);
    const isEnabled = services[serviceId] === true || (typeof services[serviceId] === 'object' && services[serviceId]?.enabled);
    
    if (isEnabled) {
      const newServices = { ...services };
      if (typeof newServices[serviceId] === 'object') {
        newServices[serviceId] = { ...newServices[serviceId], enabled: false };
      } else {
        delete newServices[serviceId];
      }
      setServices(newServices);
    } else {
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
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-light text-primary mb-2">What Services Are You Providing?</h2>
          <p className="text-sm text-secondary">
            Turn on the services you're managing for this client. This determines what appears on their dashboard.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary mb-3">Core Services</h3>
          <div className="space-y-2">
            {coreServices.map(renderServiceRow)}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-primary mb-3">Automation & AI (Optional)</h3>
          <div className="space-y-2">
            {aiServices.map(renderServiceRow)}
          </div>
        </div>

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
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const handleStartFromScratch = async () => {
    if (!clerkOrgId) {
      alert('Organization ID is missing. Please refresh the page.');
      return;
    }
    
    try {
      // Initialize empty flow
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: null }),
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingEnabled(true);
        // Reload page to show the flow builder
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to initialize flow: ${errorData.error || 'Unknown error'}. Please try again.`);
        throw new Error(errorData.error || 'Failed to initialize flow');
      }
    } catch (error) {
      console.error('Error initializing flow:', error);
      alert(`Failed to initialize flow: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    if (!clerkOrgId) {
      alert('Organization ID is missing. Please refresh the page.');
      return;
    }
    
    try {
      // Initialize flow with template
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingEnabled(true);
        // Reload page to show the flow builder
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to initialize flow: ${errorData.error || 'Unknown error'}. Please try again.`);
        throw new Error(errorData.error || 'Failed to initialize flow');
      }
    } catch (error) {
      console.error('Error initializing flow:', error);
      alert(`Failed to initialize flow: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      throw error; // Re-throw so modal can handle it
    }
  };

  // If onboarding is OFF, show CTA
  if (!onboardingEnabled) {
    return (
      <>
        <div className="py-12 text-center">
          <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <FileCheck className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">Enable Onboarding for This Client</h3>
          <p className="text-sm text-secondary mb-6 max-w-md mx-auto">
            Create a guided first-login experience with custom steps, document uploads, and contract signing.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Start Setup
            </button>
          </div>
        </div>
        <OnboardingTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={handleSelectTemplate}
          onStartFromScratch={handleStartFromScratch}
        />
      </>
    );
  }

  // If onboarding is ON, show builder immediately
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
          <h2 className="text-xl font-light text-primary mb-2">Onboarding Flow</h2>
          <p className="text-sm text-secondary">
            Configure the first-login experience for this client. Steps will appear until completed.
          </p>
        </div>
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

      {orgId && clerkOrgId ? (
        <div className="glass-surface rounded-lg overflow-hidden border border-white/5" style={{ height: 'calc(100vh - 500px)', minHeight: '600px' }}>
          <OnboardingFlowBuilder
            orgId={orgId}
            clerkOrgId={clerkOrgId}
            orgName=""
            embedded={true}
          />
        </div>
      ) : (
        <div className="glass-surface rounded-lg p-8 text-center">
          <p className="text-sm text-secondary">Loading flow builder...</p>
        </div>
      )}
    </div>
  );
}

// Dashboard Builder Tab Component
function DashboardBuilderTab({
  layout,
  setLayout,
  services,
}: {
  layout: any;
  setLayout: (layout: any) => void;
  services: Record<string, boolean>;
}) {
  const enabledServices = Object.keys(services).filter(id => services[id]);
  
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
  
  const currentSections = layout?.sections || [];
  const currentKpis = layout?.kpis || [];
  
  // Auto-build dashboard whenever services change (only if no manual customization)
  useEffect(() => {
    if (enabledServices.length > 0 && currentSections.length === 0) {
      const newLayout = buildDefaultDashboard(services, true);
      setLayout(newLayout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const removeSection = (sectionId: string) => {
    const newSections = currentSections.filter((s: string) => s !== sectionId);
    setLayout({
      ...layout,
      sections: newSections,
    });
  };

  const removeKpi = (kpiId: string) => {
    const newKpis = currentKpis.filter((k: string) => k !== kpiId);
    setLayout({
      ...layout,
      kpis: newKpis,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-primary mb-2">Dashboard Configuration</h2>
        <p className="text-sm text-secondary">
          Customize which sections and metrics appear on the client dashboard. Remove sections you don't need.
        </p>
      </div>
      
      {/* Dashboard Sections */}
      <div>
        <h3 className="text-sm font-medium text-primary mb-3">Dashboard Sections</h3>
        <div className="space-y-2">
          {currentSections.map((sectionId: string) => {
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
                  onClick={() => removeSection(sectionId)}
                  className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {currentSections.length === 0 && (
            <div className="text-sm text-secondary p-4 glass-surface rounded-lg border border-white/5 text-center">
              No sections configured. Select services above to auto-build dashboard.
            </div>
          )}
        </div>
      </div>

      {/* KPIs / Metrics */}
      {currentSections.includes('kpis') && (
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Metrics / KPIs</h3>
          <div className="space-y-2">
            {currentKpis.map((kpiId: string) => {
              const kpiLabel = kpisMap[kpiId];
              if (!kpiLabel) return null;
              
              return (
                <div
                  key={kpiId}
                  className="flex items-center justify-between p-3 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="text-sm text-primary">{kpiLabel}</div>
                  <button
                    onClick={() => removeKpi(kpiId)}
                    className="ml-4 p-2 glass-surface rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove metric"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {currentKpis.length === 0 && (
              <div className="text-sm text-secondary p-3 glass-surface rounded-lg border border-white/5 text-center">
                No metrics configured.
              </div>
            )}
          </div>
        </div>
      )}
      
      {enabledServices.length > 0 && (
        <div className="glass-surface rounded-lg p-4 border border-white/5">
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">Selected Services</p>
          <div className="flex flex-wrap gap-2">
            {enabledServices.map((serviceId) => {
              const service = SERVICE_TYPES.find(s => s.id === serviceId);
              return service ? (
                <span key={serviceId} className="px-3 py-1 text-xs glass-surface rounded border border-white/5 text-secondary">
                  {service.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

