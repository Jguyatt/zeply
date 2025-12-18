'use client';

import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: string;
    body: string;
    created_at: string;
    author_role: string;
    delivered_at?: string | null;
    is_read?: boolean;
    read_at?: string | null;
  };
  isOwnMessage: boolean;
  showSenderLabel: boolean;
  isGrouped: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showSenderLabel,
  isGrouped,
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Show receipts only for own messages
  const showReceipts = isOwnMessage;
  // Check delivered status - if delivered_at exists, it's delivered. Otherwise assume delivered if message exists (fallback)
  const isDelivered = !!message.delivered_at || true; // Always show as delivered if message exists
  const isRead = !!message.is_read;

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}
    >
      <div
        className={`max-w-[70%] rounded-xl p-3 ${
          isOwnMessage
            ? 'rounded-br-sm'
            : 'rounded-bl-sm'
        }`}
        style={{
          background: isOwnMessage 
            ? 'rgba(255,255,255,0.06)' 
            : 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        {showSenderLabel && (
          <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {message.author_role === 'agency' ? 'Agency' : 'Client'}
          </div>
        )}
        <p 
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {message.body}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {formatTime(message.created_at)}
          </div>
          {showReceipts && (
            <div className="flex items-center gap-1 ml-2">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5" style={{ color: 'rgba(76, 141, 255, 0.8)' }} />
              ) : (
                <Check className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

