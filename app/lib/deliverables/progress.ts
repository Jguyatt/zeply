/**
 * Progress Calculation Utilities
 */

export interface ChecklistItem {
  id: string;
  is_done: boolean;
}

/**
 * Calculate progress percentage from checklist items
 */
export function calculateProgress(checklistItems: ChecklistItem[]): number {
  if (checklistItems.length === 0) {
    return 0;
  }

  const doneCount = checklistItems.filter((item) => item.is_done).length;
  const totalCount = checklistItems.length;

  return Math.round((doneCount / totalCount) * 100);
}

/**
 * Check if deliverable is ready for "Finishing Touches" gate
 */
export function isReadyForFinishingTouches(progress: number): boolean {
  return progress >= 80;
}

