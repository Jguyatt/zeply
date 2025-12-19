'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  CheckCircle2,
  Plus,
  FileText,
  Image as ImageIcon,
  Globe,
  Zap,
  Settings,
  Calendar,
  MessageSquare,
  Download,
  ExternalLink,
  Layout,
  X,
  Megaphone,
  Clock,
  AlertCircle,
  Briefcase,
  Search,
  Sparkles,
  Send,
  Phone,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { createDeliverable } from '@/app/actions/deliverables';
import NewDeliverableModal from './NewDeliverableModal';
import DashboardEditModal from './DashboardEditModal';
import CreateUpdateModal from './CreateUpdateModal';
import AddRoadmapItemModal from './AddRoadmapItemModal';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  due_date?: string;
  description?: string;
  created_at: string;
  client_visible?: boolean;
  deliverable_assets?: any[];
  deliverable_comments?: any[];
}

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  timeframe: 'this_week' | 'next_week' | 'blocker';
  order_index: number;
}

interface WeeklyUpdate {
  id: string;
  title: string;
  what_we_did: string;
  results?: string;
  next_steps?: string;
  published_at: string;
}

interface PortalSettings {
  enabled_sections: {
    executive_summary?: boolean;
    deliverables?: boolean;
    roadmap?: boolean;
    reports?: boolean;
    updates?: boolean;
  };
  metrics_config: {
    leads?: boolean;
    spend?: boolean;
    cpl?: boolean;
    roas?: boolean;
    work_completed?: boolean;
  };
  executive_summary_text?: string;
  confidence_note?: string;
}

interface ClientDashboardProps {
  orgId: string;
  orgName: string;
  isAgencyMode: boolean;
  isClientMode: boolean;
  deliverables: Deliverable[];
  roadmapItems: RoadmapItem[];
  weeklyUpdates: WeeklyUpdate[];
  portalSettings: PortalSettings | null;
  metrics: {
    leads: number;
    spend: number;
    cpl: number;
    roas: number;
    workCompleted: number;
  };
  userId: string;
  isPreviewMode?: boolean;
  recentMessages?: any[];
  dashboardLayout?: {
    sections?: string[];
    kpis?: string[];
    theme?: string;
  };
  onboardingEnabled?: boolean;
  onboardingStatus?: {
    status: 'not_setup' | 'waiting_for_client' | 'completed';
    hasPublishedFlow: boolean;
    hasNodes: boolean;
    allClientsOnboarded: boolean;
  };
  clerkOrgId?: string;
  services?: Record<string, any>;
}

