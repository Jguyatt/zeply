/**
 * Client Messages Page
 * Client ↔ Agency messaging
 */

import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import MessagesView from '@/app/components/MessagesView';

export default async function ClientMessagesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // CRITICAL SECURITY CHECK
  await requireWorkspaceAccess(workspaceId, 'member', '/dashboard');

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      redirect('/dashboard');
    }
  }

  // Get or create conversation for this org
  const { getOrCreateConversation, getMessages, markMessagesAsRead, getAgencyAdmins } = await import('@/app/actions/messages');
  const conversationResult = await getOrCreateConversation(supabaseWorkspaceId);
  
  if (conversationResult.error || !conversationResult.data) {
    redirect('/dashboard');
  }

  const conversation = conversationResult.data as any;
  const conversationId = conversation.id;

  // Get messages
  const messagesResult = await getMessages(conversationId, supabaseWorkspaceId);
  const messages = (messagesResult.data || []) as any[];

  // Mark messages as read
  await markMessagesAsRead(conversationId, supabaseWorkspaceId);

  // Get agency admins (for client view to see who they're chatting with)
  const adminsResult = await getAgencyAdmins(supabaseWorkspaceId);

  return (
    <MessagesView
      conversationId={conversationId}
      orgId={supabaseWorkspaceId}
      initialMessages={messages}
      isAgency={false}
      agencyAdmins={adminsResult.data || []}
      isClientView={true}
    />
  );
}
