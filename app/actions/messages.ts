/**
 * Server Actions for Messaging System
 * All operations verify user is logged in and is a member of the org
 */

'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface Message {
  id: string;
  conversation_id: string;
  org_id: string;
  author_user_id: string;
  author_role: 'agency' | 'client';
  body: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create conversation for an org
 */
export async function getOrCreateConversation(orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Try to get existing conversation for this org (one per org)
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('org_id', orgId)
    .is('client_user_id', null) // Org-wide conversation
    .maybeSingle();

  if (existing) {
    return { data: existing };
  }

  // FIX: Cast to 'any' for insert
  const { data: conversation, error } = await (supabase
    .from('conversations') as any)
    .insert({
      org_id: orgId,
      client_user_id: null, // Org-wide, not per-client
      title: 'Client Chat',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: conversation };
}


/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string, orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Verify conversation belongs to this org
  const { data: conversation } = await supabase
    .from('conversations')
    .select('org_id')
    .eq('id', conversationId)
    .single();

  if (!conversation || (conversation as any).org_id !== orgId) {
    return { error: 'Conversation not found' };
  }

  // Get messages with read status
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Get read status for messages sent by current user (to show if recipients read them)
  const ownMessageIds = (messages || []).filter((m: any) => m.author_user_id === userId).map((m: any) => m.id);
  
  if (ownMessageIds.length > 0) {
    // Get all read statuses for messages I sent (by any user - the recipients)
    const { data: readStatuses } = await supabase
      .from('message_read_status')
      .select('message_id, read_at')
      .in('message_id', ownMessageIds);

    // Create a map: for each message, track if ANY user (recipient) read it
    const readStatusMap = new Map();
    (readStatuses || []).forEach((rs: any) => {
      if (!readStatusMap.has(rs.message_id)) {
        readStatusMap.set(rs.message_id, rs.read_at);
      } else {
        // Keep the earliest read time
        const existing = readStatusMap.get(rs.message_id);
        if (new Date(rs.read_at) < new Date(existing)) {
          readStatusMap.set(rs.message_id, rs.read_at);
        }
      }
    });

    // Attach read status only to messages I sent
    const messagesWithStatus = (messages || []).map((msg: any) => {
      if (msg.author_user_id === userId) {
        return {
          ...msg,
          is_read: readStatusMap.has(msg.id),
          read_at: readStatusMap.get(msg.id) || null,
        };
      }
      return msg;
    });

    return { data: messagesWithStatus };
  }

  return { data: messages || [] };
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  orgId: string,
  body: string
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Determine author role (agency = owner/admin, client = member)
  const userRole = (membership as any).role || 'member';
  const authorRole: 'agency' | 'client' = ['owner', 'admin'].includes(userRole) ? 'agency' : 'client';

  // Verify conversation belongs to this org
  const { data: conversation } = await supabase
    .from('conversations')
    .select('org_id')
    .eq('id', conversationId)
    .single();

  if (!conversation || (conversation as any).org_id !== orgId) {
    return { error: 'Conversation not found' };
  }

  // FIX: Cast to 'any' for insert
  const { data: message, error } = await (supabase
    .from('messages') as any)
    .insert({
      conversation_id: conversationId,
      org_id: orgId,
      author_user_id: userId,
      author_role: authorRole,
      body: body.trim(),
      delivered_at: new Date().toISOString(), // Mark as delivered immediately
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/messages`);
  return { data: message };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string, orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Get all unread messages in this conversation that weren't sent by the current user
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('author_user_id', userId);

  if (unreadMessages && unreadMessages.length > 0) {
    const messageIds = unreadMessages.map((m: any) => m.id);
    const readAt = new Date().toISOString();

    // Mark each message as read
    const readStatuses = messageIds.map((messageId: string) => ({
      message_id: messageId,
      user_id: userId,
      read_at: readAt,
    }));

    // Upsert read statuses
    const { error: readError } = await (supabase
      .from('message_read_status') as any)
      .upsert(readStatuses, {
        onConflict: 'message_id,user_id',
      });

    if (readError) {
      console.error('Error marking messages as read:', readError);
    }
  }

  // Also update the conversation-level read tracking
  const { error } = await (supabase
    .from('message_reads') as any)
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id,user_id',
    });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Get unread message count for a user in an org
 */
export async function getUnreadCount(orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { data: 0 };
  }

  // Get conversation for this org
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (!conversation) {
    return { data: 0 };
  }

  // Get last read time
  const { data: readStatus } = await supabase
    .from('message_reads')
    .select('last_read_at')
    .eq('conversation_id', (conversation as any).id)
    .eq('user_id', userId)
    .maybeSingle();

  const lastReadAt = readStatus ? new Date((readStatus as any).last_read_at) : new Date(0);

  // Count unread messages
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', (conversation as any).id)
    .neq('author_user_id', userId) // Don't count own messages
    .gt('created_at', lastReadAt.toISOString());

  if (error) {
    return { data: 0 };
  }

  return { data: count || 0 };
}

/**
 * Get recent messages for overview card
 */
export async function getRecentMessages(orgId: string, limit: number = 3) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { data: [] };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { data: [] };
  }

  // Get conversation for this org
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', orgId)
    .is('client_user_id', null) // Org-wide conversation
    .maybeSingle();

  if (!conversation) {
    return { data: [] };
  }

  // Get recent messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', (conversation as any).id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [] };
  }

  return { data: (messages || []).reverse() }; // Reverse to show oldest first
}

/**
 * Get client members for agency to select
 */
export async function getClientMembers(orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is agency (owner/admin)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (!['owner', 'admin'].includes(userRole)) {
    return { error: 'Only agency members can view client list' };
  }

  // Get all client members (non-admin/owner)
  const { data: members, error } = await supabase
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .not('role', 'in', '(owner,admin)')
    .order('user_id', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Enrich with user profile info
  const enriched = await Promise.all((members || []).map(async (member: any) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', member.user_id)
      .maybeSingle();
    
    return {
      user_id: member.user_id,
      email: (profile as any)?.email || 'Unknown',
      role: member.role,
    };
  }));

  return { data: enriched };
}

/**
 * Get agency admins for client to see who they're chatting with
 */
export async function getAgencyAdmins(orgId: string) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Get all agency admins (owner/admin)
  const { data: admins, error } = await supabase
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .in('role', ['owner', 'admin'])
    .order('role', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Enrich with user profile info and Clerk user data
  const { clerkClient } = await import('@clerk/nextjs/server');
  const clerk = await clerkClient();
  
  const enriched = await Promise.all((admins || []).map(async (admin: any) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', admin.user_id)
      .maybeSingle();
    
    // Get Clerk user data for name and image
    let firstName = '';
    let lastName = '';
    let imageUrl = '';
    let email = (profile as any)?.email || '';
    
    try {
      const clerkUser = await clerk.users.getUser(admin.user_id);
      firstName = clerkUser.firstName || '';
      lastName = clerkUser.lastName || '';
      imageUrl = clerkUser.imageUrl || '';
      email = clerkUser.primaryEmailAddress?.emailAddress || email;
    } catch (err) {
      // If Clerk user not found, use email as fallback
      console.error('Error fetching Clerk user:', err);
    }
    
    return {
      user_id: admin.user_id,
      email: email || 'Unknown',
      firstName,
      lastName,
      fullName: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email?.split('@')[0] || 'Admin',
      imageUrl,
      role: admin.role,
    };
  }));

  return { data: enriched };
}