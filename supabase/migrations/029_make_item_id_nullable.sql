-- Make item_id nullable in onboarding_progress to support node_id-based records
-- This allows the table to support both old item_id-based and new node_id-based onboarding flows

ALTER TABLE onboarding_progress 
  ALTER COLUMN item_id DROP NOT NULL;

-- Add a check constraint to ensure at least one of item_id or node_id is set
ALTER TABLE onboarding_progress 
  ADD CONSTRAINT check_item_or_node 
  CHECK (item_id IS NOT NULL OR node_id IS NOT NULL);
