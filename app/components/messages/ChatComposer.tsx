'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  onSend: (message: string) => Promise<void>;
  loading: boolean;
  placeholder?: string;
  suggestedText?: string;
}

export default function ChatComposer({
  onSend,
  loading,
  placeholder = 'Type a message...',
  suggestedText,
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert suggested text if provided
  useEffect(() => {
    if (suggestedText && textareaRef.current) {
      setMessage(suggestedText);
      textareaRef.current.focus();
    }
  }, [suggestedText]);

  // Auto-grow textarea (max 4 lines)
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 4 * 24; // 4 lines * line-height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const messageText = message.trim();
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(messageText);
  };

  return (
    <div
      className="p-4 border-t"
      style={{
        background: '#0B0F14',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            rows={1}
            className="w-full px-4 py-3 rounded-lg resize-none focus:outline-none text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
              minHeight: '44px',
              maxHeight: '96px',
            }}
          />
          <p className="text-xs mt-1.5 ml-1" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Enter to send • Shift+Enter for new line
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: message.trim() && !loading 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.92)',
          }}
          onMouseEnter={(e) => {
            if (!loading && message.trim()) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && message.trim()) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </form>
    </div>
  );
}

