'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'default';
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen || typeof window === 'undefined') return null;

  const variantStyles = {
    danger: {
      confirmBg: 'bg-red-500/20 hover:bg-red-500/30',
      confirmText: 'text-red-400',
      confirmBorder: 'border-red-500/30',
      icon: 'text-red-400',
    },
    warning: {
      confirmBg: 'bg-yellow-500/20 hover:bg-yellow-500/30',
      confirmText: 'text-yellow-400',
      confirmBorder: 'border-yellow-500/30',
      icon: 'text-yellow-400',
    },
    default: {
      confirmBg: 'bg-accent/20 hover:bg-accent/30',
      confirmText: 'text-accent',
      confirmBorder: 'border-accent/30',
      icon: 'text-accent',
    },
  };

  const styles = variantStyles[variant];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative glass-surface border border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-secondary mb-6">{message}</p>
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 glass-surface rounded-lg hover:bg-white/10 transition-all text-sm border border-white/10 text-secondary"
            >
              {cancelText}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
              className={`px-4 py-2 rounded-lg transition-all text-sm border ${styles.confirmBg} ${styles.confirmText} ${styles.confirmBorder} font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

