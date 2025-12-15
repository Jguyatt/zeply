'use client';

import { useState } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Eye,
  EyeOff,
  MoreVertical,
  Calendar,
  FileText,
  Image as ImageIcon,
  Globe,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { updateDeliverableStatus } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';
import NewDeliverableModal from './NewDeliverableModal';

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  due_date?: string;
  description?: string;
  client_visible?: boolean;
  published_at?: string;
  created_at: string;
  deliverable_assets?: any[];
  deliverable_comments?: any[];
}

interface DeliverablesListProps {
  deliverables: Deliverable[];
  orgId: string;
  isAdmin: boolean;
  isClientView?: boolean;
}

export default function DeliverablesList({
  deliverables,
  orgId,
  isAdmin,
  isClientView = false,
}: DeliverablesListProps) {
  const router = useRouter();
  const [showNewDeliverable, setShowNewDeliverable] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    in_progress: true,
    awaiting_client: true,
    delivered: true,
    draft: true,
  });

  // Group deliverables by status
  // In client view, sort: Awaiting approval first, then in progress, then delivered
  const inProgress = deliverables.filter(d => d.status === 'in_progress');
  const awaitingClient = deliverables.filter(d => d.status === 'awaiting_client' || d.status === 'in_review');
  const delivered = deliverables.filter(d => d.status === 'delivered' || d.status === 'approved');
  const drafts = isClientView ? [] : deliverables.filter(d => d.status === 'draft');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Ad':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Creative':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'SEO':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Web':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Automation':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'awaiting_client':
      case 'in_review':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'approved':
        return 'Approved';
      case 'awaiting_client':
      case 'in_review':
        return 'Awaiting Client';
      case 'in_progress':
        return 'In Progress';
      case 'draft':
        return 'Draft';
      default:
        return status.replace('_', ' ');
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const DeliverableRow = ({ deliverable }: { deliverable: Deliverable }) => (
    <div className="glass-surface rounded-lg p-4 hover:bg-white/5 transition-all border border-white/5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title and Type */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-accent ${getTypeColor(deliverable.type)}`}>
            {getTypeIcon(deliverable.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-primary truncate">{deliverable.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getTypeColor(deliverable.type)}`}>
                {deliverable.type}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Status and Due Date */}
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(deliverable.status)}`}>
            {getStatusLabel(deliverable.status)}
          </span>
          {deliverable.due_date && (
            <div className="flex items-center gap-1 text-xs text-secondary">
              <Calendar className="w-3 h-3" />
              <span className={isOverdue(deliverable.due_date) ? 'text-red-400' : ''}>
                {new Date(deliverable.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              {isOverdue(deliverable.due_date) && deliverable.status !== 'delivered' && deliverable.status !== 'approved' && (
                <AlertCircle className="w-3 h-3 text-red-400" />
              )}
            </div>
          )}
          {!deliverable.due_date && (
            <span className="text-xs text-muted">No due date</span>
          )}
        </div>

        {/* Right: Client Visibility and Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              className={`p-1.5 rounded-lg transition-colors ${
                deliverable.client_visible
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              }`}
              title={deliverable.client_visible ? 'Visible to client' : 'Hidden from client'}
            >
              {deliverable.client_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {deliverable.status === 'in_progress' && (
              <button
                onClick={async () => {
                  await updateDeliverableStatus(deliverable.id, 'in_review');
                  router.refresh();
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors border border-yellow-500/30"
              >
                Mark Delivered
              </button>
            )}
            <button className="p-1.5 rounded-lg text-secondary hover:bg-white/10 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const StatusSection = ({
    title,
    deliverables: items,
    sectionKey,
    icon: Icon,
    defaultExpanded = true,
  }: {
    title: string;
    deliverables: Deliverable[];
    sectionKey: keyof typeof expandedSections;
    icon: any;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections[sectionKey] ?? defaultExpanded;
    const count = items.length;

    return (
      <div className="glass-surface rounded-lg shadow-prestige-soft overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-4 glass-border-b flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-secondary" />
            )}
            <Icon className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-medium text-primary">{title}</h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-secondary">
              {count}
            </span>
          </div>
        </button>
        {isExpanded && (
          <div className="p-4 space-y-3">
            {count > 0 ? (
              items.map((deliverable) => (
                <DeliverableRow key={deliverable.id} deliverable={deliverable} />
              ))
            ) : (
              <p className="text-sm text-secondary text-center py-4">No items in this section</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Deliverables</h1>
          <p className="text-secondary mt-2">
            {isClientView 
              ? 'Work completed and in progress for your organization'
              : 'Track, publish, and manage all client-facing work'
            }
          </p>
        </div>
        {isAdmin && !isClientView && (
          <button
            onClick={() => setShowNewDeliverable(true)}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft"
          >
            <Plus className="w-4 h-4" />
            New Deliverable
          </button>
        )}
      </div>

      {/* Status-Grouped Sections */}
          {deliverables.length === 0 ? (
            <div className="glass-surface rounded-lg shadow-prestige-soft p-12">
              <div className="text-center max-w-md mx-auto">
                <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-light text-primary mb-2">No deliverables yet</h2>
                <p className="text-secondary mb-6">
                  {isClientView
                    ? "We'll post work here as it's completed."
                    : "Deliverables are the work your client will see — landing pages, ad creatives, reports, and more."
                  }
                </p>
                {isAdmin && !isClientView && (
                  <button
                    onClick={() => setShowNewDeliverable(true)}
                    className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create first deliverable
                  </button>
                )}
              </div>
            </div>
          ) : (
        <div className="space-y-4">
          <StatusSection
            title="In Progress"
            deliverables={inProgress}
            sectionKey="in_progress"
            icon={Clock}
          />
          <StatusSection
            title="Awaiting Client"
            deliverables={awaitingClient}
            sectionKey="awaiting_client"
            icon={AlertCircle}
          />
          <StatusSection
            title="Delivered"
            deliverables={delivered}
            sectionKey="delivered"
            icon={CheckCircle2}
          />
              {isAdmin && !isClientView && (
                <StatusSection
                  title="Drafts"
                  deliverables={drafts}
                  sectionKey="draft"
                  icon={FileText}
                />
              )}
        </div>
      )}

      {/* New Deliverable Modal */}
      {showNewDeliverable && (
        <NewDeliverableModal
          orgId={orgId}
          onClose={() => setShowNewDeliverable(false)}
          onSuccess={() => {
            setShowNewDeliverable(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
