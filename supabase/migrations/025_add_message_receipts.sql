-- Add delivered and read receipts to messages

-- Add delivered_at timestamp to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Mark all existing messages as delivered (they were delivered when created)
UPDATE messages
SET delivered_at = created_at
WHERE delivered_at IS NULL;

-- Create message_read_status table to track which messages were read by which users
CREATE TABLE IF NOT EXISTS message_read_status (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

-- Enable RLS
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Permissive policy (app-level checks handle permissions)
CREATE POLICY "Allow all for authenticated users" ON message_read_status
  FOR ALL USING (true) WITH CHECK (true);
