'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const supabase = createClient();

  const createAgencyOrg = async (userId: string, userName: string, organizationName: string) => {
    try {
      // Use provided org name or fallback to default
      const finalOrgName = organizationName.trim() || `${userName}'s Agency`;
      
      // Create agency org for new user
      const { data: org, error: orgError } = await (supabase
        .from('orgs') as any)
        .insert({
          name: finalOrgName,
          kind: 'agency',
        })
        .select()
        .single();

      if (org && !orgError) {
        // Add user as owner
        await (supabase.from('org_members') as any).insert({
          org_id: (org as any).id,
          user_id: userId,
          role: 'owner',
        });

        // Set as active org
        await (supabase
          .from('user_profiles') as any)
          .upsert({ 
            user_id: userId,
            active_org_id: (org as any).id, 
            full_name: userName 
          });
      }
    } catch (err) {
      console.error('Error creating agency org:', err);
      // Continue anyway - org can be created later
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLoaded) {
      setError('Please wait...');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
      });

      // Complete the signup
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Create agency org for new user
        if (result.createdUserId) {
          await createAgencyOrg(result.createdUserId, name, orgName);
        }

        // Use window.location for a hard redirect to ensure server-side logic runs
        window.location.href = '/';
      } else {
        // Need to verify email or complete signup
        setError('Please check your email to verify your account.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-light text-primary">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="glass-surface border border-red-400/20 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-secondary mb-2">
                Organization Name <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                id="orgName"
                name="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., Acme Marketing Agency"
                className="w-full px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
              />
              <p className="mt-2 text-xs text-secondary">
                Leave blank to use "{name ? name.split(' ')[0] : 'Your'}'s Agency"
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full flex justify-center py-3 px-4 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all shadow-prestige-soft disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/signin" className="text-secondary hover:text-accent transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
