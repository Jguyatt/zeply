# Clerk Setup Instructions

## 1. Get Your Clerk Keys

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Create a new application
3. Go to **API Keys** in your dashboard
4. Copy your keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

## 2. Add Environment Variables

Create or update `.env.local` in your project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (keep your existing keys)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Update Database User IDs

**Important**: Your existing database uses Supabase Auth user IDs. After switching to Clerk, you'll need to:

1. **Option A**: Migrate existing users (if you have any)
   - Map Supabase user IDs to Clerk user IDs
   - Update `user_profiles` and `org_members` tables

2. **Option B**: Start fresh (recommended for new projects)
   - New signups will use Clerk user IDs
   - Existing data will need to be migrated manually if needed

## 4. Test the Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Try signing up a new user
3. Verify the user is created in Clerk dashboard
4. Check that the agency org is created in Supabase

## 5. Clerk Dashboard Features

- **Users**: View all registered users
- **Sessions**: Monitor active sessions
- **Organizations**: If you want to use Clerk's org feature (we're using our own org system)
- **Webhooks**: Set up webhooks for user events if needed

## Notes

- Clerk handles authentication (sign up, sign in, sessions)
- Supabase still handles your database and RLS policies
- Your org-based access control remains the same
- User IDs in your database will now be Clerk user IDs (format: `user_...`)

