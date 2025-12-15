# Database Migration Instructions

## ⚠️ IMPORTANT: Run These Migrations First!

The "Database error saving new user" error occurs because the database tables haven't been created yet. You need to run the SQL migrations in your Supabase project.

## Steps to Fix:

### 1. Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project (the one with URL: `hpavjqzabqyvnvqfwhax.supabase.co`)

### 2. Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New query"

### 3. Run Migration 1: Initial Schema
1. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Wait for it to complete successfully

### 4. Run Migration 2: User Profiles
1. Copy the entire contents of `supabase/migrations/002_user_profiles.sql`
2. Paste it into the SQL Editor
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Wait for it to complete successfully

### 5. Verify Tables Were Created
In the SQL Editor, run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `agency_clients`
- `contracts`
- `org_members`
- `orgs`
- `user_profiles`

### 6. Test Signup Again
After running both migrations, try signing up again. The error should be resolved!

## Troubleshooting

If you get errors when running the migrations:

1. **"relation already exists"** - Some tables might already exist. You can either:
   - Drop existing tables and re-run, OR
   - Skip the CREATE TABLE statements that already exist

2. **"function already exists"** - The trigger function might already exist. You can:
   - Use `CREATE OR REPLACE FUNCTION` instead of `CREATE FUNCTION`

3. **Permission errors** - Make sure you're running as the database owner or have proper permissions

## Need Help?

If migrations fail, check the error message in Supabase SQL Editor and let me know what it says!

