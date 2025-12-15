'use client';

import { Handle, Position } from 'reactflow';
import { FileText, CreditCard, FileSignature, CheckSquare, Upload, Plug, Phone, Trash2 } from 'lucide-react';

interface OnboardingNodeProps {
  data: {
    label: string;
    type: string;
    required: boolean;
    onDelete?: () => void;
  };
  selected?: boolean;
}

const typeIcons: Record<string, any> = {
  welcome: FileText,
  payment: CreditCard,
  contract: FileSignature,
  consent: CheckSquare,
  upload: Upload,
  connect: Plug,
  call: Phone,
};

export default function OnboardingNode({ data, selected }: OnboardingNodeProps) {
  const Icon = typeIcons[data.type] || FileText;

  return (
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
            <div className="text-primary font-medium text-sm truncate">{data.label}</div>
            {data.required && (
              <span className="text-xs text-accent font-medium">Required</span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {data.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this node?')) {
                    data.onDelete?.();
                  }
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
  );
}

