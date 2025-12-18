'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Eye, EyeOff, Calendar, User, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLatestMetrics } from '@/app/actions/metrics';
import { updateReport } from '@/app/actions/reports';
import MetricsPopulator from './MetricsPopulator';
import ReportEditor from './ReportEditor';
import ReportViewer from './ReportViewer';
import GenerateReportModal from './GenerateReportModal';

interface Report {
  id: string;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  published_at?: string;
  created_by?: string;
  client_visible: boolean;
}

interface ReportsListProps {
  reports: Report[];
  orgId: string;
  isAdmin: boolean;
  isClientView?: boolean;
}

export default function ReportsList({ reports, orgId, isAdmin, isClientView = false }: ReportsListProps) {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [publishingReport, setPublishingReport] = useState<string | null>(null);

  // Load current period metrics
  useEffect(() => {
    const loadCurrentMetrics = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        
        const result = await getLatestMetrics(orgId);
        if (result && 'data' in result && result.data) {
          setCurrentMetrics((result as any).data);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    if (orgId && !isClientView) {
      loadCurrentMetrics();
    }
  }, [orgId, isClientView]);
  
  // In client view, only show published and client-visible reports
  const visibleReports = isClientView 
    ? reports.filter(r => r.status === 'published' && r.client_visible !== false)
    : reports;
  
  const publishedReports = visibleReports.filter(r => r.status === 'published');
  const hasReports = visibleReports.length > 0;

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Performance Reports</h1>
          <p className="text-secondary mt-2">
            {isClientView
              ? 'Performance reports and insights from your team'
              : 'Create and publish client-facing performance reports'
            }
          </p>
        </div>
        {isAdmin && !isClientView && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft"
          >
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {/* Top Row: Snapshot, Recent Reports, Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Performance Snapshot */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Performance Snapshot</h3>
          
          {/* Context Information - Only show in agency view */}
          {!isClientView && (
            <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Tracking:</span>
                <span className="text-secondary">Google Ads + GA4</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Period:</span>
                <span className="text-secondary">This month</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Status:</span>
                <span className="text-yellow-400">Waiting on data source</span>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-secondary text-sm">Leads</span>
              <span className="text-primary font-medium">
                {loadingMetrics ? '...' : formatNumber(currentMetrics?.leads)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-sm">Spend</span>
              <span className="text-primary font-medium">
                {loadingMetrics ? '...' : formatCurrency(currentMetrics?.spend)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-sm">ROAS</span>
              <span className="text-primary font-medium">
                {loadingMetrics ? '...' : currentMetrics?.roas ? `${currentMetrics.roas}x` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {visibleReports.length > 0 ? (
              visibleReports.slice(0, 3).map((report) => (
                <div key={report.id} className="pb-3 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-primary">{report.title}</h4>
                    {!isClientView && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          report.status === 'published'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {report.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {report.status === 'published' && report.published_at
                          ? `Sent ${new Date(report.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : `Created ${new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>
                    {!isClientView && (
                      <>
                        {report.status === 'draft' && (
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <EyeOff className="w-3 h-3" />
                            <span>Not visible to client</span>
                          </div>
                        )}
                        {report.status === 'published' && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Eye className="w-3 h-3" />
                            <span>Visible to client</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary text-sm">No reports yet</p>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
          <h3 className="text-lg font-light text-primary mb-4">Export</h3>
          <div className="space-y-2">
            <button
              disabled={!hasReports || publishedReports.length === 0}
              className={`w-full px-3 py-2 glass-surface text-primary rounded-lg transition-all text-sm text-left flex items-center gap-2 ${
                hasReports && publishedReports.length > 0
                  ? 'hover:bg-white/10'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              PDF Export
            </button>
            <button
              disabled={!hasReports || publishedReports.length === 0}
              className={`w-full px-3 py-2 glass-surface text-primary rounded-lg transition-all text-sm text-left flex items-center gap-2 ${
                hasReports && publishedReports.length > 0
                  ? 'hover:bg-white/10'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              CSV Export
            </button>
          </div>
        </div>
      </div>

      {/* Report Narrative Context - Only in agency view */}
      {!isClientView && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6 border-l-4 border-accent/50">
          <p className="text-sm text-secondary">
            <strong className="text-primary">Reports include performance data + written insights for clients.</strong>
            <br />
            Each report can include a summary of what happened, what changed, and recommended next actions.
          </p>
        </div>
      )}

      {/* Main Reports List / Empty State */}
      {visibleReports.length === 0 ? (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-12">
          <div className="text-center max-w-md mx-auto">
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-light text-primary mb-2">No reports yet</h2>
            <p className="text-secondary mb-6">
              {isClientView
                ? 'Performance reports from your team will appear here.'
                : 'Reports help clients understand performance and next steps. Create your first report to summarize results and share insights.'
              }
            </p>
            {isAdmin && !isClientView && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft mx-auto"
              >
                <Plus className="w-5 h-5" />
                Generate Report
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-8">
          <div className="space-y-4">
            {visibleReports.map((report) => (
              <div
                key={report.id}
                className="glass-surface rounded-lg p-4 hover:bg-white/5 transition-all border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-medium text-primary">{report.title}</h3>
                      {(report as any).version && (report as any).version > 1 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/10 text-secondary border border-white/10">
                          v{(report as any).version}
                        </span>
                      )}
                      {(report as any).tier && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-accent/20 text-accent border border-accent/30 capitalize">
                          {(report as any).tier}
                        </span>
                      )}
                      {!isClientView && (
                        <>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${
                              report.status === 'published'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {report.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {report.status === 'published' ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Eye className="w-3 h-3" />
                              Visible to client
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted">
                              <EyeOff className="w-3 h-3" />
                              Not visible to client
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-secondary">
                      <span>
                        Created {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.published_at && (
                        <>
                          <span>•</span>
                          <span>
                            Sent {new Date(report.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {isAdmin && !isClientView && (
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg glass-surface text-secondary hover:text-primary transition-colors">
                        Edit
                      </button>
                      {report.status === 'draft' && (
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors border border-green-500/30">
                          Publish
                        </button>
                      )}
                    </div>
                  )}
                  {/* Client view: Show View/Download buttons */}
                  {isClientView && (
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg glass-surface text-primary hover:bg-white/10 transition-colors">
                        View
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg glass-surface text-secondary hover:text-primary transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateReportModal
          orgId={orgId}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            router.refresh();
          }}
        />
      )}

      {/* Report Editor */}
      {editingReport && (
        <ReportEditor
          report={editingReport}
          orgId={orgId}
          onClose={() => setEditingReport(null)}
          onSuccess={() => {
            setEditingReport(null);
            router.refresh();
          }}
        />
      )}

      {/* Report Viewer */}
      {viewingReport && (
        <ReportViewer
          report={viewingReport}
          orgId={orgId}
          isAdmin={isAdmin}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
}

