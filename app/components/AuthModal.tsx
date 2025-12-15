'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, mode = 'signin' }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(mode === 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // Always call hooks (React rules) but handle errors gracefully
  const signInHook = useSignIn();
  const signUpHook = useSignUp();
  
  const signIn = signInHook?.signIn || null;
  const setActive = signInHook?.setActive || null;
  const signInLoaded = signInHook?.isLoaded || false;
  
  const signUp = signUpHook?.signUp || null;
  const signUpLoaded = signUpHook?.isLoaded || false;
  
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsSignIn(mode === 'signin');
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  }, [mode, isOpen]);

  useEffect(() => {
    setIsSignIn(mode === 'signin');
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  }, [mode, isOpen]);

  // Don't render if not open or not mounted
  if (!isOpen || !mounted) {
    if (isOpen) {
      console.log('AuthModal: Not rendering because not mounted yet. isOpen:', isOpen, 'mounted:', mounted);
    }
    return null;
  }
  
  console.log('AuthModal: Rendering modal. isOpen:', isOpen, 'mounted:', mounted, 'mode:', mode);

  // Show loading state if Clerk isn't loaded yet
  const clerkLoaded = isSignIn ? signInLoaded : signUpLoaded;
  
  // Check if Clerk is configured
  const clerkConfigured = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     (window as any).__CLERK_PUBLISHABLE_KEY);

  const createAgencyOrg = async (userId: string, userName: string) => {
    try {
      // Create agency org for new user
      const { data: org, error: orgError } = await (supabase
        .from('orgs') as any)
        .insert({
          name: `${userName}'s Agency`,
          kind: 'agency',
        })
        .select()
        .single();

      if (org && !orgError) {
        // Add user as owner
        await supabase.from('org_members').insert({
          org_id: org.id,
          user_id: userId,
          role: 'owner',
        });

        // Set as active org
        await supabase
          .from('user_profiles')
          .upsert({ 
            user_id: userId,
            active_org_id: org.id, 
            full_name: userName 
          });
      }
    } catch (err) {
      console.error('Error creating agency org:', err);
      // Continue anyway - org can be created later
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignIn) {
        if (!signIn || !signInLoaded) {
          setError('Authentication not ready. Please wait...');
          setLoading(false);
          return;
        }

        if (!signIn || !signIn.create) {
          setError('Clerk is not properly configured. Please check your environment variables.');
          setLoading(false);
          return;
        }

        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          onClose();
          router.push('/dashboard');
          router.refresh();
        } else {
          setError('Sign in incomplete. Please try again.');
          setLoading(false);
        }
      } else {
        if (!signUp || !signUpLoaded) {
          setError('Authentication not ready. Please wait...');
          setLoading(false);
          return;
        }

        if (!signUp || !signUp.create) {
          setError('Clerk is not properly configured. Please check your environment variables.');
          setLoading(false);
          return;
        }

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
            await createAgencyOrg(result.createdUserId, name);
          }

          onClose();
          router.push('/dashboard');
          router.refresh();
        } else {
          // Need to verify email or complete signup
          setError('Please check your email to verify your account.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 z-[9998] transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div 
          className="relative z-[10000] inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-gray-900">
                {isSignIn ? 'Sign In' : 'Sign Up'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!clerkConfigured && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm mb-4">
                ⚠️ Clerk is not configured. Please add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env.local file.
              </div>
            )}
            {clerkConfigured && !clerkLoaded && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm mb-4">
                Loading authentication...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {!isSignIn && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required={!isSignIn}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !clerkConfigured || (isSignIn ? !signInLoaded : !signUpLoaded)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {loading ? (isSignIn ? 'Signing in...' : 'Creating account...') : (isSignIn ? 'Sign In' : 'Sign Up')}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => {
                  setIsSignIn(!isSignIn);
                  setError(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                {isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal in portal if browser, otherwise render normally
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
}
