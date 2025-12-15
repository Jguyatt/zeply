import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } from '@/app/actions/orgs';
import MessagesView from '@/app/components/MessagesView';

/**
 * Messages Page - Client ↔ Agency messaging
 */
export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  const { orgId } = await params;
  const { mode } = await searchParams;
  const isPreviewMode = mode === 'client';
  const supabase = await createServerClient();

  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = orgId;
  
  if (orgId.startsWith('org_')) {
    const { getSupabaseOrgIdFromClerk, syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
    const orgResult = await getSupabaseOrgIdFromClerk(orgId);
    
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      if (syncResult && 'data' in syncResult) {
        supabaseOrgId = (syncResult.data as any).id;
      } else {
        redirect('/dashboard');
      }
    }
  }

  // Verify user has access to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', supabaseOrgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership && orgId.startsWith('org_')) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { data: retryMembership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', supabaseOrgId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!retryMembership) {
      const { syncClerkOrgToSupabase } = await import('@/app/actions/orgs');
      const syncResult = await syncClerkOrgToSupabase(orgId, 'Organization');
      
      if (syncResult && 'data' in syncResult) {
        const { data: finalMembership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (syncResult.data as any).id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!finalMembership) {
          redirect('/dashboard');
        }
      } else {
        redirect('/dashboard');
      }
    }
  } else if (!membership) {
    redirect('/dashboard');
  }

  const userRole = (membership as any)?.role || 'member';
  const isAgency = ['owner', 'admin'].includes(userRole);
  const isClientView = !isAgency || isPreviewMode;

  // Get or create conversation for this org (one conversation per org)
  const { getOrCreateConversation } = await import('@/app/actions/messages');
  const conversationResult = await getOrCreateConversation(supabaseOrgId);
  
  if (conversationResult.error) {
    redirect('/dashboard');
  }

  const conversation = conversationResult.data as any;

  // Get messages
  const { getMessages } = await import('@/app/actions/messages');
  const messagesResult = await getMessages(conversation.id, supabaseOrgId);
  const messages = (messagesResult.data || []) as any[];

  // Mark messages as read
  const { markMessagesAsRead } = await import('@/app/actions/messages');
  await markMessagesAsRead(conversation.id, supabaseOrgId);

  // Get agency admins (for client view to see who they're chatting with)
  // Call this if user is a client OR if in preview mode (to show admin info)
  const { getAgencyAdmins } = await import('@/app/actions/messages');
  const adminsResult = isClientView ? await getAgencyAdmins(supabaseOrgId) : { data: [] };

  // Get client members (for agency to see who they're messaging)
  // Fetch Clerk user data for client member name and photo
  let clientMemberName = '';
  let clientMemberImageUrl = '';
  let clientMemberFullName = '';
  
  if (isAgency) {
    const { data: clientMembers } = await supabase
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', supabaseOrgId)
      .not('role', 'in', '(owner,admin)')
      .limit(1);
    
    if (clientMembers && clientMembers.length > 0) {
      const clientMember = clientMembers[0] as any;
      const clientUserId = clientMember.user_id;
      
      // Get Clerk user data for name and image
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(clientUserId);
        
        clientMemberFullName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || '';
        clientMemberImageUrl = clerkUser.imageUrl || '';
        clientMemberName = clientMemberFullName || clerkUser.primaryEmailAddress?.emailAddress || '';
      } catch (err) {
        // Fallback to email from profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', clientUserId)
          .maybeSingle();
        
        if (profile) {
          clientMemberName = (profile as any).email || '';
        }
      }
    }
  }

  return (
    <MessagesView
      conversationId={conversation.id}
      orgId={supabaseOrgId}
      initialMessages={messages}
      isAgency={isAgency}
      agencyAdmins={isClientView ? (adminsResult.data || []) : []}
      clientMemberName={isAgency ? clientMemberName : undefined}
      clientMemberImageUrl={isAgency ? clientMemberImageUrl : undefined}
      clientMemberFullName={isAgency ? clientMemberFullName : undefined}
      isClientView={isClientView}
    />
  );
}
