# Database Cleanup Instructions

## Problem
You have 3,130+ organizations in your database, but only 5 valid organizations in Clerk. Most of these are test/dummy data that need to be cleaned up.

## Solution

### Step 0: Remove Duplicates First

**IMPORTANT:** Before cleaning up invalid orgs, you need to remove duplicates.

1. Run `scripts/remove-duplicate-orgs.sql` first
   - This removes duplicate orgs with the same `clerk_org_id`
   - Keeps the oldest org, deletes all duplicates
   - This is necessary because you have 2000+ orgs with duplicate Clerk IDs

### Step 1: Get Your Valid Clerk Org IDs

1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Organizations**
3. Copy all the Organization IDs (they start with `org_`)

### Step 2: Update the Cleanup Script

1. **First**, make sure you've run `remove-duplicate-orgs.sql` (Step 0)
2. Open `scripts/cleanup-orgs.sql`
3. Find the valid Clerk org IDs list (appears twice in the script)
4. Replace the example IDs with your actual Clerk org IDs:

```sql
WITH valid_clerk_org_ids AS (
  SELECT unnest(ARRAY[
    'org_YOUR_FIRST_ORG_ID',   -- Organization Name
    'org_YOUR_SECOND_ORG_ID',  -- Organization Name
    'org_YOUR_THIRD_ORG_ID',   -- Organization Name
    -- Add all your valid org IDs here
  ]) AS clerk_org_id
)
```

### Step 3: Run the Cleanup Script (After Removing Duplicates)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/cleanup-orgs.sql`
4. **Review the script carefully** - make sure all your valid org IDs are included
5. Click **Run** to execute

### Step 4: Run the Migration (After Cleanup)

After cleanup, run the migration to add the unique constraint:

1. In Supabase SQL Editor, run `supabase/migrations/012_add_unique_clerk_org_id.sql`
2. This will:
   - Remove any duplicate `clerk_org_id` values (keeps the oldest)
   - Add a unique constraint to prevent future duplicates

### Step 5: Verify

After running both scripts, verify:
- Only your valid organizations remain
- Each organization has a unique `clerk_org_id`
- Member counts are correct

## Prevention

The code has been updated to:
- Always check if an org exists before creating it
- Handle unique constraint violations gracefully
- Prevent duplicate org creation even under concurrent requests

## What Gets Deleted

The cleanup script will delete:
- All organizations without a `clerk_org_id` (NULL)
- All organizations with `clerk_org_id` not in your valid list
- All associated `org_members` records (cascaded)

## What Gets Kept

- Organizations with valid `clerk_org_id` matching your Clerk orgs
- All associated data (members, deliverables, etc.) for valid orgs

