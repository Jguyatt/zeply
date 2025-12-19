'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Upload,
  ChevronDown as ChevronDownIcon,
  Image,
  Link as LinkIcon,
  CheckCircle,
  ArrowRight,
  Edit,
  Copy,
  Archive,
  Search,
  X,
  List,
  Grid,
  ChevronUp,
} from 'lucide-react';
import { updateDeliverableStatus, duplicateDeliverable, archiveDeliverable } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';
import NewDeliverableModal from './NewDeliverableModal';
import AddProofItemModal from './AddProofItemModal';
import PostUpdateModal from './PostUpdateModal';
import EditDeliverableModal from './EditDeliverableModal';
import ConfirmModal from './ConfirmModal';

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
  updated_at?: string;
  progress?: number;
  assigned_to?: string | null;
  created_by?: string;
  deliverable_assets?: any[];
  deliverable_comments?: any[];
  deliverable_checklist_items?: any[];
  deliverable_updates?: Array<{
    id: string;
    stage: string;
    note?: string;
    created_at: string;
    client_visible: boolean;
  }>;
}

interface DeliverablesListProps {
  deliverables: Deliverable[];
  orgId: string;
  isAdmin: boolean;
  isClientView?: boolean;
  orgName?: string;
}

export default function DeliverablesList({
  deliverables,
  orgId,
  isAdmin,
  isClientView = false,
  orgName,
}: DeliverablesListProps) {
  const router = useRouter();
  const [showNewDeliverable, setShowNewDeliverable] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showAddProof, setShowAddProof] = useState<string | null>(null);
  const [showPostUpdate, setShowPostUpdate] = useState<string | null>(null);
  const [showEditDeliverable, setShowEditDeliverable] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [showKebabMenu, setShowKebabMenu] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string | null>(null);
  const [processingDeliverable, setProcessingDeliverable] = useState<string | null>(null);

  // New state for ops features
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deliverables-view-mode');
      return (saved === 'list' || saved === 'cards') ? saved : (isAdmin && !isClientView ? 'list' : 'cards');
    }
    return isAdmin && !isClientView ? 'list' : 'cards';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'updated_at' | 'status' | 'title'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDeliverables, setSelectedDeliverables] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<'bulk' | string | null>(null);

  // Fetch member names for owner display
  useEffect(() => {
    const fetchMemberNames = async () => {
      try {
        const response = await fetch(`/api/orgs/${orgId}/members`);
        if (response.ok) {
          const data = await response.json();
          const namesMap: Record<string, string> = {};
          (data.data || []).forEach((member: any) => {
            namesMap[member.user_id] = member.name || member.email || 'Unknown';
          });
          setMemberNames(namesMap);
        }
      } catch (err) {
        console.error('Error fetching member names:', err);
      }
    };
    fetchMemberNames();
  }, [orgId]);
  const [showArchived, setShowArchived] = useState(false);
  
  // Persist view mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('deliverables-view-mode', viewMode);
    }
  }, [viewMode]);

  // Calculate overdue deliverables (exclude archived unless showArchived is true)
  const overdue = useMemo(() => {
    const now = new Date();
    const base = deliverables.filter(d => {
      if (!d.due_date) return false;
      return new Date(d.due_date) < now && d.status !== 'complete' && d.status !== 'approved';
    });
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, showArchived]);

  // Filter deliverables by search query, status, and sort
  const filteredAndSortedDeliverables = useMemo(() => {
    let filtered = [...deliverables];
    
    // Filter out archived items by default (unless showArchived is true)
    if (!showArchived) {
      filtered = filtered.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    
    // Apply status filter (including overdue special case)
    if (selectedStatus === '__overdue__') {
      const now = new Date();
      filtered = filtered.filter(d => {
        if (!d.due_date) return false;
        return new Date(d.due_date) < now && d.status !== 'complete' && d.status !== 'approved';
      });
    } else if (selectedStatus) {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(d => {
        const titleMatch = d.title?.toLowerCase().includes(query);
        const descMatch = d.description?.toLowerCase().includes(query);
        const typeMatch = d.type?.toLowerCase().includes(query);
        const tagsMatch = (d as any).tags?.some((tag: string) => tag.toLowerCase().includes(query));
        return titleMatch || descMatch || typeMatch || tagsMatch;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortBy) {
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'updated_at':
          aVal = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
          bVal = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortBy === 'status' || sortBy === 'title') {
        return sortOrder === 'asc' 
          ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
          : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    
    return filtered;
  }, [deliverables, selectedStatus, searchQuery, sortBy, sortOrder, showArchived]);

  // Legacy filteredDeliverables for backward compatibility
  const filteredDeliverables = filteredAndSortedDeliverables;

  // Group deliverables by status - memoized for performance
  // New workflow statuses (exclude archived unless showArchived is true)
  const planned = useMemo(() => {
    const base = isClientView ? [] : deliverables.filter(d => d.status === 'planned');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, isClientView, showArchived]);
  const inProgress = useMemo(() => {
    const base = deliverables.filter(d => d.status === 'in_progress');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, showArchived]);
  const finishingTouches = useMemo(() => {
    const base = isClientView ? [] : deliverables.filter(d => d.status === 'finishing_touches');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, isClientView, showArchived]);
  const inReview = useMemo(() => {
    const base = deliverables.filter(d => d.status === 'in_review');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, showArchived]);
  const approved = useMemo(() => {
    const base = deliverables.filter((d) => d.status === "approved");
  
    if (!showArchived) {
      return base.filter((d) => {
        const archived = (d as any).archived;
        return archived !== true && archived !== "true";
      });
    }
  
    return base;
  }, [deliverables, showArchived]);
  
  const complete = useMemo(() => {
    const base = deliverables.filter(d => d.status === 'complete');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, showArchived]);
  const revisionsRequested = useMemo(() => {
    const base = deliverables.filter(d => d.status === 'revisions_requested');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, showArchived]);
  const blocked = useMemo(() => {
    const base = isClientView ? [] : deliverables.filter(d => d.status === 'blocked');
    if (!showArchived) {
      return base.filter(d => {
        const archived = (d as any).archived;
        return archived !== true && archived !== 'true';
      });
    }
    return base;
  }, [deliverables, isClientView, showArchived]);


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

  // Colored status badges (steel blue for active, green for complete, amber for blocked)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_review':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'revisions_requested':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'finishing_touches':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'in_progress':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'planned':
        return 'bg-white/5 text-secondary border-white/10';
      case 'blocked':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-white/5 text-secondary border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'approved':
        return 'Approved';
      case 'in_review':
        return 'In Review';
      case 'revisions_requested':
        return 'Revisions Requested';
      case 'finishing_touches':
        return 'Finishing Touches';
      case 'in_progress':
        return 'In Progress';
      case 'planned':
        return 'Planned';
      case 'blocked':
        return 'Blocked';
      default:
        return status.replace('_', ' ');
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Helper: Calculate checklist metrics
  const getChecklistMetrics = (deliverable: Deliverable) => {
    const items = deliverable.deliverable_checklist_items || [];
    const completed = items.filter((item: any) => item.is_done).length;
    return { total: items.length, completed };
  };

  // Helper: Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper: Get proof thumbnails (first 3 images)
  const getProofThumbnails = (assets?: any[]) => {
    if (!assets || assets.length === 0) return [];
    const images = assets.filter((asset: any) => 
      asset.proof_type === 'screenshot' || 
      (asset.url || asset.file_url)?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ).slice(0, 3);
    return images;
  };

  // Empty Column State Component
  const EmptyColumnState = () => (
    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-lg m-2">
      <div className="text-center py-8">
        <p className="text-xs text-secondary/60">No deliverables</p>
      </div>
    </div>
  );

  // Kanban Column Component
  const KanbanColumn = ({
    title,
    count,
    items,
    isAdmin,
    showStatusDropdown,
    onStatusDropdownToggle,
    onPostUpdate,
    onSelect,
    showKebabMenu,
    onKebabMenuToggle,
    hoveredCard,
    onCardHover,
  }: {
    title: string;
    count: number;
    items: Deliverable[];
    isAdmin: boolean;
    showStatusDropdown?: string | null;
    onStatusDropdownToggle?: (id: string | null) => void;
    onPostUpdate?: (id: string) => void;
    onSelect?: (id: string) => void;
    showKebabMenu?: string | null;
    onKebabMenuToggle?: (id: string | null) => void;
    hoveredCard?: string | null;
    onCardHover?: (id: string | null) => void;
  }) => (
    <div className="glass-panel rounded-xl border border-white/10 flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Column Header */}
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <h3 className="text-xs font-medium text-primary">
          {title} · {count}
        </h3>
      </div>
      
      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {items.length > 0 ? (
          items.map((deliverable) => (
            <DeliverableRow 
              key={deliverable.id} 
              deliverable={deliverable} 
              isBoardView={true}
              showStatusDropdown={showStatusDropdown}
              onStatusDropdownToggle={onStatusDropdownToggle}
              onPostUpdate={onPostUpdate}
              onSelect={onSelect}
              showKebabMenu={showKebabMenu}
              onKebabMenuToggle={onKebabMenuToggle}
              hoveredCard={hoveredCard}
              onCardHover={onCardHover}
            />
          ))
        ) : (
          <EmptyColumnState />
        )}
      </div>
    </div>
  );

  // Get next status in workflow
  const getNextStatus = (currentStatus: string): string | null => {
    const workflow: Record<string, string> = {
      'planned': 'in_progress',
      'in_progress': 'in_review',
      'in_review': 'approved',
      'approved': 'complete',
      'revisions_requested': 'in_progress',
    };
    return workflow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return 'Next Step';
    
    const labels: Record<string, string> = {
      'in_progress': 'Start Progress',
      'in_review': 'Send to Review',
      'approved': 'Mark Approved',
      'complete': 'Mark Complete',
    };
    return labels[nextStatus] || 'Next Step';
  };

  const DeliverableRow = ({ 
    deliverable, 
    isBoardView = false,
    showStatusDropdown,
    onStatusDropdownToggle,
    onPostUpdate,
    onSelect,
    onDuplicate,
    onArchive,
    showKebabMenu,
    onKebabMenuToggle,
    hoveredCard,
    onCardHover,
    processingDeliverable,
  }: { 
    deliverable: Deliverable; 
    isBoardView?: boolean;
    showStatusDropdown?: string | null;
    onStatusDropdownToggle?: (id: string | null) => void;
    onPostUpdate?: (id: string) => void;
    onSelect?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onArchive?: (id: string) => void;
    showKebabMenu?: string | null;
    onKebabMenuToggle?: (id: string | null) => void;
    hoveredCard?: string | null;
    onCardHover?: (id: string | null) => void;
    processingDeliverable?: string | null;
  }) => {
    const proofCount = deliverable.deliverable_assets?.length || 0;
    const checklistMetrics = getChecklistMetrics(deliverable);
    const proofThumbnails = getProofThumbnails(deliverable.deliverable_assets);
    const lastUpdated = formatRelativeTime(deliverable.updated_at || deliverable.created_at);
    const isReadyForReview = checklistMetrics.total > 0 && checklistMetrics.completed >= checklistMetrics.total * 0.8 && proofCount > 0 && deliverable.status !== 'in_review' && deliverable.status !== 'approved' && deliverable.status !== 'complete';
    const isHovered = hoveredCard === deliverable.id;
    const isKebabOpen = showKebabMenu === deliverable.id;
    
    // Get recent updates (last 3) - filter by client_visible if client view
    const allUpdates = deliverable.deliverable_updates || [];
    const filteredUpdates = isClientView 
      ? allUpdates.filter((update: any) => update.client_visible !== false)
      : allUpdates;
    const recentUpdates = filteredUpdates
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    // Render card view
    return (
        <div 
          className="glass-panel rounded-xl p-5 hover:bg-white/5 transition-all cursor-pointer relative group border border-white/10"
          onClick={() => onSelect?.(deliverable.id)}
          onMouseEnter={() => onCardHover?.(deliverable.id)}
          onMouseLeave={() => onCardHover?.(null)}
        >
          <div className="flex flex-col gap-4">
            {/* Timeline of Updates */}
            {recentUpdates.length > 0 && (
              <div className="relative pb-3 border-b border-white/10 -mt-1">
                <div className="flex items-start gap-3">
                  {/* Vertical line */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent border-2 border-accent/30" />
                    <div className="w-px h-full min-h-[24px] bg-white/10 mt-1" />
                  </div>
                  
                  {/* Updates */}
                  <div className="flex-1 flex flex-col gap-2">
                    {recentUpdates.map((update: any, idx: number) => {
                      const stageLabel = getStatusLabel(update.stage);
                      const timeAgo = formatRelativeTime(update.created_at);
                      const isLast = idx === recentUpdates.length - 1;
                      
                      return (
                        <div key={update.id} className="flex items-start gap-2">
                          <div className="flex flex-col items-center gap-1 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(update.stage).split(' ')[0]} border-2 border-white/20`} />
                            {!isLast && (
                              <div className="w-px h-4 bg-white/10" />
                            )}
          </div>
          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-primary">{stageLabel}</span>
                              <span className="text-[9px] text-secondary/60">•</span>
                              <span className="text-[9px] text-secondary/60">{timeAgo}</span>
                            </div>
                            {update.note && (
                              <p className="text-[10px] text-secondary/70 mt-0.5 line-clamp-1">{update.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>
            )}

            {/* Top Row: Title, Type Badge, Due Date */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-primary mb-2.5 break-words leading-tight" style={{ wordBreak: 'break-word' }}>{deliverable.title}</h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded border whitespace-nowrap flex-shrink-0 ${getTypeColor(deliverable.type)}`}>
                    {deliverable.type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded border whitespace-nowrap flex-shrink-0 ${getStatusColor(deliverable.status)}`}>
            {getStatusLabel(deliverable.status)}
          </span>
                </div>
                {deliverable.status === 'in_review' && (
                  <p className="text-[10px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                    Waiting for client approval
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 pt-0.5">
                {deliverable.due_date ? (
                  <div className={`text-sm font-medium ${isOverdue(deliverable.due_date) ? 'text-red-400' : 'text-secondary'}`}>
                {new Date(deliverable.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(deliverable.id);
                    }}
                    className="text-xs px-2 py-1 rounded transition-all hover:bg-white/5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.62)',
                    }}
                  >
                    Set due date
                  </button>
                )}
              </div>
            </div>

            {/* Middle: Description */}
            {deliverable.description && (
              <p className="text-xs text-secondary/80 line-clamp-2 leading-relaxed -mt-1">{deliverable.description}</p>
            )}

            {/* Progress Bar */}
            {deliverable.progress !== undefined && deliverable.progress > 0 && (
              <div className="w-full">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4C8DFF] transition-all rounded-full"
                    style={{ width: `${deliverable.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metrics Row: Owner, Progress, Updated */}
            <div className="flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.62)' }}>
                {deliverable.assigned_to || deliverable.created_by ? (
                  <>
                    <span className="break-words" style={{ wordBreak: 'break-word' }} title={memberNames[deliverable.assigned_to || deliverable.created_by || ''] || deliverable.assigned_to || deliverable.created_by || ''}>
                      Owner: {memberNames[deliverable.assigned_to || deliverable.created_by || ''] || 
                              String(deliverable.assigned_to || deliverable.created_by || '')}
                    </span>
                    {checklistMetrics.total > 0 && <span>•</span>}
                  </>
                ) : null}
              {checklistMetrics.total > 0 && (
                <span className="font-medium">{checklistMetrics.completed}/{checklistMetrics.total} steps</span>
              )}
              </div>
              {lastUpdated && (
                <span style={{ color: 'rgba(255,255,255,0.62)' }}>Updated {lastUpdated}</span>
              )}
            </div>

            {/* Proof Thumbnails Strip */}
            {proofThumbnails.length > 0 && (
              <div className="flex items-center gap-1.5 -mt-1">
                {proofThumbnails.slice(0, 3).map((asset: any, idx: number) => (
                  <div key={idx} className="w-7 h-7 rounded border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 hover:border-white/20 transition-colors">
                    {(asset.url || asset.file_url) ? (
                      <img src={asset.url || asset.file_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
            </div>
          )}
                  </div>
                ))}
                {proofCount > 3 && (
                  <div className="w-7 h-7 rounded border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-secondary font-medium">
                    +{proofCount - 3}
                  </div>
          )}
        </div>
            )}

            {/* Kebab Menu - Bottom Right */}
        {isAdmin && (
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onKebabMenuToggle?.(isKebabOpen ? null : deliverable.id);
                  }}
                  className="p-1.5 rounded-lg text-secondary hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {isKebabOpen && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        onKebabMenuToggle?.(null);
                      }}
                    />
                    <div className="absolute top-full right-0 mt-1 glass-panel rounded-lg border border-white/10 shadow-xl z-50 overflow-hidden min-w-[180px]">
                      {/* Move to Next Step */}
                      {(() => {
                        const nextStatus = getNextStatus(deliverable.status);
                        if (!nextStatus) return null;
                        return (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const result = await updateDeliverableStatus(deliverable.id, nextStatus);
                                if (result.error) {
                                  alert(result.error);
                                  return;
                                }
                              onKebabMenuToggle?.(null);
                              router.refresh();
                              } catch (error) {
                                console.error('Error updating status:', error);
                                alert('Failed to update status');
                              }
                            }}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-[#4C8DFF] font-medium"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            {getNextStatusLabel(deliverable.status)}
                          </button>
                        );
                      })()}
                      
                      {/* Post Update */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostUpdate?.(deliverable.id);
                          onKebabMenuToggle?.(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-primary"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Post Update
                      </button>
                      
                      <div className="h-px bg-white/10 my-1" />
                      
                      {/* Move to... */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusDropdownToggle?.(deliverable.id);
                          onKebabMenuToggle?.(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-primary"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Move to...
                      </button>
                      
                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect?.(deliverable.id);
                          onKebabMenuToggle?.(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-primary"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      
                      {/* Duplicate */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          onKebabMenuToggle?.(null);
                          onDuplicate?.(deliverable.id);
                        }}
                        disabled={processingDeliverable === deliverable.id}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {processingDeliverable === deliverable.id ? 'Duplicating...' : 'Duplicate'}
                      </button>
                      
                      {/* Archive */}
            <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          onKebabMenuToggle?.(null);
                          onArchive?.(deliverable.id);
                        }}
                        disabled={processingDeliverable === deliverable.id}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        {processingDeliverable === deliverable.id ? 'Archiving...' : 'Archive'}
            </button>
                    </div>
                  </>
                )}
              </div>
            )}


            {/* Ready for Review CTA */}
            {isReadyForReview && isAdmin && !isHovered && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateDeliverableStatus(deliverable.id, 'in_review');
                  router.refresh();
                }}
                className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#4C8DFF]/20 text-[#4C8DFF] hover:bg-[#4C8DFF]/30 border border-[#4C8DFF]/30 transition-colors flex items-center justify-center gap-2 -mt-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Send to Client Review
              </button>
            )}
            
            {/* Status Dropdown - Show when triggered from kebab menu */}
            {showStatusDropdown === deliverable.id && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusDropdownToggle?.(null);
                  }}
                />
                <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel rounded-lg border border-white/10 shadow-xl z-50 overflow-hidden">
                  {['planned', 'in_progress', 'in_review', 'approved', 'complete'].map((status) => (
        <button
                      key={status}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const result = await updateDeliverableStatus(deliverable.id, status);
                          if (result.error) {
                            alert(result.error);
                            return;
                          }
                        onStatusDropdownToggle?.(null);
                        router.refresh();
                        } catch (error) {
                          console.error('Error updating status:', error);
                          alert('Failed to update status');
                        }
                      }}
                      className={`w-full px-3 py-2.5 text-xs text-left hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        deliverable.status === status ? 'bg-[#4C8DFF]/10 text-[#4C8DFF] font-medium' : 'text-primary'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
          </div>
              </>
            )}
          </div>
      </div>
    );
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedDeliverables.size === filteredAndSortedDeliverables.length) {
      setSelectedDeliverables(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedDeliverables(new Set(filteredAndSortedDeliverables.map(d => d.id)));
      setShowBulkActions(true);
    }
  };

  const handleSelectDeliverable = (id: string) => {
    const newSelected = new Set(selectedDeliverables);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDeliverables(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkStatusChange = async (status: string) => {
    try {
      const promises = Array.from(selectedDeliverables).map(async (id) => {
        const result = await updateDeliverableStatus(id, status);
        if (result.error) {
          throw new Error(`Failed to update ${id}: ${result.error}`);
        }
        return result;
      });
      await Promise.all(promises);
      setSelectedDeliverables(new Set());
      setShowBulkActions(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating statuses:', error);
      alert(error instanceof Error ? error.message : 'Failed to update statuses');
    }
  };

  const handleBulkArchive = () => {
    setArchiveTarget('bulk');
    setShowArchiveConfirm(true);
  };

  const confirmArchive = async () => {
    try {
      if (archiveTarget === 'bulk') {
        setProcessingDeliverable('bulk');
        const promises = Array.from(selectedDeliverables).map(async (id) => {
          const result = await archiveDeliverable(id);
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        });
        await Promise.all(promises);
        setSelectedDeliverables(new Set());
        setShowBulkActions(false);
        setProcessingDeliverable(null);
      } else if (archiveTarget) {
        setProcessingDeliverable(archiveTarget);
        const result = await archiveDeliverable(archiveTarget);
        if (result.error) {
          alert(result.error);
          setProcessingDeliverable(null);
          setShowKebabMenu(null);
          setShowArchiveConfirm(false);
          setArchiveTarget(null);
          return;
        }
        setProcessingDeliverable(null);
        setShowKebabMenu(null);
      }
      setShowArchiveConfirm(false);
      setArchiveTarget(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to archive deliverable(s)');
      setProcessingDeliverable(null);
      setShowKebabMenu(null);
      setShowArchiveConfirm(false);
      setArchiveTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.92)' }}>Deliverables</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {isClientView 
              ? 'Work completed and in progress for your organization'
              : 'Track, publish, and manage all client-facing work'
            }
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewDeliverable(true)}
            className="px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium flex-shrink-0 whitespace-nowrap transition-all duration-200 shadow-sm"
            style={{
              background: 'rgba(214, 179, 106, 0.15)',
              border: '1px solid rgba(214, 179, 106, 0.3)',
              color: 'rgba(214, 179, 106, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(214, 179, 106, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(214, 179, 106, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(214, 179, 106, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(214, 179, 106, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(214, 179, 106, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Plus className="w-4 h-4" />
            New Deliverable
          </button>
        )}
      </div>

        {/* Summary Metrics Row */}
        {!isClientView && deliverables.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'planned' ? null : 'planned');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: selectedStatus === 'planned' 
                  ? 'rgba(214, 179, 106, 0.15)' 
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedStatus === 'planned' ? 'rgba(214, 179, 106, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedStatus === 'planned' 
                  ? 'rgba(214, 179, 106, 1)' 
                  : 'rgba(255,255,255,0.92)',
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== 'planned') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== 'planned') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              Planned ({planned.length})
            </button>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'in_progress' ? null : 'in_progress');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: selectedStatus === 'in_progress' 
                  ? 'rgba(214, 179, 106, 0.15)' 
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedStatus === 'in_progress' ? 'rgba(214, 179, 106, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedStatus === 'in_progress' 
                  ? 'rgba(214, 179, 106, 1)' 
                  : 'rgba(255,255,255,0.92)',
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== 'in_progress') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== 'in_progress') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              In Progress ({inProgress.length})
            </button>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'in_review' ? null : 'in_review');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: selectedStatus === 'in_review' 
                  ? 'rgba(214, 179, 106, 0.15)' 
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedStatus === 'in_review' ? 'rgba(214, 179, 106, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedStatus === 'in_review' 
                  ? 'rgba(214, 179, 106, 1)' 
                  : 'rgba(255,255,255,0.92)',
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== 'in_review') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== 'in_review') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              In Review ({inReview.length})
            </button>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'approved' ? null : 'approved');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: selectedStatus === 'approved' 
                  ? 'rgba(214, 179, 106, 0.15)' 
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedStatus === 'approved' ? 'rgba(214, 179, 106, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedStatus === 'approved' 
                  ? 'rgba(214, 179, 106, 1)' 
                  : 'rgba(255,255,255,0.92)',
              }}
              onMouseEnter={(e) => {
                if (selectedStatus !== 'approved') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStatus !== 'approved') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              Approved ({approved.length})
            </button>
            {overdue.length > 0 && (
              <button
                onClick={() => {
                  setSelectedStatus(selectedStatus === '__overdue__' ? null : '__overdue__' as any);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: selectedStatus === '__overdue__' 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedStatus === '__overdue__' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedStatus === '__overdue__' 
                    ? 'rgba(239, 68, 68, 1)' 
                    : 'rgba(255,255,255,0.92)',
                }}
                onMouseEnter={(e) => {
                  if (selectedStatus !== '__overdue__') {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStatus !== '__overdue__') {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
              >
                Overdue ({overdue.length})
              </button>
            )}
          </div>
        )}

        {/* Controls Row: Search, Sort, View Toggle */}
        {deliverables.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {/* Search */}
            <div className="flex-1 min-w-[280px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.62)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(214, 179, 106, 0.3)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.62)' }} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('_');
                  setSortBy(by as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none pr-8 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(214, 179, 106, 0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <option value="updated_at_desc">Last updated (newest)</option>
                <option value="updated_at_asc">Last updated (oldest)</option>
                <option value="due_date_asc">Due date (soonest)</option>
                <option value="due_date_desc">Due date (latest)</option>
                <option value="status_asc">Status (A-Z)</option>
                <option value="status_desc">Status (Z-A)</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.62)' }} />
            </div>

            {/* View Toggle */}
            {isAdmin && !isClientView && (
              <div className="flex items-center gap-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px' }}>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    viewMode === 'list' ? '' : 'opacity-50'
                  }`}
                  style={{
                    background: viewMode === 'list' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    viewMode === 'cards' ? '' : 'opacity-50'
                  }`}
                  style={{
                    background: viewMode === 'cards' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <Grid className="w-3.5 h-3.5" />
                  Cards
                </button>
              </div>
            )}

            {/* Show Archived Toggle */}
            {isAdmin && !isClientView && (
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-accent"
                  style={{
                    accentColor: 'rgba(214, 179, 106, 1)',
                  }}
                />
                <span style={{ color: 'rgba(255,255,255,0.92)' }}>Show archived</span>
              </label>
            )}
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && selectedDeliverables.size > 0 && (
          <div className="mt-4 p-4 rounded-xl flex items-center justify-between gap-4 shadow-lg" style={{ background: 'rgba(214, 179, 106, 0.1)', border: '1px solid rgba(214, 179, 106, 0.2)' }}>
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {selectedDeliverables.size} {selectedDeliverables.size === 1 ? 'deliverable' : 'deliverables'} selected
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none pr-8 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <option value="">Change status...</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="complete">Complete</option>
              </select>
              <button
                onClick={handleBulkArchive}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/20"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'rgba(239, 68, 68, 1)',
                }}
              >
                Archive
              </button>
              <button
                onClick={() => {
                  setSelectedDeliverables(new Set());
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
          {deliverables.length === 0 ? (
        isAdmin && !isClientView ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="rounded-xl p-10 max-w-lg w-full text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(214, 179, 106, 0.1)', border: '1px solid rgba(214, 179, 106, 0.2)' }}>
                <FileText className="w-10 h-10" style={{ color: 'rgba(214, 179, 106, 0.8)' }} />
              </div>
              <h2 className="text-2xl font-light mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>Create your first deliverable</h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.62)' }}>
                Track and share completed work with your clients. Reports, automations, creatives, and more.
              </p>
                  <button
                    onClick={() => setShowNewDeliverable(true)}
                className="w-full px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all"
                style={{
                  background: 'rgba(214, 179, 106, 0.15)',
                  border: '1px solid rgba(214, 179, 106, 0.3)',
                  color: 'rgba(214, 179, 106, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(214, 179, 106, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(214, 179, 106, 0.15)';
                }}
              >
                <Plus className="w-4 h-4" />
                New Deliverable
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'rgba(255,255,255,0.62)' }} />
            <h2 className="text-lg font-light mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>No deliverables yet</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
              Work will appear here once it's completed and shared.
            </p>
          </div>
        )
      ) : (
        // Main Content Area with Sidebar
        <div className="flex gap-6 flex-1 min-h-0 overflow-hidden max-w-full">
          {/* Main Content */}
          <div className={`flex-1 min-w-0 overflow-hidden max-w-full ${deliverables.length < 4 && !isClientView ? 'lg:max-w-[calc(100%-336px)]' : ''}`}>
            {filteredAndSortedDeliverables.length === 0 ? (
              // Empty filtered state
              <div className="rounded-lg p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'rgba(255,255,255,0.62)' }} />
                <h2 className="text-lg font-medium mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>No deliverables match your filters</h2>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  {searchQuery || selectedStatus 
                    ? 'Try adjusting your search or filters'
                    : 'No deliverables found'}
                </p>
                {(searchQuery || selectedStatus) && (
            <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                  >
                    Clear filters
            </button>
                )}
              </div>
            ) : viewMode === 'list' && isAdmin && !isClientView ? (
              // Table View
              <div className="rounded-xl overflow-hidden max-w-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full" style={{ tableLayout: 'auto', width: '100%' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <th className="px-4 py-4 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedDeliverables.size === filteredAndSortedDeliverables.length && filteredAndSortedDeliverables.length > 0}
                            onChange={handleSelectAll}
                            className="rounded w-4 h-4 cursor-pointer"
                            style={{
                              accentColor: 'rgba(214, 179, 106, 1)',
                            }}
                          />
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Deliverable</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Status</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Due</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Owner</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Progress</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)', width: 'auto' }}>Last Updated</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-12" style={{ color: 'rgba(255,255,255,0.62)' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedDeliverables.map((deliverable, idx) => {
                        const checklistMetrics = getChecklistMetrics(deliverable);
                        const isSelected = selectedDeliverables.has(deliverable.id);
                        return (
                          <tr
                            key={deliverable.id}
                            onClick={() => isAdmin ? setShowPostUpdate(deliverable.id) : setShowEditDeliverable(deliverable.id)}
                            className="cursor-pointer transition-all duration-150"
                            style={{
                              borderBottom: idx < filteredAndSortedDeliverables.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
                              e.currentTarget.style.borderBottomColor = idx < filteredAndSortedDeliverables.length - 1 ? 'rgba(255,255,255,0.05)' : 'transparent';
                            }}
                          >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectDeliverable(deliverable.id)}
                                className="rounded w-4 h-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  accentColor: 'rgba(214, 179, 106, 1)',
                                }}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="font-semibold text-base leading-tight break-words" style={{ color: 'rgba(255,255,255,0.95)', wordBreak: 'break-word' }}>
                                  {deliverable.title}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border flex-shrink-0 whitespace-nowrap ${getTypeColor(deliverable.type)}`}>
                                    {deliverable.type}
                                  </span>
                                  {deliverable.description && (
                                    <span className="text-xs break-words" style={{ color: 'rgba(255,255,255,0.62)', maxWidth: '100%', wordBreak: 'break-word' }} title={deliverable.description}>
                                      {deliverable.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-md border whitespace-nowrap ${getStatusColor(deliverable.status)}`}>
                                  {getStatusLabel(deliverable.status)}
                                </span>
                                {deliverable.status === 'in_review' && (
                                  <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)' }}>
                                    Waiting for client approval
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {deliverable.due_date ? (
                                <div className={`text-sm font-medium ${isOverdue(deliverable.due_date) ? 'text-red-400' : ''}`} style={{ color: isOverdue(deliverable.due_date) ? undefined : 'rgba(255,255,255,0.92)' }}>
                                  {new Date(deliverable.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              ) : (
            <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditDeliverable(deliverable.id);
                                  }}
                                  className="text-xs px-2.5 py-1 rounded-md transition-all hover:bg-white/5"
                                  style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.62)',
                                  }}
                                >
                                  Set due date
            </button>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium break-words" style={{ color: 'rgba(255,255,255,0.92)', wordBreak: 'break-word', maxWidth: '150px' }} title={memberNames[deliverable.assigned_to || deliverable.created_by || ''] || deliverable.assigned_to || deliverable.created_by || ''}>
                                {deliverable.assigned_to || deliverable.created_by ? (
                                  <span className="break-words block">
                                    {memberNames[deliverable.assigned_to || deliverable.created_by || ''] || 
                                     String(deliverable.assigned_to || deliverable.created_by || '')}
                                  </span>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {checklistMetrics.total > 0 ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="text-sm font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.92)' }}>
                                    {checklistMetrics.completed}/{checklistMetrics.total}
                                  </div>
                                  <div className="flex-1 min-w-[60px] h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div 
                                      className="h-full transition-all rounded-full"
                                      style={{ 
                                        width: `${(checklistMetrics.completed / checklistMetrics.total) * 100}%`,
                                        background: 'rgba(214, 179, 106, 0.6)',
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : deliverable.progress !== undefined && deliverable.progress > 0 ? (
                                <div className="w-full max-w-[80px]">
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div 
                                      className="h-full transition-all rounded-full"
                                      style={{ 
                                        width: `${deliverable.progress}%`,
                                        background: 'rgba(214, 179, 106, 0.6)',
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.62)' }}>
                                {formatRelativeTime(deliverable.updated_at || deliverable.created_at)}
                              </div>
                            </td>
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
              <button
                                  onClick={() => setShowKebabMenu(showKebabMenu === deliverable.id ? null : deliverable.id)}
                                  className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.62)' }} />
                  </button>
                                {showKebabMenu === deliverable.id && (
                                  <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-10 min-w-[150px]" style={{ background: 'rgba(11, 15, 20, 0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
                                      onClick={() => {
                                        setShowEditDeliverable(deliverable.id);
                                        setShowKebabMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2"
                                      style={{ color: 'rgba(255,255,255,0.92)' }}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      Edit
            </button>
            <button
                                      onClick={async () => {
                                        setProcessingDeliverable(deliverable.id);
                                        try {
                                          const result = await duplicateDeliverable(deliverable.id);
                                          if (result.error) {
                                            alert(result.error);
                                          } else {
                                            router.refresh();
                                          }
                                        } catch (error) {
                                          alert('Failed to duplicate deliverable');
                                        } finally {
                                          setProcessingDeliverable(null);
                                          setShowKebabMenu(null);
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2"
                                      style={{ color: 'rgba(255,255,255,0.92)' }}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      Duplicate
            </button>
            <button
                                      onClick={() => {
                                        setArchiveTarget(deliverable.id);
                                        setShowArchiveConfirm(true);
                                        setShowKebabMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors flex items-center gap-2"
                                      style={{ color: 'rgba(239, 68, 68, 1)' }}
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                      Archive
            </button>
              </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            </div>
          ) : (
              // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedDeliverables.map((deliverable) => (
                <DeliverableRow
                  key={deliverable.id}
                  deliverable={deliverable}
                  isBoardView={false}
                  showStatusDropdown={showStatusDropdown}
                  onStatusDropdownToggle={setShowStatusDropdown}
                  onPostUpdate={setShowPostUpdate}
                  onSelect={(id) => isAdmin ? setShowPostUpdate(id) : setShowEditDeliverable(id)}
                  onDuplicate={async (id) => {
                    setProcessingDeliverable(id);
                    try {
                      const result = await duplicateDeliverable(id);
                      if (result.error) {
                        alert(result.error);
                      } else {
                        router.refresh();
                      }
                    } catch (error) {
                      alert('Failed to duplicate deliverable');
                    } finally {
                      setProcessingDeliverable(null);
                    }
                  }}
                  onArchive={(id) => {
                    setArchiveTarget(id);
                    setShowArchiveConfirm(true);
                  }}
                  showKebabMenu={showKebabMenu}
                  onKebabMenuToggle={setShowKebabMenu}
                  hoveredCard={hoveredCard}
                  onCardHover={setHoveredCard}
                  processingDeliverable={processingDeliverable}
                />
              ))}
            </div>
              )}
        </div>

          {/* Right Sidebar - Only show when < 4 deliverables */}
          {deliverables.length < 4 && !isClientView && (
            <div className="hidden lg:block w-80 flex-shrink-0 overflow-hidden max-w-[320px]">
              <div className="sticky top-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden">
                {/* Upcoming Deadlines */}
                <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>Upcoming Deadlines</h3>
                  <div className="space-y-2">
                    {deliverables
                      .filter(d => d.due_date && d.status !== 'complete' && d.status !== 'approved')
                      .sort((a, b) => {
                        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
                        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
                        return aDate - bDate;
                      })
                      .slice(0, 5)
                      .map(deliverable => (
                        <button
                          key={deliverable.id}
                          onClick={() => isAdmin ? setShowPostUpdate(deliverable.id) : setShowEditDeliverable(deliverable.id)}
                          className="w-full text-left p-2 rounded transition-colors hover:bg-white/5"
                        >
                          <div className="text-sm font-medium mb-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
                            {deliverable.title}
                          </div>
                          <div className="text-xs flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                            <Calendar className="w-3 h-3" />
                            {deliverable.due_date && new Date(deliverable.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </button>
                      ))}
                    {deliverables.filter(d => d.due_date && d.status !== 'complete' && d.status !== 'approved').length === 0 && (
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>No upcoming deadlines</p>
                      )}
                  </div>
                </div>

                {/* Recently Updated */}
                <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>Recently Updated</h3>
                  <div className="space-y-2">
                    {deliverables
                      .sort((a, b) => {
                        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
                        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
                        return bTime - aTime;
                      })
                      .slice(0, 5)
                      .map(deliverable => (
                        <button
                          key={deliverable.id}
                          onClick={() => isAdmin ? setShowPostUpdate(deliverable.id) : setShowEditDeliverable(deliverable.id)}
                          className="w-full text-left p-2 rounded transition-colors hover:bg-white/5"
                        >
                          <div className="text-sm font-medium mb-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
                            {deliverable.title}
                          </div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>
                            {formatRelativeTime(deliverable.updated_at || deliverable.created_at)}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Needs Review */}
                {inReview.length > 0 && (
                  <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>Needs Review</h3>
                    <div className="space-y-2">
                      {inReview.slice(0, 5).map(deliverable => (
                        <button
                          key={deliverable.id}
                          onClick={() => isAdmin ? setShowPostUpdate(deliverable.id) : setShowEditDeliverable(deliverable.id)}
                          className="w-full text-left p-2 rounded transition-colors hover:bg-white/5"
                        >
                          <div className="text-sm font-medium mb-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
                            {deliverable.title}
                          </div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>
                            Awaiting approval
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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

      {/* Add Proof Item Modal */}
      {showAddProof && (
        <AddProofItemModal
          deliverableId={showAddProof}
          orgId={orgId}
          onClose={() => setShowAddProof(null)}
          onSuccess={() => {
            setShowAddProof(null);
            router.refresh();
          }}
        />
      )}

      {/* Post Update Modal */}
      {showPostUpdate && (() => {
        const deliverable = deliverables.find(d => d.id === showPostUpdate);
        return (
          <PostUpdateModal
            deliverableId={showPostUpdate}
            deliverableTitle={deliverable?.title}
            orgId={orgId}
            orgName={orgName}
            onClose={() => setShowPostUpdate(null)}
            onSuccess={() => {
              setShowPostUpdate(null);
              router.refresh();
            }}
          />
        );
      })()}

      {/* Edit Deliverable Modal */}
      {showEditDeliverable && (() => {
        const deliverableToEdit = deliverables.find(d => d.id === showEditDeliverable);
        if (!deliverableToEdit) return null;
        
        return (
          <EditDeliverableModal
            deliverable={deliverableToEdit as any}
            orgId={orgId}
            onClose={() => setShowEditDeliverable(null)}
            onSuccess={() => {
              setShowEditDeliverable(null);
              router.refresh();
            }}
          />
        );
      })()}

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={showArchiveConfirm}
        title="Archive Deliverable"
        message={
          archiveTarget === 'bulk'
            ? `Archive ${selectedDeliverables.size} deliverable(s)? This action cannot be undone.`
            : 'Archive this deliverable? This action cannot be undone.'
        }
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={confirmArchive}
        onCancel={() => {
          setShowArchiveConfirm(false);
          setArchiveTarget(null);
        }}
        variant="danger"
      />
    </div>
  );
}
