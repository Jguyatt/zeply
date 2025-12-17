-- Update onboarding_nodes type constraint to allow new node types
-- Remove old types: payment, consent, upload, connect, call
-- Add new types: scope, terms, invoice

-- First, drop the existing constraint
ALTER TABLE onboarding_nodes 
  DROP CONSTRAINT IF EXISTS onboarding_nodes_type_check;

-- Add new constraint with updated node types
ALTER TABLE onboarding_nodes 
  ADD CONSTRAINT onboarding_nodes_type_check 
  CHECK (type IN ('welcome', 'scope', 'terms', 'contract', 'invoice'));

-- Note: Existing nodes with old types (payment, consent, upload, connect, call) will need to be migrated manually
-- or deleted before this migration can be applied successfully

