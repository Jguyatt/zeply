'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: any[];
  isAgency: boolean;
  isClientView: boolean;
}

export default function MessageList({
  messages,
  isAgency,
  isClientView,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages: consecutive messages from same sender within 3 minutes
  const groupedMessages = messages.map((message, index) => {
    if (index === 0) {
      return { ...message, showSenderLabel: true, isGrouped: false };
    }

    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
    const isSameSender = message.author_role === prevMessage.author_role;
    const isWithin3Minutes = timeDiff < 3 * 60 * 1000;

    return {
      ...message,
      showSenderLabel: !isSameSender || !isWithin3Minutes,
      isGrouped: isSameSender && isWithin3Minutes,
    };
  });

  // Group messages by date for date separators
  const messagesByDate: { [key: string]: any[] } = {};
  groupedMessages.forEach((msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(msg);
  });

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  if (groupedMessages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6"
      style={{ background: '#0B0F14' }}
    >
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-6">
            <div
              className="px-4 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.62)',
              }}
            >
              {formatDateHeader(date)}
            </div>
          </div>

          {/* Messages for this date */}
          {dateMessages.map((message) => {
            const isOwnMessage = message.author_role === (isAgency ? 'agency' : 'client');
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showSenderLabel={message.showSenderLabel}
                isGrouped={message.isGrouped}
              />
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

