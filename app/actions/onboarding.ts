/**
 * Server Actions for Onboarding Flow Builder
 */

'use server';

import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getDefaultContractHTML } from '@/app/lib/onboarding-templates';
import type {
  OnboardingFlow,
  OnboardingNode,
  OnboardingEdge,
  OnboardingProgress,
  OnboardingFlowWithNodes,
  NodeConfig,
} from '@/app/types/onboarding';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyAdminAccess(orgId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = await createServerClient();
  const { data: membership, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking admin access:', error);
    return false;
  }

  if (!membership) return false;
  
  const role = (membership as { role: string }).role;
  return role === 'owner' || role === 'admin';
}

// ============================================================================
// ONBOARDING ENABLED CHECK
// ============================================================================

export async function isOnboardingEnabled(orgId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: config } = await supabase
    .from('client_portal_config')
    .select('onboarding_enabled')
    .eq('org_id', orgId)
    .maybeSingle();

  return (config as { onboarding_enabled: boolean } | null)?.onboarding_enabled ?? false;
}

// ============================================================================
// FLOW OPERATIONS
// ============================================================================

export async function getPublishedOnboardingFlow(orgId: string): Promise<{ data: OnboardingFlowWithNodes | null; error?: string }> {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data: flow, error: flowError } = await supabase
    .from('onboarding_flows')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (flowError) {
    return { data: null, error: flowError.message };
  }

  if (!flow) {
    return { data: null };
  }

  const { data: nodes, error: nodesError } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', flow.id)
    .order('order_index', { ascending: true });

  if (nodesError) {
    return { data: null, error: nodesError.message };
  }

  const { data: edges, error: edgesError } = await supabase
    .from('onboarding_edges')
    .select('*')
    .eq('flow_id', flow.id);

  if (edgesError) {
    return { data: null, error: edgesError.message };
  }

  return {
    data: {
      ...flow,
      nodes: (nodes || []) as OnboardingNode[],
      edges: (edges || []) as OnboardingEdge[],
    } as OnboardingFlowWithNodes,
  };
}

export async function getOnboardingFlowDraft(orgId: string): Promise<{ data: OnboardingFlowWithNodes | null; error?: string }> {
  if (!(await verifyAdminAccess(orgId))) {
    return { data: null, error: 'Unauthorized' };
  }

  const supabase = await createServerClient();
  const { data: flow, error: flowError } = await supabase
    .from('onboarding_flows')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (flowError) {
    return { data: null, error: flowError.message };
  }

  if (!flow) {
    return { data: null };
  }

  const { data: nodes } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', flow.id)
    .order('order_index', { ascending: true });

  const { data: edges } = await supabase
    .from('onboarding_edges')
    .select('*')
    .eq('flow_id', flow.id);

  return {
    data: {
      ...flow,
      nodes: (nodes || []) as OnboardingNode[],
      edges: (edges || []) as OnboardingEdge[],
    } as OnboardingFlowWithNodes,
  };
}

export async function createOnboardingFlow(orgId: string, name: string): Promise<{ data: OnboardingFlow | null; error?: string }> {
  if (!(await verifyAdminAccess(orgId))) {
    return { data: null, error: 'Unauthorized' };
  }

  // Use service role client to bypass RLS (we've already verified admin access)
  const supabase = createServiceClient();
  const { data: flow, error } = await supabase
    .from('onboarding_flows')
    .insert({
      org_id: orgId,
      name,
      status: 'draft',
      version: 1,
    } as Partial<OnboardingFlow>)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${orgId}/client-setup/onboarding`);
  return { data: flow as OnboardingFlow };
}

export async function updateOnboardingFlow(flowId: string, updates: Partial<OnboardingFlow>): Promise<{ data: OnboardingFlow | null; error?: string }> {
  const supabase = createServiceClient();
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('org_id')
    .eq('id', flowId)
    .single();

  if (!flow || !(await verifyAdminAccess((flow as { org_id: string }).org_id))) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data: updatedFlow, error } = await supabase
    .from('onboarding_flows')
    .update(updates)
    .eq('id', flowId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${(flow as { org_id: string }).org_id}/client-setup/onboarding`);
  return { data: updatedFlow as OnboardingFlow };
}

