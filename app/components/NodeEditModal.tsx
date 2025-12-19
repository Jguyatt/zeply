'use client';

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Node } from 'reactflow';
import NodeSettingsPanel from './NodeSettingsPanel';
import { checkNodeCompletion } from '@/app/lib/onboarding-node-validation';

interface NodeEditModalProps {
  node: Node | null;
  orgId: string;
  clerkOrgId: string;
  onClose: () => void;
  onUpdate: (updatedNodeData?: any) => void | Promise<void>;
}

export default function NodeEditModal({
  node,
  orgId,
  clerkOrgId,
  onClose,
  onUpdate,
}: NodeEditModalProps) {
  if (!node || typeof window === 'undefined') return null;

  // Recalculate completion status whenever node config or title changes
  const completionStatus = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NodeEditModal.tsx:28',message:'Recalculating completion status',data:{nodeId:node.id,nodeType:node.data.type,hasConfig:!!node.data.config,configKeys:node.data.config?Object.keys(node.data.config):[],title:node.data.title||node.data.label},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const result = checkNodeCompletion(
      node.data.type,
      node.data.config || {},
      node.data.title || node.data.label
    );
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NodeEditModal.tsx:35',message:'Completion status calculated',data:{isComplete:result.isComplete,missingFields:result.missingFields},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result;
  }, [node.data.type, node.data.config, node.data.title, node.data.label]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-primary">{node.data.label || node.data.title}</h2>
              {completionStatus.isComplete ? (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md border border-green-500/30 font-medium">
                  Setup Complete
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-md border border-yellow-500/30">
                  Incomplete
                </span>
              )}
            </div>
            {!completionStatus.isComplete && completionStatus.missingFields.length > 0 && (
              <p className="text-sm text-yellow-400 mt-2">
                Missing: {completionStatus.missingFields.join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <NodeSettingsPanel
            node={node}
            orgId={orgId}
            clerkOrgId={clerkOrgId}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

