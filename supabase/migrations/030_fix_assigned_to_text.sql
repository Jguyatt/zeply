-- Fix assigned_to column to be TEXT instead of UUID for Clerk compatibility
-- Clerk user IDs are strings like "user_xxx", not UUIDs
-- This column was added in migration 014 as UUID but should be TEXT

-- Change assigned_to column from UUID to TEXT
ALTER TABLE deliverables ALTER COLUMN assigned_to TYPE TEXT;

-- Also fix other user_id columns that might have been missed
-- Check deliverable_activity_log.user_id and deliverable_checklist_items.done_by
-- Only alter if the tables exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deliverable_activity_log') THEN
    ALTER TABLE deliverable_activity_log ALTER COLUMN user_id TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deliverable_checklist_items') THEN
    ALTER TABLE deliverable_checklist_items ALTER COLUMN done_by TYPE TEXT;
  END IF;
  
  -- Fix deliverable_updates.created_by if it's still UUID (table created in migration 017)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deliverable_updates') THEN
    ALTER TABLE deliverable_updates ALTER COLUMN created_by TYPE TEXT;
  END IF;
END $$;