export async function publishOnboardingFlow(flowId: string): Promise<{ data: OnboardingFlow | null; error?: string }> {
  const supabase = createServiceClient();
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('org_id')
    .eq('id', flowId)
    .single();

  if (!flow || !(await verifyAdminAccess((flow as { org_id: string }).org_id))) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data: updatedFlow, error } = await supabase
    .from('onboarding_flows')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', flowId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${(flow as { org_id: string }).org_id}/client-setup/onboarding`);
  revalidatePath(`/${(flow as { org_id: string }).org_id}/onboarding`);
  return { data: updatedFlow as OnboardingFlow };
}

export async function initializeDefaultFlow(orgId: string): Promise<{ data: OnboardingFlow | null; error?: string }> {
  if (!(await verifyAdminAccess(orgId))) {
    return { data: null, error: 'Unauthorized' };
  }

  // Use service role client to bypass RLS (we've already verified admin access)
  const supabase = createServiceClient();

  // Check if flow already exists - if so, check if it has nodes
  const { data: existing } = await supabase
    .from('onboarding_flows')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  if (existing) {
    // Check if nodes already exist for this flow
    const { data: existingNodes } = await supabase
      .from('onboarding_nodes')
      .select('id')
      .eq('flow_id', (existing as OnboardingFlow).id)
      .limit(1);
    
    // If nodes exist, return the flow. Otherwise, we'll create default nodes below.
    if (existingNodes && existingNodes.length > 0) {
      return { data: existing as OnboardingFlow };
    }
    // If flow exists but has no nodes, continue to create default nodes
  }

  // Get org name for contract
  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single();

  const orgName = (org as { name: string } | null)?.name || 'Service Provider';

  // Create flow
  const { data: flow, error: flowError } = await supabase
    .from('onboarding_flows')
    .insert({
      org_id: orgId,
      name: 'Default Onboarding',
      status: 'draft',
      version: 1,
    } as Partial<OnboardingFlow>)
    .select()
    .single();

  if (flowError || !flow) {
    return { data: null, error: flowError?.message || 'Failed to create flow' };
  }

  const flowId = (flow as OnboardingFlow).id;
  const contractHTML = getDefaultContractHTML(orgName);

  // Create default nodes
  const nodes = [
    { type: 'welcome' as const, title: 'Welcome', order_index: 1, config: { html_content: '' } },
    { type: 'payment' as const, title: 'Invoice', order_index: 2, config: { stripe_url: '', amount_label: '' } },
    { type: 'contract' as const, title: 'Agreement', order_index: 3, config: { html_content: contractHTML, signature_required: true } },
    { type: 'consent' as const, title: 'Terms & Privacy', order_index: 4, config: { privacy_url: '', terms_url: '', checkbox_text: '' } },
  ];

  const { data: createdNodes, error: nodesError } = await supabase
    .from('onboarding_nodes')
    .insert(
      nodes.map((node) => ({
        flow_id: flowId,
        ...node,
        required: true,
        position: { x: 0, y: 0 },
      }))
    )
    .select();

  if (nodesError || !createdNodes || createdNodes.length === 0) {
    return { data: null, error: nodesError?.message || 'Failed to create nodes' };
  }

  // Create edges (linear flow)
  const nodeIds = createdNodes.map((n) => (n as OnboardingNode).id);
  const edges = [];
  for (let i = 0; i < nodeIds.length - 1; i++) {
    edges.push({
      flow_id: flowId,
      source_node_id: nodeIds[i],
      target_node_id: nodeIds[i + 1],
    });
  }

  if (edges.length > 0) {
    await supabase.from('onboarding_edges').insert(edges);
  }

  revalidatePath(`/${orgId}/client-setup/onboarding`);
  return { data: flow as OnboardingFlow };
}

// ============================================================================
// NODE OPERATIONS
// ============================================================================

export async function getOnboardingNodes(flowId: string): Promise<{ data: OnboardingNode[] | null; error?: string }> {
  const supabase = await createServerClient();
  const { data: nodes, error } = await supabase
    .from('onboarding_nodes')
    .select('*')
    .eq('flow_id', flowId)
    .order('order_index', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (nodes || []) as OnboardingNode[] };
}

