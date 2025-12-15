'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  CheckCircle2,
  Plus,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Globe,
  Zap,
  Settings,
  Calendar,
  MessageSquare,
  Download,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { createDeliverable } from '@/app/actions/deliverables';

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
}: ClientDashboardProps) {
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

  const settings = portalSettings || {
    enabled_sections: {
      executive_summary: false,
      deliverables: false,
      roadmap: false,
      reports: false,
      updates: false,
    },
    metrics_config: {
      leads: false,
      spend: false,
      cpl: false,
      roas: false,
      work_completed: false,
    },
  };
  
  // Check if any sections are enabled
  const hasAnySections = settings.enabled_sections && (
    settings.enabled_sections.executive_summary ||
    settings.enabled_sections.deliverables ||
    settings.enabled_sections.roadmap ||
    settings.enabled_sections.reports ||
    settings.enabled_sections.updates
  );

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

  return (
    <div className="space-y-8">
      {/* Preview Mode Banner (only in preview, not real client mode) */}
      {isPreviewMode && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-yellow-500/50 mb-6">
          <p className="text-sm text-primary">
            <strong className="text-yellow-400">Preview Mode</strong> — This is how the client sees their dashboard
          </p>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-primary">{orgName}</h1>
            
            {/* Show blank state message if no sections enabled */}
            {!hasAnySections && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                Dashboard not configured
              </span>
            )}
            {/* Client Health Status - only show in agency mode */}
            {isAgencyMode && !isPreviewMode && (() => {
              // Determine client health status
              const overdueCount = deliverables.filter((d: Deliverable) => {
                if (!d.due_date) return false;
                return new Date(d.due_date) < new Date() && d.status !== 'delivered' && d.status !== 'approved';
              }).length;
              const waitingOnClient = deliverables.filter((d: Deliverable) => d.status === 'in_review').length;
              
              let status = 'on_track';
              let statusText = 'On Track';
              let statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
              
              if (overdueCount > 0) {
                status = 'blocked';
                statusText = 'Blocked';
                statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
              } else if (waitingOnClient > 0) {
                status = 'waiting';
                statusText = 'Waiting on Client';
                statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
              }
              
              return (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                  {statusText}
                </span>
              );
            })()}
            {/* Client view: Show "On Track" status */}
            {!isAgencyMode && (() => {
              const overdueCount = deliverables.filter((d: Deliverable) => {
                if (!d.due_date) return false;
                return new Date(d.due_date) < new Date() && d.status !== 'delivered' && d.status !== 'approved';
              }).length;
              
              if (overdueCount > 0) {
                return (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border-red-500/30">
                    Needs Attention
                  </span>
                );
              }
              return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border-green-500/30">
                  On Track
                </span>
              );
            })()}
          </div>
          {/* Client view: Show "Managed by Elvance" instead of "Client Workspace" */}
          {!isAgencyMode ? (
            <p className="text-sm text-muted">Managed by Elvance</p>
          ) : (
            <p className="text-secondary">Client Workspace</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Only show agency controls in agency mode, not preview, and only for admins */}
          {/* Members (isClientMode) cannot see or use these controls */}
          {isAgencyMode && !isPreviewMode && !isClientMode && viewMode === 'agency' && (
            <>
              <button
                onClick={() => setViewMode('client')}
                className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-prestige-soft text-sm"
              >
                <Eye className="w-4 h-4" />
                Preview Client View
              </button>
              <button
                onClick={() => setShowNewDeliverable(true)}
                className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-prestige-soft"
              >
                <Plus className="w-4 h-4" />
                New Deliverable
              </button>
            </>
          )}
          {isAgencyMode && !isPreviewMode && !isClientMode && viewMode === 'client' && (
            <button
              onClick={() => setViewMode('agency')}
              className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-prestige-soft text-sm"
            >
              <EyeOff className="w-4 h-4" />
              Back to Agency View
            </button>
          )}
        </div>
      </div>

      {/* Blank State - Show when no sections are enabled */}
      {!hasAnySections && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-16 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-light text-primary mb-3">{orgName}</h2>
            <p className="text-secondary mb-6">
              Your dashboard hasn't been configured yet. Contact your agency to set up your dashboard sections and metrics.
            </p>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {settings.enabled_sections?.executive_summary && (
        <div className="space-y-4">
          {settings.executive_summary_text && (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
              <p className="text-primary leading-relaxed">{settings.executive_summary_text}</p>
            </div>
          )}

          {/* KPI Context - Primary Goal, Tracking, Status */}
          {isAgencyMode && (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-accent/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted">Primary Goal:</span>
                  <span className="text-primary ml-2">
                    {settings.metrics_config?.leads ? 'Lead Generation' : 
                     settings.metrics_config?.roas ? 'ROAS Optimization' : 
                     'Performance Tracking'}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Tracking:</span>
                  <span className="text-primary ml-2">GA4 + CallRail</span>
                </div>
                <div>
                  <span className="text-muted">Status:</span>
                  <span className="text-yellow-400 ml-2">Waiting on client access</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {settings.metrics_config?.leads && (
              <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-xs text-secondary">This month</span>
                </div>
                <div className="text-2xl font-semibold text-primary mb-1">{metrics.leads}</div>
                <div className="text-sm text-secondary">Leads / Bookings</div>
              </div>
            )}

            {settings.metrics_config?.spend && (
              <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span className="text-xs text-secondary">This month</span>
                </div>
                <div className="text-2xl font-semibold text-primary mb-1">${metrics.spend.toLocaleString()}</div>
                <div className="text-sm text-secondary">Spend</div>
              </div>
            )}

            {settings.metrics_config?.cpl && (
              <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold text-primary mb-1">${metrics.cpl}</div>
                <div className="text-sm text-secondary">CPL / CPA</div>
              </div>
            )}

            {settings.metrics_config?.roas && (
              <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div className="text-2xl font-semibold text-primary mb-1">{metrics.roas}x</div>
                <div className="text-sm text-secondary">ROAS</div>
              </div>
            )}

            {settings.metrics_config?.work_completed && (
              <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="text-xs text-secondary">This week</span>
                </div>
                <div className="text-2xl font-semibold text-primary mb-1">{metrics.workCompleted}</div>
                <div className="text-sm text-secondary">Work Completed</div>
              </div>
            )}
          </div>

          {settings.confidence_note && (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border-l-4 border-accent/50">
              <h3 className="text-sm font-medium text-primary mb-2">What we're doing next</h3>
              <p className="text-sm text-secondary">{settings.confidence_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid - Only show if sections are enabled */}
      {hasAnySections && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Deliverables Feed (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deliverables Feed */}
          {settings.enabled_sections?.deliverables && (
            <div className="glass-surface rounded-lg shadow-prestige-soft">
              <div className="p-6 glass-border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium text-primary">Deliverables</h2>
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
              <div className="p-6 space-y-4">
                {sortedDeliverables.length > 0 ? (
                  sortedDeliverables.map((deliverable: Deliverable) => (
                    <div
                      key={deliverable.id}
                      className="glass-surface rounded-lg p-4 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 glass-surface rounded-lg flex items-center justify-center text-accent">
                            {getTypeIcon(deliverable.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-primary mb-1">{deliverable.title}</h3>
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
          {settings.enabled_sections?.reports && (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-primary">Performance Snapshot</h2>
                <button className="text-sm text-secondary hover:text-accent transition-colors flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
              <div className="text-sm text-secondary">
                <p className="mb-4">Reports will appear here once data sources are connected.</p>
                {viewMode === 'agency' && (
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                    Connect Data Sources →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Roadmap / Next Steps */}
          {settings.enabled_sections?.roadmap && (
            <div className="glass-surface rounded-lg shadow-prestige-soft">
              <div className="p-6 glass-border-b">
                <h2 className="text-lg font-medium text-primary">What's Next</h2>
              </div>
              <div className="p-6 space-y-6">
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
                        <button className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors">
                          + Add Roadmap Item
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-secondary">Updates from your team will appear here.</p>
                    )}
                  </div>
                )}

                {isAgencyMode && viewMode === 'agency' && (thisWeekItems.length > 0 || nextWeekItems.length > 0 || blockers.length > 0) && (
                  <button className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors">
                    + Add Roadmap Item
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Weekly Updates */}
          {settings.enabled_sections?.updates && (
            <div className="glass-surface rounded-lg shadow-prestige-soft">
              <div className="p-6 glass-border-b">
                <h2 className="text-lg font-medium text-primary">Recent Updates</h2>
              </div>
              <div className="p-6 space-y-4">
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
                  <button className="mt-4 text-xs text-accent hover:text-accent/80 transition-colors">
                    + Create Update
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Approvals Needed (Client) / Pending Approvals (Agency) */}
          {deliverables.filter((d: Deliverable) => d.status === 'in_review').length > 0 && (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border-l-4 border-yellow-500/50">
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
            <div className="p-6 space-y-3">
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
      )}

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
    </div>
  );
}

// New Deliverable Modal Component
function NewDeliverableModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Other',
    description: '',
    due_date: '',
    status: 'draft',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result: any = await createDeliverable(orgId, {
        title: formData.title,
        type: formData.type,
        description: formData.description || undefined,
        due_date: formData.due_date || undefined,
      });
      
      if (result && result.data) {
        // Update status separately if needed (createDeliverable creates as draft by default)
        if (formData.status !== 'draft') {
          const { updateDeliverableStatus } = await import('@/app/actions/deliverables');
          await updateDeliverableStatus(result.data.id, formData.status as any);
        }
        onSuccess();
      } else {
        alert(result?.error || 'Failed to create deliverable');
      }
    } catch (error) {
      console.error('Error creating deliverable:', error);
      alert('Failed to create deliverable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-surface rounded-lg shadow-prestige p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-primary">New Deliverable</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10"
            >
              <option value="Ad">Ad</option>
              <option value="Creative">Creative</option>
              <option value="SEO">SEO</option>
              <option value="Web">Web</option>
              <option value="Automation">Automation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-white/10"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 glass-surface text-accent rounded-lg hover:bg-accent/20 transition-all border border-accent/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 glass-surface text-secondary rounded-lg hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

