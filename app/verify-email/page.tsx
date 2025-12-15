'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkVerification();
    // Poll for verification every 3 seconds
    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkVerification = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // If no user, they might be in the process of signing up
      // Allow them to stay on this page to see instructions
      if (!user && userError) {
        setLoading(false);
        // Don't redirect - let them see the page with instructions
        return;
      }
      
      if (user) {
        setEmail(user.email || null);
        
        if (user.email_confirmed_at) {
          setIsVerified(true);
          setLoading(false);
          
          // Create agency org for newly verified user
          const createAgencyOrg = async () => {
            try {
              const { data: profile } = await (supabase
                .from('user_profiles') as any)
                .select('full_name')
                .eq('user_id', user.id)
                .single();

              const fullName = (profile as any)?.full_name || user.email?.split('@')[0] || 'User';
              
              // Check if user already has an org
              const { data: existingOrgs } = await (supabase
                .from('org_members') as any)
                .select('org_id')
                .eq('user_id', user.id)
                .limit(1);

              if (!existingOrgs || existingOrgs.length === 0) {
                // Create agency org for new user
                const { data: org, error: orgError } = await (supabase
                  .from('orgs') as any)
                  .insert({
                    name: `${fullName}'s Agency`,
                    kind: 'agency',
                  })
                  .select()
                  .single();

                if (org && !orgError) {
                  // Add user as owner
                  await (supabase.from('org_members') as any).insert({
                    org_id: (org as any).id,
                    user_id: user.id,
                    role: 'owner',
                  });

                  // Set as active org
                  await (supabase
                    .from('user_profiles') as any)
                    .update({ active_org_id: (org as any).id })
                    .eq('user_id', user.id);
                }
              }
            } catch (error) {
              console.error('Error creating agency org:', error);
              // Don't block redirect if org creation fails
            }
          };

          await createAgencyOrg();
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2000);
        } else {
          setIsVerified(false);
          setLoading(false);
        }
      } else {
        // No user yet - might be signing up, show the page anyway
        setIsVerified(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email || undefined,
      });

      if (error) {
        alert('Error resending email: ' + error.message);
      } else {
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      alert('Error resending email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-4">Your email has been verified successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-gray-900 mb-2">Verify Your Email</h1>
          {email ? (
            <>
              <p className="text-gray-600">
                We've sent a verification email to
              </p>
              <p className="text-gray-900 font-medium mt-1">{email}</p>
            </>
          ) : (
            <p className="text-gray-600">
              Please check your email for a verification link. We've sent it to the email address you used to sign up.
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Check your inbox</p>
              <p>Click the verification link in the email we sent you. If you don't see it, check your spam folder.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={resending || !email}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button
            onClick={checkVerification}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            I've Verified My Email
          </button>

          <div className="text-center">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/auth/signin');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out and use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

