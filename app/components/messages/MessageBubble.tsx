'use client';

interface MessageBubbleProps {
  message: {
    id: string;
    body: string;
    created_at: string;
    author_role: string;
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
        <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.62)' }}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}

