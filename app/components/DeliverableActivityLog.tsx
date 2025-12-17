'use client';

import { Clock, CheckCircle2, MessageSquare, FileText, Link as LinkIcon } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface DeliverableActivityLogProps {
  activities: ActivityLogEntry[];
  currentUserId?: string;
}

export default function DeliverableActivityLog({
  activities,
  currentUserId,
}: DeliverableActivityLogProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'status_change':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'checklist_item':
      case 'checklist_item_added':
      case 'checklist_item_removed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'proof_added':
      case 'proof_removed':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatAction = (activity: ActivityLogEntry): string => {
    switch (activity.action) {
      case 'status_change':
        if (activity.old_value && activity.new_value) {
          return `Status changed from ${activity.old_value.replace('_', ' ')} to ${activity.new_value.replace('_', ' ')}`;
        }
        return `Status changed to ${activity.new_value?.replace('_', ' ') || 'unknown'}`;
      case 'checklist_item':
        const itemTitle = activity.metadata?.item_title || 'item';
        return activity.new_value === 'true'
          ? `Completed "${itemTitle}"`
          : `Uncompleted "${itemTitle}"`;
      case 'checklist_item_added':
        const addedTitle = activity.metadata?.item_title || 'item';
        return `Added checklist item: "${addedTitle}"`;
      case 'checklist_item_removed':
        return 'Removed checklist item';
      case 'proof_added':
        return 'Added proof item';
      case 'proof_removed':
        return 'Removed proof item';
      case 'comment':
        return 'Added comment';
      default:
        return activity.action.replace('_', ' ');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'text-blue-400';
      case 'checklist_item':
      case 'checklist_item_added':
        return 'text-green-400';
      case 'proof_added':
        return 'text-purple-400';
      case 'comment':
        return 'text-yellow-400';
      default:
        return 'text-secondary';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="p-8 rounded-lg border border-white/10 bg-white/2 text-center">
        <Clock className="w-8 h-8 text-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm text-secondary">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-primary mb-4">Activity Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                getActionColor(activity.action).replace('text-', 'bg-').replace('-400', '-400/20')
              } border-2 border-white/20`}>
                <div className={getActionColor(activity.action)}>
                  {getActionIcon(activity.action)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm text-primary">
                  {formatAction(activity)}
                </p>
                {activity.metadata?.reason && (
                  <p className="text-xs text-secondary mt-1">
                    Reason: {activity.metadata.reason}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

