# Backend Setup Guide

You have **two backend options** set up:

## Option 1: Next.js + Supabase (Recommended - Production Ready)

This is the main backend we built with:
- **Next.js 14** (App Router)
- **Supabase** (Auth + Postgres + RLS)
- **Server Actions** for API logic
- **Row Level Security** for data protection

### Location
- Backend code: `app/` directory
- Database migrations: `supabase/migrations/`
- Server actions: `app/actions/`

### To Use This Backend:

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

3. **Run Supabase migrations:**
   - Go to Supabase Dashboard → SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_user_profiles.sql`

4. **Start Next.js dev server:**
```bash
npm run dev
```

This will run on `http://localhost:3000` (Next.js default)

### Features Available:
- ✅ Authentication (sign up/in)
- ✅ Email verification
- ✅ Organization management
- ✅ Client management (for agencies)
- ✅ Contracts management
- ✅ Org switcher
- ✅ Protected routes with RLS

---

## Option 2: Express + MongoDB (Legacy)

This was the first backend we created but is now replaced by Next.js + Supabase.

### Location
- Backend code: `server/` directory

### To Use This Backend:

1. **Navigate to server directory:**
```bash
cd server
npm install
```

2. **Set up environment variables** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zeply
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

3. **Start server:**
```bash
npm run dev
```

This will run on `http://localhost:5000`

---

## Current Situation

You're currently running **Vite** (React Router) which is just the frontend. To use the backend:

### If you want to use Next.js + Supabase:
1. Stop the Vite server
2. Run `npm run dev` (which will start Next.js)
3. The frontend AND backend will be served together

### If you want to keep Vite frontend:
You'll need to create API proxy routes or switch the frontend to use Supabase directly (which the AuthModal already does).

---

## Recommendation

**Use Next.js + Supabase** - it's production-ready, has better security with RLS, and everything is integrated. Just run `npm run dev` and it will serve both frontend and backend.

