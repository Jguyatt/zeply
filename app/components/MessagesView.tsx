'use client';

import { useState, useEffect } from 'react';
import { sendMessage, getMessages } from '@/app/actions/messages';
import { useRouter } from 'next/navigation';
import ChatHeader from './messages/ChatHeader';
import MessageList from './messages/MessageList';
import ChatComposer from './messages/ChatComposer';
import EmptyChatState from './messages/EmptyChatState';

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
  const [loading, setLoading] = useState(false);
  const [suggestedText, setSuggestedText] = useState<string | undefined>(undefined);

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

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    setLoading(true);

    const result: any = await sendMessage(conversationId, orgId, messageText);

    if (result && result.data) {
      setMessages([...messages, result.data]);
      router.refresh();
      setSuggestedText(undefined); // Clear suggested text after sending
    } else {
      const error = result?.error || 'Failed to send message';
      alert(error);
    }

    setLoading(false);
  };

  const handleQuickAction = (text: string) => {
    setSuggestedText(text);
  };

  // Get agency admin info (for client view)
  const activeAdmin = agencyAdmins.length > 0 ? agencyAdmins[0] : null;

  // Determine member info for header
  // Prioritize full name from Clerk, otherwise try to format from email
  const getDisplayName = () => {
    if (isClientView) {
      return activeAdmin?.fullName || activeAdmin?.email || 'Admin';
    }
    
    // If we have a full name from Clerk, use it
    if (clientMemberFullName && clientMemberFullName.trim()) {
      return clientMemberFullName;
    }
    
    // If clientMemberName is not an email (doesn't contain @), use it
    if (clientMemberName && !clientMemberName.includes('@')) {
      return clientMemberName;
    }
    
    // Try to extract and format name from email (e.g., "jacob29guyatt@icloud.com" -> "Jacob Guyatt")
    if (clientMemberName && clientMemberName.includes('@')) {
      const emailPart = clientMemberName.split('@')[0];
      // Remove numbers and try to split intelligently
      const cleaned = emailPart.replace(/[0-9]/g, '');
      
      // Try common patterns: if it looks like "firstnamelastname", try to split
      // For "jacobguyatt", we can try to find a split point
      // This is a heuristic - look for common name patterns
      if (cleaned.length > 6) {
        // Try splitting at common points (after 4-6 chars for first name)
        const possibleFirstNames = ['jacob', 'james', 'john', 'michael', 'david', 'william', 'robert', 'richard'];
        for (const firstName of possibleFirstNames) {
          if (cleaned.toLowerCase().startsWith(firstName.toLowerCase())) {
            const lastName = cleaned.substring(firstName.length);
            if (lastName.length >= 3) {
              return `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`;
            }
          }
        }
        
        // Fallback: split roughly in the middle if no pattern matches
        // For "jacobguyatt" -> "jacob" + "guyatt"
        const midPoint = Math.floor(cleaned.length / 2);
        const firstName = cleaned.substring(0, midPoint);
        const lastName = cleaned.substring(midPoint);
        return `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`;
      }
    }
    
    return 'Client';
  };
  
  const displayName = getDisplayName();
  
  // Extract email: if clientMemberName is an email, use it; otherwise check clientMemberFullName
  const displayEmail = isClientView
    ? activeAdmin?.email
    : (clientMemberName?.includes('@') 
        ? clientMemberName 
        : (clientMemberFullName?.includes('@') ? clientMemberFullName : undefined));

  return (
    <div style={{ background: '#0B0F14', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <ChatHeader
          clientName={displayName}
          clientEmail={displayEmail}
          clientImageUrl={clientMemberImageUrl}
          isClientView={isClientView}
          adminName={activeAdmin?.fullName}
          adminEmail={activeAdmin?.email}
        />

        {/* Main Chat Panel */}
        <div
          className="rounded-2xl flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            height: 'calc(100vh - 200px)',
            minHeight: '600px',
          }}
        >
          {/* Messages List or Empty State */}
          {messages.length === 0 ? (
            <EmptyChatState
              onQuickAction={handleQuickAction}
              isClientView={isClientView}
            />
          ) : (
            <MessageList
              messages={messages}
              isAgency={isAgency}
              isClientView={isClientView}
            />
          )}

          {/* Sticky Composer */}
          <ChatComposer
            onSend={handleSend}
            loading={loading}
            placeholder={
              isClientView
                ? 'Message your team...'
                : 'Send message to client...'
            }
            suggestedText={suggestedText}
          />
        </div>
      </div>
    </div>
  );
}
