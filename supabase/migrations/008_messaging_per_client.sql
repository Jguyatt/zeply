-- Update messaging to support per-client conversations
-- Each client member gets their own conversation with the agency

-- Add client_user_id to conversations (nullable for org-wide, or specific client)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS client_user_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_client_user ON conversations(org_id, client_user_id);

-- Update the unique constraint to allow one conversation per client per org
-- Remove the old constraint if it exists and add a new one
DO $$ 
BEGIN
  -- Drop existing unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_org_id_key'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_org_id_key;
  END IF;
END $$;

-- Add unique constraint for org + client_user_id (null means org-wide)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_org_client_unique 
ON conversations(org_id, COALESCE(client_user_id, ''));

