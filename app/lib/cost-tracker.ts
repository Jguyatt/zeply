/**
 * Cost Tracking Utility
 * Logs cost events for API usage, tool costs, and other billable actions
 */

import { createServiceClient } from '@/lib/supabase/server';

export interface CostEventParams {
  workspaceId: string;
  clientId?: string | null; // null = overhead/unassigned
  source: string; // 'openai', 'anthropic', 'tool', etc.
  category: string; // 'api', 'storage', 'email', 'other'
  amountCents: number; // Amount in cents (integer)
  currency?: string; // Default 'usd'
  meta?: Record<string, any>; // Additional metadata (model, tokens, request_id, etc.)
  occurredAt?: Date; // Default: now
}

/**
 * Log a cost event to the cost_events table
 * This should be called for every billable action (API calls, background jobs, tool usage)
 */
export async function logCostEvent(params: CostEventParams): Promise<void> {
  const {
    workspaceId,
    clientId = null,
    source,
    category,
    amountCents,
    currency = 'usd',
    meta = {},
    occurredAt = new Date(),
  } = params;

  // Validate inputs
  if (!workspaceId || !source || !category || amountCents < 0) {
    console.error('Invalid cost event parameters:', params);
    return;
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('cost_events')
    .insert({
      workspace_id: workspaceId,
      client_id: clientId,
      source: source,
      category: category,
      amount_cents: amountCents,
      currency: currency,
      occurred_at: occurredAt.toISOString(),
      meta: meta,
    });

  if (error) {
    console.error('Error logging cost event:', error);
    // Don't throw - cost tracking should not break the main flow
  }
}

/**
 * Log OpenAI API cost
 * Convenience function for OpenAI API calls
 */
export async function logOpenAICost(
  workspaceId: string,
  clientId: string | null,
  amountCents: number,
  meta?: {
    model?: string;
    tokens?: number;
    requestId?: string;
    [key: string]: any;
  }
): Promise<void> {
  return logCostEvent({
    workspaceId,
    clientId,
    source: 'openai',
    category: 'api',
    amountCents,
    currency: 'usd',
    meta: meta || {},
  });
}

/**
 * Log Anthropic API cost
 * Convenience function for Anthropic API calls
 */
export async function logAnthropicCost(
  workspaceId: string,
  clientId: string | null,
  amountCents: number,
  meta?: {
    model?: string;
    tokens?: number;
    requestId?: string;
    [key: string]: any;
  }
): Promise<void> {
  return logCostEvent({
    workspaceId,
    clientId,
    source: 'anthropic',
    category: 'api',
    amountCents,
    currency: 'usd',
    meta: meta || {},
  });
}

/**
 * Log tool/service cost
 * For third-party services, storage, email, etc.
 */
export async function logToolCost(
  workspaceId: string,
  clientId: string | null,
  toolName: string,
  category: 'api' | 'storage' | 'email' | 'other',
  amountCents: number,
  meta?: Record<string, any>
): Promise<void> {
  return logCostEvent({
    workspaceId,
    clientId,
    source: toolName,
    category: category,
    amountCents,
    currency: 'usd',
    meta: meta || {},
  });
}

/**
 * Batch log multiple cost events
 * More efficient for logging multiple costs at once
 */
export async function logCostEvents(events: CostEventParams[]): Promise<void> {
  if (events.length === 0) return;

  const supabase = createServiceClient();

  const costEvents = events.map(event => ({
    workspace_id: event.workspaceId,
    client_id: event.clientId || null,
    source: event.source,
    category: event.category,
    amount_cents: event.amountCents,
    currency: event.currency || 'usd',
    occurred_at: (event.occurredAt || new Date()).toISOString(),
    meta: event.meta || {},
  }));

  const { error } = await supabase
    .from('cost_events')
    .insert(costEvents);

  if (error) {
    console.error('Error batch logging cost events:', error);
    // Don't throw - cost tracking should not break the main flow
  }
}

