/**
 * Status Transition Rules and Validation
 */

export type DeliverableStatus = 
  | 'planned'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'complete'
  | 'blocked'
  | 'revisions_requested';

export interface Deliverable {
  id: string;
  status: DeliverableStatus;
  progress: number;
  client_visible: boolean;
  deliverable_assets?: Array<{
    is_required_proof: boolean;
    proof_type?: string;
  }>;
}

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  planned: ['in_progress', 'blocked'],
  in_progress: ['in_review', 'blocked', 'planned'],
  in_review: ['approved', 'revisions_requested', 'blocked'],
  approved: ['complete', 'in_review'],
  complete: [], // Terminal state
  blocked: ['planned', 'in_progress'],
  revisions_requested: ['in_progress', 'blocked'],
};

/**
 * Check if a status transition is allowed
 */
export function canTransitionTo(
  newStatus: DeliverableStatus,
  deliverable: Deliverable
): { allowed: boolean; reason?: string } {
  const currentStatus = deliverable.status;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { allowed: true };
}

/**
 * Validate if deliverable can be marked complete
 */
export function validateComplete(
  deliverable: Deliverable
): { valid: boolean; reason?: string } {
  // Check if required proof is attached
  const requiredProofs = deliverable.deliverable_assets?.filter(
    (asset) => asset.is_required_proof
  ) || [];

  if (requiredProofs.length === 0) {
    return {
      valid: false,
      reason: 'Required proof must be attached before marking complete',
    };
  }

  // Must be approved OR have explicit "complete without approval" reason
  // (The reason check is handled in the calling function)
  if (deliverable.status !== 'approved') {
    return {
      valid: false,
      reason: 'Deliverable must be approved before marking complete, or provide a reason for completing without approval',
    };
  }

  return { valid: true };
}

/**
 * Validate if deliverable can be sent to review
 */
export function validateSendToReview(
  deliverable: Deliverable
): { valid: boolean; reason?: string } {
  // Progress must be at least 80%
  if (deliverable.progress < 80) {
    return {
      valid: false,
      reason: `Progress must be at least 80% (currently ${deliverable.progress}%)`,
    };
  }

  // Required proofs must be attached
  const requiredProofs = deliverable.deliverable_assets?.filter(
    (asset) => asset.is_required_proof
  ) || [];

  if (requiredProofs.length === 0) {
    return {
      valid: false,
      reason: 'Required proof must be attached before sending to review',
    };
  }

  return { valid: true };
}

