/**
 * Server Actions for Deliverables Management
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function getDeliverables(orgId: string, clientViewOnly: boolean = false) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('deliverables')
    .select('*, deliverable_assets(*), deliverable_comments(count), deliverable_checklist_items(*), deliverable_updates(*), updated_at')
    .eq('org_id', orgId)
    .or('archived.is.null,archived.eq.false'); // Exclude archived deliverables (handle null as not archived)

  // Filter by client visibility if client view
  if (clientViewOnly) {
    query = query.eq('client_visible', true);
  }

  const { data: deliverables, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: deliverables };
}

export async function createDeliverable(
  orgId: string,
  data: {
    title: string;
    type: string;
    description?: string;
    due_date?: string | null;
    status?: string;
    assigned_to?: string | null;
    client_visible?: boolean;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner in this org (members cannot create deliverables)
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
  if (userRole === 'member') {
    return { error: 'Only admins can create deliverables' };
  }

  const { data: deliverable, error } = await (supabase
    .from('deliverables') as any)
    .insert({
      org_id: orgId,
      title: data.title,
      type: data.type,
      description: data.description || null,
      due_date: data.due_date || null,
      status: data.status || 'planned',
      assigned_to: data.assigned_to || null,
      client_visible: data.client_visible !== undefined ? data.client_visible : true,
      created_by: userId,
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/dashboard`);
  revalidatePath(`/${orgId}/projects`);

  return { data: deliverable };
}

export async function updateDeliverable(
  deliverableId: string,
  data: {
    title: string;
    type: string;
    description?: string | null;
    due_date?: string | null;
    status?: string;
    assigned_to?: string | null;
    client_visible?: boolean;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check org_id and permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update deliverables' };
  }

  // Update deliverable
  const updateData: any = {
    title: data.title,
    type: data.type,
    description: data.description,
    due_date: data.due_date,
  };
  
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  if (data.assigned_to !== undefined) {
    updateData.assigned_to = data.assigned_to;
  }
  
  if (data.client_visible !== undefined) {
    updateData.client_visible = data.client_visible;
  }

  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update(updateData)
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'updated',
    null,
    null,
    { fields: Object.keys(data), title: data.title, type: data.type }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  revalidatePath(`/${(deliverable as any).org_id}/projects`);
  return { data: updatedDeliverable };
}

export async function updateDeliverableStatus(
  deliverableId: string,
  newStatus: string,
  reason?: string
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable with full details
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, deliverable_assets(*)')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner in this org (members cannot update status)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update deliverable status' };
  }

  // Import validation functions
  const { canTransitionTo, validateComplete } = await import('@/app/lib/deliverables/status-rules');

  // Validate transition
  const transitionCheck = canTransitionTo(newStatus as any, deliverable as any);
  if (!transitionCheck.allowed) {
    return { error: transitionCheck.reason };
  }

  // Special validation for complete status
  if (newStatus === 'complete') {
    const completeCheck = validateComplete(deliverable as any);
    if (!completeCheck.valid && !reason) {
      return { error: completeCheck.reason };
    }
  }

  const oldStatus = (deliverable as any).status;

  // Update status
  const updateData: any = { status: newStatus };
  if (newStatus === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update(updateData)
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'status_change',
    oldStatus,
    newStatus,
    reason ? { reason } : {}
  );

  const orgId = (deliverable as any).org_id;
  revalidatePath(`/${orgId}/dashboard`);
  revalidatePath(`/${orgId}/projects`);
  return { data: updatedDeliverable };
}

export async function publishDeliverable(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check org_id
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner in this org (members cannot publish)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can publish deliverables' };
  }

  const { data: publishedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({ published_at: new Date().toISOString() })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: publishedDeliverable };
}

export async function getRoadmapItems(orgId: string, clientViewOnly: boolean = false) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('roadmap_items')
    .select('*')
    .eq('org_id', orgId);

  // Filter by client visibility if client view
  if (clientViewOnly) {
    query = query.eq('client_visible', true);
  }

  const { data: items, error } = await query.order('order_index', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: items };
}

export async function getWeeklyUpdates(orgId: string, clientViewOnly: boolean = false) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('weekly_updates')
    .select('*')
    .eq('org_id', orgId);

  // Filter by client visibility and published status if client view
  if (clientViewOnly) {
    query = query
      .eq('client_visible', true)
      .not('published_at', 'is', null);
  }

  const { data: updates, error } = await query
    .order('published_at', { ascending: false })
    .limit(clientViewOnly ? 5 : 50); // Limit for client view, more for admin

  if (error) {
    return { error: error.message };
  }

  return { data: updates };
}

export async function getPortalSettings(orgId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: settings, error } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is okay
    return { error: error.message };
  }

  // Create default settings if none exist
  if (!settings) {
    const { data: newSettings, error: createError } = await (supabase
      .from('portal_settings') as any)
      .insert({
        org_id: orgId,
      })
      .select()
      .single();

    if (createError) {
      return { error: createError.message };
    }

    return { data: newSettings };
  }

  return { data: settings };
}

// ============================================================================
// Template Actions
// ============================================================================

export async function getDeliverableTemplates() {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: templates, error } = await supabase
    .from('deliverable_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Deduplicate templates by name (keep the first one)
  if (templates && templates.length > 0) {
    const seen = new Map<string, any>();
    const uniqueTemplates = templates.filter((template: any) => {
      const key = template.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, template);
      return true;
    });
    return { data: uniqueTemplates };
  }

  return { data: templates };
}

export async function getDeliverableTemplate(templateId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: template, error: templateError } = await supabase
    .from('deliverable_templates')
    .select('*')
    .eq('id', templateId)
    .single();


  if (templateError) {
    return { error: templateError.message };
  }

  const { data: items, error: itemsError } = await supabase
    .from('deliverable_template_items')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    return { error: itemsError.message };
  }

  if (!template) {
    return { error: 'Template not found' };
  }

  return { data: { ...(template as any), items: items || [] } };
}

export async function createDeliverableFromTemplate(
  orgId: string,
  templateId: string,
  overrides: {
    title?: string;
    description?: string;
    due_date?: string;
    assigned_to?: string;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Verify user is admin/owner
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
  if (userRole === 'member') {
    return { error: 'Only admins can create deliverables' };
  }

  // Get template with items
  const templateResult = await getDeliverableTemplate(templateId);
  if (templateResult.error || !templateResult.data) {
    return { error: templateResult.error || 'Template not found' };
  }

  const template = templateResult.data;

  // Create deliverable
  const { data: deliverable, error: deliverableError } = await (supabase
    .from('deliverables') as any)
    .insert({
      org_id: orgId,
      title: overrides.title || template.name,
      type: template.type,
      description: overrides.description || template.description,
      due_date: overrides.due_date,
      assigned_to: overrides.assigned_to,
      created_by: userId,
      status: 'planned',
      progress: 0,
    })
    .select()
    .single();

  if (deliverableError) {
    return { error: deliverableError.message };
  }

  // Copy checklist items from template
  if (template.items && Array.isArray(template.items)) {
    const checklistItems = template.items.map((item: any, index: number) => ({
      deliverable_id: deliverable.id,
      title: item.title,
      sort_order: item.sort_order || index,
      is_done: false,
    }));

    const { error: itemsError } = await supabase
      .from('deliverable_checklist_items')
      .insert(checklistItems);

    if (itemsError) {
      // Rollback deliverable creation
      await supabase.from('deliverables').delete().eq('id', deliverable.id);
      return { error: itemsError.message };
    }
  }

  // Log activity
  await logActivity(
    deliverable.id,
    'checklist_item_added',
    null,
    null,
    { template_id: templateId, items_count: template.items?.length || 0 }
  );

  revalidatePath(`/${orgId}/dashboard`);
  return { data: deliverable };
}

// ============================================================================
// Checklist Actions
// ============================================================================

export async function getDeliverableChecklist(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: items, error } = await supabase
    .from('deliverable_checklist_items')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('sort_order', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: items };
}

export async function updateChecklistItem(itemId: string, isDone: boolean) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get item to find deliverable_id
  const { data: item } = await supabase
    .from('deliverable_checklist_items')
    .select('deliverable_id, title')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { error: 'Checklist item not found' };
  }

  // Get deliverable to check permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', (item as any).deliverable_id)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update checklist items' };
  }

  // Update item
  const updateData: any = { is_done: isDone };
  if (isDone) {
    updateData.done_at = new Date().toISOString();
    updateData.done_by = userId;
  } else {
    updateData.done_at = null;
    updateData.done_by = null;
  }

  const { data: updatedItem, error: updateError } = await (supabase
    .from('deliverable_checklist_items') as any)
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // Recalculate progress
  await calculateProgress((item as any).deliverable_id);

  // Log activity
  await logActivity(
    (item as any).deliverable_id,
    'checklist_item',
    isDone ? 'false' : 'true',
    isDone ? 'true' : 'false',
    { item_title: (item as any).title }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedItem };
}

export async function addChecklistItem(deliverableId: string, title: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can add checklist items' };
  }

  // Get max sort_order
  const { data: existingItems } = await supabase
    .from('deliverable_checklist_items')
    .select('sort_order')
    .eq('deliverable_id', deliverableId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxSortOrder = existingItems && existingItems.length > 0
    ? (existingItems[0] as any).sort_order
    : -1;

  // Create item
  const { data: newItem, error } = await (supabase
    .from('deliverable_checklist_items') as any)
    .insert({
      deliverable_id: deliverableId,
      title,
      sort_order: maxSortOrder + 1,
      is_done: false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'checklist_item_added',
    null,
    null,
    { item_title: title }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: newItem };
}

export async function calculateProgress(deliverableId: string) {
  const supabase = await createServerClient();

  // Get all checklist items
  const { data: items } = await supabase
    .from('deliverable_checklist_items')
    .select('is_done')
    .eq('deliverable_id', deliverableId);

  if (!items || items.length === 0) {
    // Update progress to 0
    await (supabase
      .from('deliverables') as any)
      .update({ progress: 0 })
      .eq('id', deliverableId);
    return { data: 0 };
  }

  const itemsArray = (items || []) as any[];
  const doneCount = itemsArray.filter((item) => item.is_done).length;
  const progress = Math.round((doneCount / itemsArray.length) * 100);

  // Update progress
  await (supabase
    .from('deliverables') as any)
    .update({ progress })
    .eq('id', deliverableId);

  return { data: progress };
}

// ============================================================================
// Workflow Actions
// ============================================================================

export async function sendToClientReview(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable with full details
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, deliverable_assets(*)')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can send deliverables to review' };
  }

  // Validate
  const { validateSendToReview } = await import('@/app/lib/deliverables/status-rules');
  const validation = validateSendToReview(deliverable as any);
  if (!validation.valid) {
    return { error: validation.reason };
  }

  const oldStatus = (deliverable as any).status;

  // Update status and visibility
  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({
      status: 'in_review',
      client_visible: true,
    })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'status_change',
    oldStatus,
    'in_review',
    { action: 'sent_to_client_review' }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedDeliverable };
}

export async function clientApprove(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id, status')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is member of org (client can approve)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Must be in review status
  if ((deliverable as any).status !== 'in_review') {
    return { error: 'Deliverable must be in review status to approve' };
  }

  const oldStatus = (deliverable as any).status;

  // Update status
  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({ status: 'approved' })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'status_change',
    oldStatus,
    'approved',
    { action: 'client_approved' }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedDeliverable };
}

export async function clientRequestRevisions(deliverableId: string, comment: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id, status')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is member of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  // Must be in review status
  if ((deliverable as any).status !== 'in_review') {
    return { error: 'Deliverable must be in review status to request revisions' };
  }

  const oldStatus = (deliverable as any).status;

  // Update status
  const { data: updatedDeliverable, error: statusError } = await (supabase
    .from('deliverables') as any)
    .update({ status: 'revisions_requested' })
    .eq('id', deliverableId)
    .select()
    .single();

  if (statusError) {
    return { error: statusError.message };
  }

  // Create comment
  const { error: commentError } = await (supabase
    .from('deliverable_comments') as any)
    .insert({
      deliverable_id: deliverableId,
      org_id: (deliverable as any).org_id,
      author_id: userId,
      body: comment,
    });

  if (commentError) {
    return { error: commentError.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'status_change',
    oldStatus,
    'revisions_requested',
    { action: 'client_requested_revisions', comment }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedDeliverable };
}

export async function completeDeliverable(deliverableId: string, reason?: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable with full details
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*, deliverable_assets(*)')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can complete deliverables' };
  }

  // Validate
  const { validateComplete } = await import('@/app/lib/deliverables/status-rules');
  const validation = validateComplete(deliverable as any);
  if (!validation.valid && !reason) {
    return { error: validation.reason };
  }

  const oldStatus = (deliverable as any).status;

  // Update status
  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'status_change',
    oldStatus,
    'complete',
    reason ? { reason } : {}
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: updatedDeliverable };
}

// ============================================================================
// Activity Log Actions
// ============================================================================

export async function getDeliverableActivity(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: activities, error } = await supabase
    .from('deliverable_activity_log')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: activities };
}

async function logActivity(
  deliverableId: string,
  action: string,
  oldValue: string | null,
  newValue: string | null,
  metadata: Record<string, any> = {}
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return; // Silently fail for activity logging
  }

  await (supabase.from('deliverable_activity_log') as any).insert({
    deliverable_id: deliverableId,
    user_id: userId,
    action,
    old_value: oldValue,
    new_value: newValue,
    metadata,
  });
}

// ============================================================================
// Proof Items Actions
// ============================================================================

export async function addProofItem(
  deliverableId: string,
  data: {
    name: string;
    url: string;
    kind: 'file' | 'link' | 'loom' | 'gdrive';
    proof_type?: 'url' | 'file' | 'screenshot' | 'loom' | 'gdrive';
    is_required_proof?: boolean;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can add proof items' };
  }

  // Determine proof_type if not provided
  let proofType = data.proof_type;
  if (!proofType) {
    if (data.kind === 'loom') {
      proofType = 'loom';
    } else if (data.kind === 'gdrive') {
      proofType = 'gdrive';
    } else if (data.kind === 'link') {
      proofType = 'url';
    } else {
      proofType = 'file';
    }
  }

  // Create asset
  const { data: asset, error } = await (supabase
    .from('deliverable_assets') as any)
    .insert({
      deliverable_id: deliverableId,
      kind: data.kind,
      url: data.url,
      name: data.name,
      proof_type: proofType,
      is_required_proof: data.is_required_proof || false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    'proof_added',
    null,
    null,
    { asset_name: data.name, proof_type: proofType, is_required: data.is_required_proof }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: asset };
}

export async function removeProofItem(assetId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get asset to find deliverable
  const { data: asset } = await supabase
    .from('deliverable_assets')
    .select('deliverable_id, name')
    .eq('id', assetId)
    .single();

  if (!asset) {
    return { error: 'Proof item not found' };
  }

  // Get deliverable to check permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id')
    .eq('id', (asset as any).deliverable_id)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can remove proof items' };
  }

  // Delete asset
  const { error } = await supabase
    .from('deliverable_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    (asset as any).deliverable_id,
    'proof_removed',
    null,
    null,
    { asset_name: (asset as any).name }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  return { data: { success: true } };
}

export async function duplicateDeliverable(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable with all related data
  const { data: deliverable, error: deliverableError } = await supabase
    .from('deliverables')
    .select('*, deliverable_checklist_items(*), deliverable_assets(*)')
    .eq('id', deliverableId)
    .single();

  if (deliverableError || !deliverable) {
    return { error: deliverableError?.message || 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can duplicate deliverables' };
  }

  // Create duplicate deliverable
  const { data: duplicatedDeliverable, error: duplicateError } = await (supabase
    .from('deliverables') as any)
    .insert({
      org_id: (deliverable as any).org_id,
      title: `${(deliverable as any).title} (Copy)`,
      type: (deliverable as any).type,
      description: (deliverable as any).description,
      due_date: (deliverable as any).due_date,
      assigned_to: (deliverable as any).assigned_to,
      created_by: userId,
      status: 'planned',
      progress: 0,
      client_visible: false,
      archived: false,
    })
    .select()
    .single();

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  // Copy checklist items
  const checklistItems = (deliverable as any).deliverable_checklist_items || [];
  if (checklistItems.length > 0) {
    const newChecklistItems = checklistItems.map((item: any, index: number) => ({
      deliverable_id: duplicatedDeliverable.id,
      title: item.title,
      sort_order: item.sort_order || index,
      is_done: false,
    }));

    const { error: itemsError } = await supabase
      .from('deliverable_checklist_items')
      .insert(newChecklistItems);

    if (itemsError) {
      // Rollback deliverable creation
      await supabase.from('deliverables').delete().eq('id', duplicatedDeliverable.id);
      return { error: itemsError.message };
    }
  }

  // Note: We don't copy assets as they are file references - user can re-upload if needed

  // Log activity
  await logActivity(
    duplicatedDeliverable.id,
    'created',
    null,
    null,
    { duplicated_from: deliverableId }
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  revalidatePath(`/${(deliverable as any).org_id}/projects`);
  return { data: duplicatedDeliverable };
}

export async function archiveDeliverable(deliverableId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get deliverable to check permissions
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('org_id, archived')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) {
    return { error: 'Deliverable not found' };
  }

  // Verify user is admin/owner
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (deliverable as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can archive deliverables' };
  }

  // Toggle archive status (handle case where column doesn't exist yet)
  const currentArchived = (deliverable as any).archived ?? false;
  const newArchivedStatus = !currentArchived;

  const updateData: any = {};
  if (newArchivedStatus !== undefined) {
    updateData.archived = newArchivedStatus;
  }

  const { data: updatedDeliverable, error } = await (supabase
    .from('deliverables') as any)
    .update(updateData)
    .eq('id', deliverableId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await logActivity(
    deliverableId,
    newArchivedStatus ? 'archived' : 'unarchived',
    null,
    null,
    {}
  );

  revalidatePath(`/${(deliverable as any).org_id}/dashboard`);
  revalidatePath(`/${(deliverable as any).org_id}/projects`);
  return { data: updatedDeliverable };
}

