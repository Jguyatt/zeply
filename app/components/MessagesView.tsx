'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { sendMessage, getMessages } from '@/app/actions/messages';
import { useRouter } from 'next/navigation';

interface MessagesViewProps {
  conversationId: string;
  orgId: string;
  initialMessages: any[];
  isAgency: boolean;
  agencyAdmins?: any[];
  clientMemberName?: string;
  clientMemberImageUrl?: string;
  clientMemberFullName?: string;
  isClientView?: boolean;
}

export default function MessagesView({
  conversationId,
  orgId,
  initialMessages,
  isAgency,
  agencyAdmins = [],
  clientMemberName,
  clientMemberImageUrl,
  clientMemberFullName,
  isClientView = false,
}: MessagesViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const result: any = await getMessages(conversationId, orgId);
      if (result && result.data) {
        setMessages(result.data);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, orgId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    const result: any = await sendMessage(conversationId, orgId, messageText);

    if (result && result.data) {
      setMessages([...messages, result.data]);
      router.refresh();
    } else {
      const error = result?.error || 'Failed to send message';
      alert(error);
      setNewMessage(messageText); // Restore message on error
    }

    setLoading(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get agency admin info (for client view)
  const activeAdmin = agencyAdmins.length > 0 ? agencyAdmins[0] : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-light text-primary">Messages</h1>
        <p className="text-secondary mt-2">
          {isClientView
            ? activeAdmin 
              ? `Communication with ${activeAdmin.fullName || activeAdmin.email}`
              : 'Communication with admin'
            : isAgency 
              ? clientMemberFullName || clientMemberName 
                ? `Communication with ${clientMemberFullName || clientMemberName}`
                : 'Communication with client'
              : 'Communication with your team'
          }
        </p>
      </div>

      {/* Client Member Info (Agency View) */}
      {isAgency && clientMemberName && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-accent/50">
          <div className="flex items-center gap-3">
            {clientMemberImageUrl ? (
              <img
                src={clientMemberImageUrl}
                alt={clientMemberFullName || clientMemberName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                {(clientMemberFullName || clientMemberName || 'M')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-primary">
                {clientMemberFullName || clientMemberName}
              </p>
              <p className="text-xs text-secondary">
                Client Member
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agency Admin Info (Client View) */}
      {isClientView && activeAdmin && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-accent/50">
          <div className="flex items-center gap-3">
            {activeAdmin.imageUrl ? (
              <img
                src={activeAdmin.imageUrl}
                alt={activeAdmin.fullName || 'Admin'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                {(activeAdmin.fullName || activeAdmin.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-primary">
                {activeAdmin.fullName || activeAdmin.email}
              </p>
              <p className="text-xs text-secondary">
                {activeAdmin.role === 'owner' ? 'Owner' : 'Admin'} • {activeAdmin.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Response Time Banner (Client View Only) */}
      {!isAgency && isClientView && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-4 border-l-4 border-accent/50">
          <p className="text-sm text-secondary">
            <strong className="text-primary">Response time:</strong> We typically reply within 24 business hours.
          </p>
        </div>
      )}

      {/* Messages Container - Always visible */}
      <div className="glass-surface rounded-lg shadow-prestige-soft flex flex-col" style={{ height: '600px' }}>
        {/* Messages List */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted mb-4" />
              <h3 className="text-lg font-light text-primary mb-2">No messages yet</h3>
              <p className="text-secondary text-sm max-w-md">
                {isClientView
                  ? 'This is your message thread with your team. Send a message to get started.'
                  : 'This is the shared message thread between your agency and this client.'
                }
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.author_role === (isAgency ? 'agency' : 'client');
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      isOwnMessage
                        ? 'bg-accent/20 text-primary'
                        : 'glass-surface text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-secondary">
                        {isClientView
                          ? message.author_role === 'agency' ? 'Your team' : 'You'
                          : message.author_role === 'agency' ? 'Agency' : 'Client'
                        }
                      </span>
                      <span className="text-xs text-muted">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - ALWAYS visible */}
        <div className="p-4 glass-border-t">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <form onSubmit={handleSend} className="w-full flex items-center gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isClientView ? 'Message your team...' : 'Send first message to client...'}
                  className="flex-1 px-4 py-3 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10 text-sm resize-none"
                  rows={3}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Send className="w-4 h-4" />
                  Send message
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isClientView ? 'Message your team...' : 'Reply to client...'}
                className="flex-1 px-4 py-3 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10 text-sm resize-none"
                rows={2}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-4 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 shadow-prestige-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