export default function ClientDashboard({
  orgId,
  orgName,
  isAgencyMode,
  isClientMode,
  deliverables,
  roadmapItems,
  weeklyUpdates,
  portalSettings,
  metrics,
  userId,
  isPreviewMode = false,
  recentMessages = [],
  dashboardLayout,
  onboardingEnabled = false,
  onboardingStatus = { status: 'completed' as const, hasPublishedFlow: false, hasNodes: false, allClientsOnboarded: true },
  clerkOrgId,
  services = {},
}: ClientDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Extract org ID from pathname (could be Clerk org ID or UUID)
  const currentOrgId = pathname?.split('/')[1] || orgId;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateUpdate, setShowCreateUpdate] = useState(false);
  const [showAddRoadmap, setShowAddRoadmap] = useState(false);
  
  // CRITICAL: Members are locked to client view - they cannot switch to agency view
  // Only admins in the current org can switch between agency/client preview
  // If user is a member (isClientMode), they are locked to client view permanently
  const [viewMode, setViewMode] = useState<'client' | 'agency'>(
    isPreviewMode ? 'client' : (isAgencyMode ? 'agency' : 'client')
  );
  
  // Lock members to client view - they cannot switch
  // Only update viewMode if user is an admin (isAgencyMode === true)
  useEffect(() => {
    if (!isPreviewMode) {
      if (isAgencyMode) {
        // Admin can switch views
        setViewMode('agency');
      } else {
        // Member is locked to client view - cannot change
        setViewMode('client');
      }
    } else {
      // Preview mode always shows client view
      setViewMode('client');
    }
  }, [isAgencyMode, isPreviewMode]);
  
  // Enforce lock: if user is not an admin, force client view
  useEffect(() => {
    if (!isAgencyMode) {
      setViewMode('client');
    }
  }, [isAgencyMode]);
  const [showNewDeliverable, setShowNewDeliverable] = useState(false);

  // Default dashboard settings - always show at least basic sections
  const defaultSettings = {
    enabled_sections: {
      executive_summary: true,
      deliverables: true,
      roadmap: true,
      reports: false,
      updates: true,
    },
    metrics_config: {
      leads: true,
      spend: true,
      cpl: false,
      roas: false,
      work_completed: true,
    },
  };
  
  const settings = portalSettings || defaultSettings;
  
  // Ensure at least basic sections are enabled (never show blank state)
  const effectiveSettings = {
    enabled_sections: {
      executive_summary: settings.enabled_sections?.executive_summary ?? defaultSettings.enabled_sections.executive_summary,
      deliverables: settings.enabled_sections?.deliverables ?? defaultSettings.enabled_sections.deliverables,
      roadmap: settings.enabled_sections?.roadmap ?? defaultSettings.enabled_sections.roadmap,
      reports: settings.enabled_sections?.reports ?? defaultSettings.enabled_sections.reports,
      updates: settings.enabled_sections?.updates ?? defaultSettings.enabled_sections.updates,
    },
    metrics_config: {
      leads: settings.metrics_config?.leads ?? defaultSettings.metrics_config.leads,
      spend: settings.metrics_config?.spend ?? defaultSettings.metrics_config.spend,
      cpl: settings.metrics_config?.cpl ?? defaultSettings.metrics_config.cpl,
      roas: settings.metrics_config?.roas ?? defaultSettings.metrics_config.roas,
      work_completed: settings.metrics_config?.work_completed ?? defaultSettings.metrics_config.work_completed,
    },
    executive_summary_text: (settings as any).executive_summary_text,
    confidence_note: (settings as any).confidence_note,
  };
  
  // Always show dashboard (hasAnySections is always true now)
  const hasAnySections = true;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_review':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Ad':
        return <Target className="w-4 h-4" />;
      case 'Creative':
        return <ImageIcon className="w-4 h-4" />;
      case 'SEO':
        return <Globe className="w-4 h-4" />;
      case 'Web':
        return <Globe className="w-4 h-4" />;
      case 'Automation':
        return <Zap className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Filter deliverables for client view - only show client-visible items
  const visibleDeliverables = isAgencyMode && viewMode === 'agency' 
    ? deliverables 
    : deliverables.filter((d: Deliverable) => d.client_visible !== false);

  // Sort deliverables: Awaiting approval first, then in progress, then delivered
  const sortedDeliverables = [...visibleDeliverables].sort((a: Deliverable, b: Deliverable) => {
    const statusOrder: Record<string, number> = {
      'in_review': 1,
      'awaiting_client': 1,
      'in_progress': 2,
      'delivered': 3,
      'approved': 3,
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  const thisWeekItems = roadmapItems.filter(item => item.timeframe === 'this_week');
  const nextWeekItems = roadmapItems.filter(item => item.timeframe === 'next_week');
  const blockers = roadmapItems.filter(item => item.timeframe === 'blocker');

  // Get theme from dashboard layout or default to 'sophisticated'
  const theme = dashboardLayout?.theme || 'sophisticated';

  // Helper function to render KPI cards
  const renderKPICards = () => {
    const kpiGridClass = (() => {
      if (currentTheme.kpiLayout === 'horizontal') {
        return `grid ${currentTheme.kpiGridCols} ${currentTheme.sectionSpacing}`;
      } else if (currentTheme.kpiLayout === 'vertical') {
        return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${currentTheme.sectionSpacing}`;
      } else if (currentTheme.kpiLayout === 'grid-wide') {
        return `grid md:grid-cols-3 lg:grid-cols-5 ${currentTheme.sectionSpacing}`;
      } else {
        return `grid ${currentTheme.kpiGridCols} ${currentTheme.sectionSpacing}`;
      }
    })();

    return (
      <div className={kpiGridClass}>
        {effectiveSettings.metrics_config.leads && (
          <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-xs text-secondary">This month</span>
            </div>
            {metrics.leads > 0 ? (
              <>
                <div className={`text-2xl ${currentTheme.heading} text-primary mb-1`}>{metrics.leads}</div>
                <div className="text-sm text-secondary">Leads / Bookings</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-muted mb-1">—</div>
                <div className="text-sm text-secondary flex items-center gap-1">
                  Leads / Bookings
                  {isAgencyMode && !isPreviewMode && (
                    <a href={`/${currentOrgId}/setup?tab=dashboard`} className="text-xs text-accent hover:underline">
                      (connect data)
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {effectiveSettings.metrics_config.spend && (
          <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-5 h-5 text-accent" />
              <span className="text-xs text-secondary">This month</span>
            </div>
            {metrics.spend > 0 ? (
              <>
                <div className={`text-2xl ${currentTheme.heading} text-primary mb-1`}>${metrics.spend.toLocaleString()}</div>
                <div className="text-sm text-secondary">Spend</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-muted mb-1">—</div>
                <div className="text-sm text-secondary flex items-center gap-1">
                  Spend
                  {isAgencyMode && !isPreviewMode && (
                    <a href={`/${currentOrgId}/setup?tab=dashboard`} className="text-xs text-accent hover:underline">
                      (connect Stripe/QBO)
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {effectiveSettings.metrics_config.cpl && (
          <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <Target className="w-5 h-5 text-accent" />
            </div>
            {metrics.cpl > 0 ? (
              <>
                <div className={`text-2xl ${currentTheme.heading} text-primary mb-1`}>${metrics.cpl}</div>
                <div className="text-sm text-secondary">CPL / CPA</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-muted mb-1">—</div>
                <div className="text-sm text-secondary flex items-center gap-1">
                  CPL / CPA
                  {isAgencyMode && !isPreviewMode && (
                    <a href={`/${currentOrgId}/setup?tab=dashboard`} className="text-xs text-accent hover:underline">
                      (connect ads)
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {effectiveSettings.metrics_config.roas && (
          <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            {metrics.roas > 0 ? (
              <>
                <div className={`text-2xl ${currentTheme.heading} text-primary mb-1`}>{metrics.roas}x</div>
                <div className="text-sm text-secondary">ROAS</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-muted mb-1">—</div>
                <div className="text-sm text-secondary flex items-center gap-1">
                  ROAS
                  {isAgencyMode && !isPreviewMode && (
                    <a href={`/${currentOrgId}/setup?tab=dashboard`} className="text-xs text-accent hover:underline">
                      (connect ads)
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {effectiveSettings.metrics_config.work_completed && (
          <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <span className="text-xs text-secondary">This month</span>
            </div>
            <div className={`text-2xl ${currentTheme.heading} text-primary mb-1`}>{metrics.workCompleted}</div>
            <div className="text-sm text-secondary">Work Completed</div>
          </div>
        )}
      </div>
    );
  };
  
  
  // Theme-based CSS classes and layout configurations - completely different layouts
  const themeClasses = {
    classic: {
      container: 'theme-classic',
      heading: 'font-serif font-bold',
      body: 'font-serif',
      card: 'rounded-lg',
      spacing: 'space-y-6',
      cardPadding: 'p-5',
      border: 'border border-white/10',
      // Classic: Traditional newspaper-style multi-column layout
      layout: 'newspaper', // 3-column with KPIs at top, content below
      kpiLayout: 'horizontal', // KPIs in a single row
      mainGridCols: 'lg:grid-cols-3',
      kpiGridCols: 'grid-cols-5', // All KPIs in one row
      leftColSpan: 'lg:col-span-2',
      rightColSpan: 'lg:col-span-1',
      sectionSpacing: 'gap-6',
      cardBg: 'glass-surface',
      cardShadow: 'shadow-prestige-soft',
    },
    sophisticated: {
      container: 'theme-sophisticated',
      heading: 'font-light tracking-tight',
      body: '',
      card: 'rounded-xl',
      spacing: 'space-y-8',
      cardPadding: 'p-6',
      border: 'border border-white/10',
      // Sophisticated: Elegant 2-column magazine layout
      layout: 'magazine', // 2-column with wide cards
      kpiLayout: 'grid-wide', // KPIs in a wider 3-column grid
      mainGridCols: 'lg:grid-cols-2',
      kpiGridCols: 'md:grid-cols-3 lg:grid-cols-5',
      leftColSpan: 'lg:col-span-1',
      rightColSpan: 'lg:col-span-1',
      sectionSpacing: 'gap-8',
      cardBg: 'glass-surface',
      cardShadow: 'shadow-prestige-soft',
    },
    modern: {
      container: 'theme-modern',
      heading: 'font-semibold tracking-tight',
      body: 'font-sans',
      card: 'rounded-2xl',
      spacing: 'space-y-6',
      cardPadding: 'p-5',
      border: 'border border-white/15',
      // Modern: Minimalist single-column layout
      layout: 'minimal', // Single column, everything stacked
      kpiLayout: 'vertical', // KPIs stacked vertically or compact grid
      mainGridCols: 'lg:grid-cols-1',
      kpiGridCols: 'md:grid-cols-2 lg:grid-cols-5',
      leftColSpan: 'lg:col-span-1',
      rightColSpan: 'lg:col-span-1',
      sectionSpacing: 'gap-4',
      cardBg: 'glass-surface',
      cardShadow: 'shadow-prestige-soft',
    },
    bold: {
      container: 'theme-bold',
      heading: 'font-black tracking-tighter',
      body: 'font-bold',
      card: 'rounded-lg',
      spacing: 'space-y-10',
      cardPadding: 'p-6',
      border: 'border-2 border-white/20',
      // Bold: Dynamic grid-heavy layout with maximum impact
      layout: 'grid-heavy', // 3-column with bold borders and spacing
      kpiLayout: 'grid-tight', // KPIs in a tight 2x3 grid
      mainGridCols: 'lg:grid-cols-3',
      kpiGridCols: 'md:grid-cols-3 lg:grid-cols-5',
      leftColSpan: 'lg:col-span-2',
      rightColSpan: 'lg:col-span-1',
      sectionSpacing: 'gap-8',
      cardBg: 'glass-surface',
      cardShadow: 'shadow-prestige',
    },
  };

  const currentTheme = themeClasses[theme as keyof typeof themeClasses] || themeClasses.sophisticated;

  return (
    <div className={`${currentTheme.spacing} ${currentTheme.container}`}>
      {/* Preview Mode Banner (only in preview, not real client mode) */}
      {isPreviewMode && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-yellow-500/50 mb-6">
          <p className="text-sm text-primary">
            <strong className="text-yellow-400">Preview Mode</strong> — This is how the client sees their dashboard
          </p>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className={`text-2xl ${currentTheme.heading} text-primary`}>{orgName}</h1>
            
            {/* Edit Dashboard button for admins */}
            {isAgencyMode && !isPreviewMode && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg glass-surface border border-white/10 text-primary hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit Dashboard
              </button>
            )}
          </div>
          {/* Client view: Show "Managed by Elvance" instead of "Client Workspace" */}
          {!isAgencyMode ? (
            <p className="text-xs text-muted">Managed by Elvance</p>
          ) : (
            <p className="text-xs text-secondary">Client Workspace</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Only show agency controls in agency mode, not preview, and only for admins */}
          {/* Members (isClientMode) cannot see or use these controls */}
          {isAgencyMode && !isPreviewMode && !isClientMode && viewMode === 'agency' && (
            <>
              <button
                onClick={() => setShowCreateUpdate(true)}
                className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium border border-white/10 glass-surface hover:bg-white/10 transition-all"
              >
                <Megaphone className="w-4 h-4" />
                Create Update
              </button>
              <button
                onClick={() => setShowNewDeliverable(true)}
                className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Deliverable
              </button>
            </>
          )}
        </div>
      </div>

      {/* Onboarding Status Indicator - Only show in agency mode if onboarding is enabled */}
      {isAgencyMode && onboardingEnabled && (
        <div 
          className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} p-4 border-l-4 mb-6 transition-all ${currentTheme.border} ${
            onboardingStatus.status === 'completed'
              ? 'border-green-500/50 bg-green-500/5 cursor-pointer hover:bg-green-500/10' 
              : onboardingStatus.status === 'waiting_for_client'
              ? 'border-yellow-500/50 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10'
              : 'border-orange-500/50 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10'
          }`}
          onClick={() => {
            // Navigate to onboarding setup/status page for all statuses
            const targetOrgId = clerkOrgId || pathname?.split('/')[2] || orgId;
            router.push(`/${targetOrgId}/setup?tab=onboarding`);
          }}
        >
          <div className="flex items-center gap-3">
            {onboardingStatus.status === 'completed' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Onboarding Completed</p>
                  <p className="text-xs text-muted">All client members have completed onboarding. Click to view details.</p>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary" />
              </>
            ) : onboardingStatus.status === 'waiting_for_client' ? (
              <>
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Waiting for Client to Complete Onboarding</p>
                  <p className="text-xs text-muted">Onboarding is published and set up. Waiting for client members to complete the steps.</p>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary" />
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Please Finish Setting Up Onboarding</p>
                  <p className="text-xs text-muted">Complete the onboarding flow setup. Click to continue.</p>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {effectiveSettings.enabled_sections.executive_summary && (
        <div className={currentTheme.spacing}>
          <h2 className={`text-lg ${currentTheme.heading} text-primary`}>Executive Summary</h2>
          
          {effectiveSettings.executive_summary_text && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border}`}>
              <p className={`text-primary leading-relaxed ${currentTheme.body}`}>{effectiveSettings.executive_summary_text}</p>
            </div>
          )}

          {/* Scope of Services */}
          {(() => {
            const enabledServices = Object.keys(services).filter(serviceId => {
              // Filter out "reporting" - it's not a service, just a view mode
              if (serviceId === 'reporting') return false;
              const service = services[serviceId];
              return service === true || (typeof service === 'object' && service?.enabled === true);
            });

            if (enabledServices.length > 0) {
              const serviceLabels: Record<string, string> = {
                ads: 'Paid Ads',
                seo: 'SEO / Local SEO',
                web: 'Web / Landing Pages',
                content: 'Content',
                crm: 'CRM / Automation',
                ai_receptionist: 'AI Receptionist & Call Handling',
                ai_chatbot: 'AI Chatbot (Website, SMS & Social)',
                ai_lead_gen: 'AI Lead Generation & Qualification System',
                ai_followup: 'AI Follow-Up & Nurture Automation',
                ai_ad_creative: 'AI Ad Creative & Campaign Automation',
                reporting: 'Reporting Only',
              };

              const serviceIcons: Record<string, any> = {
                ads: Target,
                seo: Search,
                web: Globe,
                content: FileText,
                crm: Zap,
                ai_receptionist: Phone,
                ai_chatbot: MessageSquare,
                ai_lead_gen: Users,
                ai_followup: Send,
                ai_ad_creative: Sparkles,
                reporting: BarChart3,
              };

              return (
                <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} ${currentTheme.border} border-l-4 border-accent/50`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg glass-surface flex items-center justify-center border border-white/10">
                      <Briefcase className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className={`text-base ${currentTheme.heading} text-primary`}>Scope of Services</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enabledServices.map((serviceId) => {
                      const Icon = serviceIcons[serviceId] || Briefcase;
                      const label = serviceLabels[serviceId] || serviceId;
                      const isAI = serviceId.startsWith('ai_');
                      
                      return (
                        <div
                          key={serviceId}
                          className="group relative overflow-hidden rounded-lg glass-surface border border-white/10 hover:border-accent/30 transition-all duration-200 hover:bg-white/5"
                        >
                          <div className="p-3 flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isAI 
                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                                : 'glass-surface border border-white/10'
                            }`}>
                              <Icon className={`w-4 h-4 ${isAI ? 'text-purple-400' : 'text-accent'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary leading-tight">{label}</p>
                              {isAI && (
                                <span className="inline-block mt-1 text-xs text-purple-400/80 font-medium">AI Powered</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* KPI Cards */}
          {renderKPICards()}

          {effectiveSettings.confidence_note && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} border-l-4 border-accent/50 ${currentTheme.border}`}>
              <h3 className={`text-sm ${currentTheme.heading} text-primary mb-2`}>What we're doing next</h3>
              <p className="text-sm text-secondary">{effectiveSettings.confidence_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className={`grid grid-cols-1 ${currentTheme.mainGridCols} ${currentTheme.sectionSpacing}`}>
        {/* Left Column - Deliverables Feed (2/3) */}
        <div className={`${currentTheme.leftColSpan} ${currentTheme.spacing}`}>
          {/* Deliverables Feed */}
          {effectiveSettings.enabled_sections.deliverables && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.border}`}>
              <div className={`${currentTheme.cardPadding} glass-border-b flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <h2 className={`text-lg ${currentTheme.heading} text-primary`}>Deliverables</h2>
                  {isAgencyMode && (
                    <div className="flex items-center gap-3 text-xs">
                      {(() => {
                        const inProgress = deliverables.filter((d: Deliverable) => 
                          d.status === 'in_progress' || d.status === 'draft'
                        ).length;
                        const awaitingClient = deliverables.filter((d: Deliverable) => 
                          d.status === 'in_review'
                        ).length;
                        const overdue = deliverables.filter((d: Deliverable) => {
                          if (!d.due_date) return false;
                          return new Date(d.due_date) < new Date() && 
                                 d.status !== 'delivered' && 
                                 d.status !== 'approved';
                        }).length;
                        
                        return (
                          <>
                            {inProgress > 0 && (
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {inProgress} In Progress
                              </span>
                            )}
                            {awaitingClient > 0 && (
                              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                {awaitingClient} Awaiting Client
                              </span>
                            )}
                            {overdue > 0 && (
                              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                {overdue} Overdue
                              </span>
                            )}
                            {inProgress === 0 && awaitingClient === 0 && overdue === 0 && (
                              <span className="text-muted">0 items</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {viewMode === 'agency' && (
                  <button className="text-sm text-secondary hover:text-accent transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className={`${currentTheme.cardPadding} ${currentTheme.spacing}`}>
                {sortedDeliverables.length > 0 ? (
                  sortedDeliverables.map((deliverable: Deliverable) => (
                    <div
                      key={deliverable.id}
                      className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardPadding} hover:bg-white/5 transition-all ${currentTheme.border}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 glass-surface rounded-lg flex items-center justify-center text-accent">
                            {getTypeIcon(deliverable.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm ${currentTheme.heading} text-primary mb-1`}>{deliverable.title}</h3>
                            <p className="text-xs text-secondary mb-2">{deliverable.description || 'No description'}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(deliverable.status)}`}>
                                {deliverable.status.replace('_', ' ')}
                              </span>
                              {deliverable.due_date && (
                                <span className="text-xs text-secondary flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(deliverable.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {deliverable.deliverable_comments && deliverable.deliverable_comments.length > 0 && (
                                <span className="text-xs text-secondary flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {deliverable.deliverable_comments.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {viewMode === 'agency' && (
                          <div className="flex items-center gap-2">
                            <button className="text-xs text-secondary hover:text-accent transition-colors">
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Assets */}
                      {deliverable.deliverable_assets && deliverable.deliverable_assets.length > 0 && (
                        <div className="mt-3 pt-3 glass-border-t flex items-center gap-2 flex-wrap">
                          {deliverable.deliverable_assets.map((asset: any) => (
                            <a
                              key={asset.id}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:text-accent transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {asset.name}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Client Actions */}
                      {viewMode === 'client' && deliverable.status === 'in_review' && (
                        <div className="mt-3 pt-3 glass-border-t flex items-center gap-2">
                          <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors border border-green-500/30">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 text-xs font-medium rounded-lg glass-surface text-secondary hover:text-primary transition-colors">
                            Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-sm text-secondary mb-1">No deliverables yet</p>
                    {!isAgencyMode ? (
                      <p className="text-xs text-muted">We'll post work here as it's completed.</p>
                    ) : (
                      <>
                        <p className="text-xs text-muted mb-4">We'll post work here as it's completed.</p>
                        {viewMode === 'agency' && (
                          <button
                            onClick={() => setShowNewDeliverable(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm shadow-prestige-soft"
                          >
                            <Plus className="w-4 h-4" />
                            Create Deliverable
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {effectiveSettings.enabled_sections.reports && (
            <div className={`glass-surface ${currentTheme.card} shadow-prestige-soft ${currentTheme.cardPadding} ${currentTheme.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg ${currentTheme.heading} text-primary`}>Performance Snapshot</h2>
                <button className="text-sm text-secondary hover:text-accent transition-colors flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
              <div className="text-sm text-secondary">
                <p className="mb-4">Reports will appear here once data sources are connected.</p>
                {viewMode === 'agency' && (
                  <Link 
                    href={`/${currentOrgId}/setup?tab=dashboard`}
                    className="text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Connect Data Sources →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className={`${currentTheme.rightColSpan} ${currentTheme.spacing}`}>
          {/* Roadmap / Next Steps */}
          {effectiveSettings.enabled_sections.roadmap && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.border}`}>
              <div className={`${currentTheme.cardPadding} glass-border-b`}>
                <h2 className={`text-lg ${currentTheme.heading} text-primary`}>What's Next</h2>
              </div>
              <div className={`${currentTheme.cardPadding} ${currentTheme.spacing}`}>
                {thisWeekItems.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">This Week</h3>
                    <ul className="space-y-2">
                      {thisWeekItems.map((item) => (
                        <li key={item.id} className="text-sm text-secondary flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {nextWeekItems.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Next Week</h3>
                    <ul className="space-y-2">
                      {nextWeekItems.map((item) => (
                        <li key={item.id} className="text-sm text-secondary flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {blockers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3">Blockers</h3>
                    <ul className="space-y-2">
                      {blockers.map((item) => (
                        <li key={item.id} className="text-sm text-red-400 flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {thisWeekItems.length === 0 && nextWeekItems.length === 0 && blockers.length === 0 && (
                  <div className="space-y-3">
                    {isAgencyMode && viewMode === 'agency' ? (
                      <>
                        <p className="text-sm text-secondary mb-3">Add 2–3 upcoming actions so the client always knows what's coming.</p>
                        <div className="space-y-2 text-sm text-muted">
                          <p className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span>Review campaign performance and optimize targeting</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span>Prepare monthly report for client review</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            <span>Schedule strategy session to discuss Q2 goals</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => setShowAddRoadmap(true)}
                          className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                          + Add Roadmap Item
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-secondary">Updates from your team will appear here.</p>
                    )}
                  </div>
                )}

                {isAgencyMode && viewMode === 'agency' && (thisWeekItems.length > 0 || nextWeekItems.length > 0 || blockers.length > 0) && (
                  <button 
                    onClick={() => setShowAddRoadmap(true)}
                    className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    + Add Roadmap Item
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Weekly Updates */}
          {effectiveSettings.enabled_sections.updates && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.border}`}>
              <div className={`${currentTheme.cardPadding} glass-border-b`}>
                <h2 className={`text-lg ${currentTheme.heading} text-primary`}>Recent Updates</h2>
              </div>
              <div className={`${currentTheme.cardPadding} ${currentTheme.spacing}`}>
                {weeklyUpdates.length > 0 ? (
                  weeklyUpdates.map((update) => {
                    const daysAgo = Math.floor((new Date().getTime() - new Date(update.published_at).getTime()) / (1000 * 60 * 60 * 24));
                    const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
                    
                    return (
                      <div key={update.id} className="pb-4 last:pb-0 border-b border-white/5 last:border-0">
                        <h3 className="text-sm font-medium text-primary mb-2">{update.title}</h3>
                        <p className="text-xs text-secondary mb-2">{update.what_we_did}</p>
                        {update.results && (
                          <p className="text-xs text-accent mb-2">
                            <strong>Results:</strong> {update.results}
                          </p>
                        )}
                        {update.next_steps && (
                          <p className="text-xs text-secondary">
                            <strong>Next:</strong> {update.next_steps}
                          </p>
                        )}
                        <p className="text-xs text-muted mt-2">
                          {timeAgo}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-secondary">Updates from your team will appear here.</p>
                )}

                {isAgencyMode && viewMode === 'agency' && (
                  <button 
                    onClick={() => setShowCreateUpdate(true)}
                    className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    + Create Update
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Approvals Needed (Client) / Pending Approvals (Agency) */}
          {deliverables.filter((d: Deliverable) => d.status === 'in_review').length > 0 && (
            <div className={`${currentTheme.cardBg} ${currentTheme.card} ${currentTheme.cardShadow} ${currentTheme.cardPadding} border-l-4 border-yellow-500/50 ${currentTheme.border}`}>
              <h3 className="text-sm font-medium text-primary mb-2">
                {viewMode === 'client' ? 'Approvals Needed' : 'Pending Approvals'}
              </h3>
              <p className="text-xs text-secondary">
                {deliverables.filter((d: Deliverable) => d.status === 'in_review').length} item(s) waiting for approval
              </p>
            </div>
          )}

          {/* Recent Messages */}
          <div className="glass-surface rounded-lg shadow-prestige-soft">
            <div className="p-6 glass-border-b flex items-center justify-between">
              <h2 className="text-lg font-medium text-primary">Recent Messages</h2>
              <Link
                href={`/${orgId}/messages`}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className={`${currentTheme.cardPadding} ${currentTheme.spacing}`}>
              {recentMessages.length > 0 ? (
                recentMessages.map((message: any) => (
                  <div key={message.id} className="pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-secondary">
                        {message.author_role === 'agency' ? 'Agency' : 'Client'}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-primary line-clamp-2">{message.body}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-secondary mb-2">No messages yet</p>
                  <Link
                    href={`/${orgId}/messages`}
                    className="text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Start conversation →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Deliverable Modal */}
      {showNewDeliverable && (
        <NewDeliverableModal
          orgId={orgId}
          onClose={() => setShowNewDeliverable(false)}
          onSuccess={() => {
            setShowNewDeliverable(false);
            window.location.reload(); // Refresh to show new deliverable
          }}
        />
      )}

      {/* Dashboard Edit Modal */}
      <DashboardEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        orgId={orgId}
        dashboardLayout={dashboardLayout}
      />

      {/* Create Update Modal */}
      <CreateUpdateModal
        isOpen={showCreateUpdate}
        onClose={() => setShowCreateUpdate(false)}
        orgId={orgId}
      />

      {/* Add Roadmap Item Modal */}
      <AddRoadmapItemModal
        isOpen={showAddRoadmap}
        onClose={() => setShowAddRoadmap(false)}
        orgId={orgId}
      />
    </div>
  );
}

