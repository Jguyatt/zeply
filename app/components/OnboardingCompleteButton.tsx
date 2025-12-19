'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingModal from './OnboardingModal';

interface OnboardingCompleteButtonProps {
  nodeId: string;
  clerkOrgId: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  termsUrl?: string;
  privacyUrl?: string;
}

export default function OnboardingCompleteButton({ 
  nodeId, 
  clerkOrgId,
  termsAccepted,
  privacyAccepted,
  termsUrl,
  privacyUrl
}: OnboardingCompleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'info' | 'warning'>('info');

  const handleComplete = async () => {
    // For terms nodes, check if both are accepted
    if (termsAccepted !== undefined && privacyAccepted !== undefined) {
      if (!termsAccepted || !privacyAccepted) {
        setModalMessage('Please accept both Terms of Service and Privacy Policy');
        setModalType('warning');
        setModalOpen(true);
        return;
      }
    }

    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingCompleteButton.tsx:handleComplete-start',message:'Starting onboarding step completion',data:{nodeId,clerkOrgId,url:`/api/orgs/${clerkOrgId}/onboarding/progress`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const requestBody: any = { 
        nodeId,
        status: 'completed',
      };

      // Include metadata for terms acceptance
      if (termsAccepted !== undefined && privacyAccepted !== undefined) {
        requestBody.metadata = {
          terms_version: termsUrl || 'v1.0',
          privacy_version: privacyUrl || 'v1.0',
          accepted_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingCompleteButton.tsx:handleComplete-response',message:'Received API response',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorText = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingCompleteButton.tsx:handleComplete-error',message:'API request failed',data:{status:response.status,statusText:response.statusText,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to complete step: ${errorText}`);
      }

      const responseData = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingCompleteButton.tsx:handleComplete-success',message:'Step completed successfully',data:{responseData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Refresh to show next step or redirect if all complete
      router.refresh();
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingCompleteButton.tsx:handleComplete-catch',message:'Exception caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error('Error completing step:', error);
      setModalMessage('Failed to complete step. Please try again.');
      setModalType('error');
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleComplete}
        disabled={loading}
        className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {loading ? 'Processing...' : "I confirm I have read this page"}
      </button>

      <OnboardingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
        type={modalType}
      />
    </>
  );
}
