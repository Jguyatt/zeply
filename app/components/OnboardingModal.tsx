'use client';

import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'info' | 'warning';
}

export default function OnboardingModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: OnboardingModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeColors = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-[#D6B36A]',
  };

  const typeBgColors = {
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-[#D6B36A]/10 border-[#D6B36A]/20',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${typeBgColors[type]} flex items-center justify-center`}>
            <AlertCircle className={`w-6 h-6 ${typeColors[type]}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {title}
              </h3>
            )}
            <p 
              className="text-neutral-300 leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black font-medium rounded-lg transition-all duration-200"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
