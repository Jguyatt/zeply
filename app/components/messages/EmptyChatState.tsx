'use client';

import { MessageSquare } from 'lucide-react';

interface EmptyChatStateProps {
  onQuickAction: (text: string) => void;
  isClientView?: boolean;
}

export default function EmptyChatState({
  onQuickAction,
  isClientView = false,
}: EmptyChatStateProps) {
  const quickActions = isClientView
    ? [
        { label: 'Request Update', text: 'Hey! Could you provide an update on the current progress? I\'d love to know what\'s been completed and what\'s coming next.' },
        { label: 'Request information', text: 'Hey! I need some info about...' },
        { label: 'Ask a question', text: 'Quick question - ...' },
      ]
    : [
        { label: 'Send welcome message', text: 'Hey! Welcome to your portal. This is where we\'ll keep you updated on everything we\'re working on and chat about the project. Feel free to reach out anytime - we\'re here to help!' },
        { label: 'Request access / info', text: 'Hey! To get things rolling, could you share access to [platform/account]? Let me know if you run into any issues or have questions.' },
      ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <MessageSquare className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.62)' }} />
      </div>
      <h3 className="text-xl font-light mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
        Start the conversation
      </h3>
      <p className="text-sm mb-8 max-w-md" style={{ color: 'rgba(255,255,255,0.62)' }}>
        Messages are shared with the {isClientView ? 'team' : 'client'} and stored in this thread.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.text)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