export async function createOnboardingNode(flowId: string, nodeData: Partial<OnboardingNode>): Promise<{ data: OnboardingNode | null; error?: string }> {
  const supabase = createServiceClient();
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('org_id')
    .eq('id', flowId)
    .single();

  if (!flow || !(await verifyAdminAccess((flow as { org_id: string }).org_id))) {
    return { data: null, error: 'Unauthorized' };
  }

  // Get the maximum order_index for this flow to avoid duplicates
  const { data: existingNodes } = await supabase
    .from('onboarding_nodes')
    .select('order_index')
    .eq('flow_id', flowId)
    .order('order_index', { ascending: false })
    .limit(1);

  const maxOrderIndex = existingNodes && existingNodes.length > 0 
    ? (existingNodes[0] as { order_index: number }).order_index 
    : -1;
  
  // Use provided order_index if specified, otherwise use next available
  const orderIndex = nodeData.order_index !== undefined && nodeData.order_index !== null
    ? nodeData.order_index
    : maxOrderIndex + 1;

  const { data: node, error } = await supabase
    .from('onboarding_nodes')
    .insert({
      flow_id: flowId,
      type: nodeData.type!,
      title: nodeData.title!,
      description: nodeData.description || null,
      required: nodeData.required ?? true,
      config: nodeData.config || {},
      position: nodeData.position || { x: 0, y: 0 },
      order_index: orderIndex,
    } as Partial<OnboardingNode>)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${(flow as { org_id: string }).org_id}/client-setup/onboarding`);
  return { data: node as OnboardingNode };
}

export async function updateOnboardingNode(nodeId: string, updates: Partial<OnboardingNode>): Promise<{ data: OnboardingNode | null; error?: string }> {
  const supabase = createServiceClient();
  const { data: node } = await supabase
    .from('onboarding_nodes')
    .select('flow_id, onboarding_flows!inner(org_id)')
    .eq('id', nodeId)
    .single();

  if (!node) {
    return { data: null, error: 'Node not found' };
  }

  const orgId = ((node as { onboarding_flows: { org_id: string } }).onboarding_flows).org_id;
  if (!(await verifyAdminAccess(orgId))) {
    return { data: null, error: 'Unauthorized' };
  }

  console.log('updateOnboardingNode - updates:', JSON.stringify(updates, null, 2));
  
  const { data: updatedNode, error } = await supabase
    .from('onboarding_nodes')
    .update(updates)
    .eq('id', nodeId)
    .select()
    .single();

  if (error) {
    console.error('updateOnboardingNode - error:', error);
    return { data: null, error: error.message };
  }

  console.log('updateOnboardingNode - updated node:', JSON.stringify(updatedNode, null, 2));
  console.log('updateOnboardingNode - config field:', updatedNode?.config);

  revalidatePath(`/${orgId}/client-setup/onboarding`);
  return { data: updatedNode as OnboardingNode };
}

export async function deleteOnboardingNode(nodeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: node } = await supabase
    .from('onboarding_nodes')
    .select('flow_id, onboarding_flows!inner(org_id)')
    .eq('id', nodeId)
    .single();

  if (!node) {
    return { success: false, error: 'Node not found' };
  }

  const orgId = ((node as { onboarding_flows: { org_id: string } }).onboarding_flows).org_id;
  if (!(await verifyAdminAccess(orgId))) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('onboarding_nodes')
    .delete()
    .eq('id', nodeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/${orgId}/client-setup/onboarding`);
  return { success: true };
}

export async function reorderOnboardingNodes(flowId: string, nodeOrders: Array<{ id: string; order_index: number }>): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('org_id')
    .eq('id', flowId)
    .single();

  if (!flow || !(await verifyAdminAccess((flow as { org_id: string }).org_id))) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update each node's order_index
  for (const { id, order_index } of nodeOrders) {
    const { error } = await supabase
      .from('onboarding_nodes')
      .update({ order_index })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath(`/${(flow as { org_id: string }).org_id}/client-setup/onboarding`);
  return { success: true };
}

// ============================================================================
// EDGE OPERATIONS
// ============================================================================

export async function createOnboardingEdge(flowId: string, sourceId: string, targetId: string): Promise<{ data: OnboardingEdge | null; error?: string }> {
  const supabase = createServiceClient();
  const { data: flow } = await supabase
    .from('onboarding_flows')
    .select('org_id')
    .eq('id', flowId)
    .single();

  if (!flow || !(await verifyAdminAccess((flow as { org_id: string }).org_id))) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data: edge, error } = await supabase
    .from('onboarding_edges')
    .insert({
      flow_id: flowId,
      source_node_id: sourceId,
      target_node_id: targetId,
      condition: null,
    } as Partial<OnboardingEdge>)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${(flow as { org_id: string }).org_id}/client-setup/onboarding`);
  return { data: edge as OnboardingEdge };
}

export async function deleteOnboardingEdge(edgeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: edge } = await supabase
    .from('onboarding_edges')
    .select('flow_id, onboarding_flows!inner(org_id)')
    .eq('id', edgeId)
    .single();

  if (!edge) {
    return { success: false, error: 'Edge not found' };
  }

  const orgId = ((edge as { onboarding_flows: { org_id: string } }).onboarding_flows).org_id;
  if (!(await verifyAdminAccess(orgId))) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('onboarding_edges')
    .delete()
    .eq('id', edgeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/${orgId}/client-setup/onboarding`);
  return { success: true };
}

