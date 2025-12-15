'use client';

import { FileText, CreditCard, FileSignature, CheckSquare, Upload, Plug, Phone } from 'lucide-react';

interface StepLibraryProps {
  onAddNode: (type: string) => void;
}

const stepTypes = [
  { type: 'welcome', label: 'Welcome Doc', icon: FileText },
  { type: 'payment', label: 'Payment Link', icon: CreditCard },
  { type: 'contract', label: 'Contract (In-App)', icon: FileSignature },
  { type: 'consent', label: 'Checkbox / Consent', icon: CheckSquare },
  { type: 'upload', label: 'File Upload', icon: Upload },
  { type: 'connect', label: 'Connect Account', icon: Plug },
  { type: 'call', label: 'Book Call', icon: Phone },
];

export default function StepLibrary({ onAddNode }: StepLibraryProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-secondary mb-4">Step Library</h3>
      <p className="text-xs text-muted mb-4">Drag steps to canvas or click to add</p>
      {stepTypes.map((step) => {
        const Icon = step.icon;
        return (
          <button
            key={step.type}
            draggable
            onDragStart={(e) => onDragStart(e, step.type)}
            onClick={() => onAddNode(step.type)}
            className="w-full p-3 glass-surface rounded-lg hover:bg-white/10 transition-all flex items-center gap-3 text-left cursor-grab active:cursor-grabbing border border-white/5 hover:border-white/10"
          >
            <Icon className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-primary text-sm">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

