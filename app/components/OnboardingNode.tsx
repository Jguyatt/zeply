'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, ListChecks, Shield, FileSignature, CreditCard, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface OnboardingNodeProps {
  data: {
    label: string;
    type: string;
    required: boolean;
    config?: any;
    title?: string;
    isComplete?: boolean;
    missingFields?: string[];
    onDelete?: () => void;
  };
  selected?: boolean;
}

const typeIcons: Record<string, any> = {
  welcome: FileText,
  scope: ListChecks,
  terms: Shield,
  contract: FileSignature,
  invoice: CreditCard,
};

export default function OnboardingNode({ data, selected }: OnboardingNodeProps) {
  const Icon = typeIcons[data.type] || FileText;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="relative group">
      <div
        className={`glass-surface rounded-lg p-4 min-w-[200px] border ${
          selected 
            ? 'ring-2 ring-accent border-accent/50' 
            : 'border-white/10 hover:border-white/20'
        } transition-all shadow-prestige-soft`}
      >
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 bg-accent/80 border-2 border-charcoal hover:bg-accent transition-colors"
          style={{ top: -6 }}
        />
        
        <div className="flex items-center gap-3">
          <div className="p-2 glass-surface rounded-lg bg-accent/10 border border-accent/20">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-primary font-medium text-sm truncate">{data.label}</div>
              {data.isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" title="Complete" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" title={data.missingFields?.join(', ') || 'Incomplete'} />
              )}
            </div>
            {data.required && (
              <span className="text-xs text-accent font-medium">Required</span>
            )}
            {!data.isComplete && data.missingFields && data.missingFields.length > 0 && (
              <div className="text-xs text-yellow-400 mt-0.5">
                {data.missingFields[0]}{data.missingFields.length > 1 ? ` +${data.missingFields.length - 1}` : ''}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {data.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-1.5 glass-surface rounded hover:bg-red-500/10 transition-colors"
                title="Delete node"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        </div>

        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 bg-accent/80 border-2 border-charcoal hover:bg-accent transition-colors"
          style={{ bottom: -6 }}
        />
      </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Node"
        message="Are you sure you want to delete this node? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          data.onDelete?.();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