// ============================================================================
// PROGRESS OPERATIONS
// ============================================================================

export async function getOnboardingProgress(orgId: string, userId: string): Promise<{ data: OnboardingProgress[] | null; error?: string }> {
  const supabase = await createServerClient();
  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (progress || []) as OnboardingProgress[] };
}

export async function isOnboardingComplete(orgId: string, userId: string): Promise<boolean> {
  const enabled = await isOnboardingEnabled(orgId);
  if (!enabled) {
    return true; // If onboarding is disabled, consider it complete
  }

  const flowResult = await getPublishedOnboardingFlow(orgId);
  if (!flowResult.data || !flowResult.data.nodes.length) {
    return true; // No flow published, allow access
  }

  const progressResult = await getOnboardingProgress(orgId, userId);
  if (!progressResult.data) {
    return false;
  }

  const completedNodeIds = new Set(
    progressResult.data
      .filter((p) => p.status === 'completed')
      .map((p) => p.node_id)
  );

  // Check if all required nodes are completed
  const requiredNodes = flowResult.data.nodes.filter((n) => n.required);
  return requiredNodes.every((node) => completedNodeIds.has(node.id));
}

export async function completeOnboardingNode(orgId: string, userId: string, nodeId: string, metadata?: Record<string, unknown>): Promise<{ data: OnboardingProgress | null; error?: string }> {
  const supabase = await createServerClient();
  const { userId: authUserId } = await auth();

  if (!authUserId || authUserId !== userId) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        node_id: nodeId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: metadata || {},
      } as Partial<OnboardingProgress>,
      {
        onConflict: 'org_id,user_id,node_id',
      }
    )
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/${orgId}/onboarding`);
  return { data: progress as OnboardingProgress };
}

export async function getAllOnboardingStatus(orgId: string): Promise<{ data: Array<{ user_id: string; node_id: string; status: string; completed_at: string | null }> | null; error?: string }> {
  if (!(await verifyAdminAccess(orgId))) {
    return { data: null, error: 'Unauthorized' };
  }

  const supabase = await createServerClient();
  const { data: progress, error } = await supabase
    .from('onboarding_progress')
    .select('user_id, node_id, status, completed_at')
    .eq('org_id', orgId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (progress || []) as Array<{ user_id: string; node_id: string; status: string; completed_at: string | null }> };
}

// ============================================================================
// CONTRACT SIGNING
// ============================================================================

export async function signContract(
  orgId: string,
  userId: string,
  nodeId: string,
  signatureData: {
    signed_name: string;
    signature_image_url: string;
    contract_sha256?: string;
    terms_version?: string;
    privacy_version?: string;
    ip?: string;
    user_agent?: string;
  }
): Promise<{ data: { signature_id: string } | null; error?: string }> {
  const supabase = await createServerClient();
  const { userId: authUserId } = await auth();

  if (!authUserId || authUserId !== userId) {
    return { data: null, error: 'Unauthorized' };
  }

  // Create contract signature record
  const { data: signature, error: sigError } = await supabase
    .from('contract_signatures')
    .insert({
      org_id: orgId,
      user_id: userId,
      node_id: nodeId,
      signed_name: signatureData.signed_name,
      signature_image_url: signatureData.signature_image_url,
      contract_sha256: signatureData.contract_sha256 || null,
      terms_version: signatureData.terms_version || null,
      privacy_version: signatureData.privacy_version || null,
      ip: signatureData.ip || null,
      user_agent: signatureData.user_agent || null,
    } as Partial<import('@/app/types/onboarding').ContractSignature>)
    .select('id')
    .single();

  if (sigError) {
    return { data: null, error: sigError.message };
  }

  // Mark node as complete
  const progressResult = await completeOnboardingNode(orgId, userId, nodeId, {
    signature_id: (signature as { id: string }).id,
  });

  if (progressResult.error) {
    return { data: null, error: progressResult.error };
  }

  revalidatePath(`/${orgId}/onboarding`);
  return { data: { signature_id: (signature as { id: string }).id } };
}

