# Zeply - Marketing Agency Platform

Production-ready SaaS platform for marketing agencies to manage clients and deliverables.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + Postgres + RLS)
- **Tailwind CSS** (UI)

## Security Architecture

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:
- Users can only access data for orgs they are members of
- Agency owners/admins can access linked client org data
- All reads/writes are scoped by `org_id`
- RLS is the final enforcement layer - no frontend-only checks

### Authentication
- Supabase Auth (email/password)
- Server-side session handling using `@supabase/auth-helpers-nextjs`
- Service role key NEVER exposed to client
- All API calls use anon key with RLS enforcement

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Get your service role key (keep secret!)

3. **Configure environment variables:**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

4. **Run migrations:**
   - In Supabase dashboard, go to SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_user_profiles.sql`

5. **Start development server:**
```bash
npm run dev
```

## Database Schema

### Tables
- `orgs` - Organizations (agencies and clients)
- `org_members` - User-org relationships with roles
- `agency_clients` - Links agencies to their clients
- `contracts` - Example product table (scoped to org)
- `user_profiles` - User metadata and active org preference

### Key Features
- Composite primary keys prevent duplicates
- Foreign keys with CASCADE deletes
- Check constraints ensure data integrity
- Automatic timestamps with triggers

## Features

### Authentication
- Sign up / Sign in pages
- Automatic agency org creation on signup
- Server-side session management

### Organization Management
- Create agency org on signup
- Create client orgs and link to agency
- Invite users to orgs by email
- Switch active org (stored in user profile)

### Contracts Management
- Create, read, update, delete contracts
- Scoped to active org
- Agency owners/admins can view linked client contracts

### Org Switcher
- Dropdown to switch between user's orgs
- Updates active org in user profile
- Persists across sessions

## Security Constraints

1. **All reads/writes scoped by org_id** - No global queries
2. **RLS is final enforcement** - Policies checked on every query
3. **No frontend-only permission checks** - All checks happen server-side
4. **Service role key never on client** - Only used in server actions/API routes
5. **Anon key respects RLS** - Client uses anon key, RLS enforces access

## File Structure

```
app/
  actions/          # Server actions (orgs, contracts)
  auth/            # Auth pages (signin, signup)
  components/      # React components (OrgSwitcher, etc.)
  dashboard/       # Protected dashboard pages
  layout.tsx       # Root layout
  globals.css      # Global styles

lib/
  supabase/
    client.ts      # Client-side Supabase client
    server.ts      # Server-side Supabase client

supabase/
  migrations/      # SQL migrations

types/
  database.types.ts # TypeScript types for database
```

## Production Deployment

1. Set up Supabase production project
2. Run migrations in production
3. Set environment variables in hosting platform
4. Build and deploy:
```bash
npm run build
npm start
```

## License

MIT
