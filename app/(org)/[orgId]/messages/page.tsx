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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:89',message:'Current user role determination',data:{userId,userRole,membershipRole:(membership as any)?.role,isAgency:['owner','admin'].includes(userRole)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
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
  let clientMemberName: string | undefined = undefined;
  let clientMemberImageUrl: string | undefined = undefined;
  let clientMemberFullName: string | undefined = undefined;
  
  if (isAgency) {
    // Get all members first, then filter in JavaScript to avoid query syntax issues
    const { data: allMembers, error: membersError } = await supabase
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', supabaseOrgId);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:129',message:'All members query result',data:{count:allMembers?.length,error:membersError?.message,members:allMembers?.map((m:any)=>({user_id:m.user_id,role:m.role})),currentUserId:userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    console.log('[Messages] All members found:', allMembers?.length, 'Error:', membersError);
    
    // Filter: exclude current user, then prioritize members with role='member', otherwise show any other member
    const otherMembers = (allMembers || []).filter((m: any) => m.user_id !== userId);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:135',message:'After excluding current user',data:{otherMembersCount:otherMembers.length,otherMembers:otherMembers.map((m:any)=>({user_id:m.user_id,role:m.role}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Prioritize members with role='member', but if none exist, show any other member
    const clientMembers = otherMembers.filter((m: any) => m.role === 'member');
    const memberToShow = clientMembers.length > 0 ? clientMembers[0] : otherMembers[0];
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:141',message:'Member selection result',data:{clientMembersCount:clientMembers.length,memberToShow:memberToShow?{user_id:memberToShow.user_id,role:memberToShow.role}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    console.log('[Messages] Client members after filter:', clientMembers.length, 'Member to show:', memberToShow?.user_id);
    
    if (memberToShow) {
      const clientMember = memberToShow as any;
      const clientUserId = clientMember.user_id;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:156',message:'Processing memberToShow',data:{hasMemberToShow:!!memberToShow,clientUserId,clientMemberRole:clientMember.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      console.log('[Messages] Processing client member:', clientUserId, 'Role:', clientMember.role);
      
      // Get Clerk user data for name and image
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:164',message:'Before Clerk API call',data:{clientUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        const clerkUser = await clerk.users.getUser(clientUserId);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:168',message:'Clerk API response',data:{firstName:clerkUser.firstName,lastName:clerkUser.lastName,imageUrl:clerkUser.imageUrl,email:clerkUser.primaryEmailAddress?.emailAddress},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        console.log('[Messages] Clerk user fetched:', {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.primaryEmailAddress?.emailAddress
        });
        
        clientMemberFullName = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || '';
        clientMemberImageUrl = clerkUser.imageUrl || '';
        clientMemberName = clientMemberFullName || clerkUser.primaryEmailAddress?.emailAddress || '';
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:180',message:'After setting member data',data:{clientMemberFullName,clientMemberName,clientMemberImageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        console.log('[Messages] Final member data:', {
          clientMemberFullName,
          clientMemberName,
          clientMemberImageUrl
        });
      } catch (err) {
        console.error('[Messages] Error fetching Clerk user for client member:', err);
        // Fallback to email from profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', clientUserId)
          .maybeSingle();
        
        if (profile) {
          clientMemberName = (profile as any).email || '';
          console.log('[Messages] Using profile fallback:', clientMemberName);
        } else {
          // Last resort: use user_id
          clientMemberName = 'Client Member';
          console.log('[Messages] Using default fallback');
        }
      }
    } else {
      console.log('[Messages] No client members found in org');
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.tsx:210',message:'Before passing props to MessagesView',data:{isAgency,clientMemberName,clientMemberFullName,clientMemberImageUrl,hasClientMemberName:!!clientMemberName,hasClientMemberFullName:!!clientMemberFullName,hasClientMemberImageUrl:!!clientMemberImageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  
  console.log('[Messages Page] Passing props to MessagesView:', {
    isAgency,
    clientMemberName,
    clientMemberFullName,
    clientMemberImageUrl,
    hasAgencyAdmins: isClientView ? (adminsResult.data || []).length : 0
  });

  return (
    <MessagesView
      conversationId={conversation.id}
      orgId={supabaseOrgId}
      initialMessages={messages}
      isAgency={isAgency}
      agencyAdmins={isClientView ? (adminsResult.data || []) : []}
      clientMemberName={isAgency && clientMemberName ? clientMemberName : undefined}
      clientMemberImageUrl={isAgency && clientMemberImageUrl ? clientMemberImageUrl : undefined}
      clientMemberFullName={isAgency && clientMemberFullName ? clientMemberFullName : undefined}
      isClientView={isClientView}
    />
  );
}
