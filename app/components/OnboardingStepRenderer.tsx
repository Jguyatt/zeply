'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingNode } from '@/app/types/onboarding';
import ContractSigning from './ContractSigning';

interface OnboardingStepRendererProps {
  node: OnboardingNode;
  orgId: string;
  clerkOrgId: string;
  userId: string;
  allNodes: OnboardingNode[];
  completedNodeIds: Set<string>;
}

export default function OnboardingStepRenderer({
  node,
  orgId,
  clerkOrgId,
  userId,
  allNodes,
  completedNodeIds,
}: OnboardingStepRendererProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodeId: node.id,
          status: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      // Refresh to show next step or redirect if all complete
      router.refresh();
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Failed to complete step. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  switch (node.type) {
    case 'welcome':
      // If document file is uploaded, show it (support both URL and base64 for backwards compatibility)
      const documentFile = node.config?.document_file;
      const documentUrl = documentFile?.url || documentFile?.data;
      if (documentUrl) {
        const fileType = documentFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className="space-y-6">
            <div>
              <h2 
                className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
                style={{ fontFamily: "'canela-text', serif" }}
              >
                {node.title}
              </h2>
              {node.description && (
                <p 
                  className="text-base md:text-lg text-neutral-400 mb-6 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {node.description}
                </p>
              )}
            </div>
            <div className="bg-neutral-800/50 rounded-xl border border-white/10 overflow-hidden shadow-xl">
              {isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-[70vh] min-h-[600px] bg-white"
                  title="Document"
                  style={{ maxHeight: '800px' }}
                />
              ) : isImage ? (
                <img
                  src={documentUrl}
                  alt={documentFile.name || 'Document'}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {loading ? 'Processing...' : "I confirm I have read this page"}
            </button>
          </div>
        );
      }
      
      // Fallback if no document
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          <p 
            className="text-neutral-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            No document available.
          </p>
        </div>
      );

    case 'scope':
      // If document file is uploaded, show it (support both URL and base64 for backwards compatibility)
      const scopeDocFile = node.config?.document_file;
      const scopeDocUrl = scopeDocFile?.url || scopeDocFile?.data;
      if (scopeDocUrl) {
        const fileType = scopeDocFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className="space-y-6">
            <div>
              <h2 
                className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
                style={{ fontFamily: "'canela-text', serif" }}
              >
                {node.title}
              </h2>
              {node.description && (
                <p 
                  className="text-base md:text-lg text-neutral-400 mb-6 leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {node.description}
                </p>
              )}
            </div>
            <div className="bg-neutral-800/50 rounded-xl border border-white/10 overflow-hidden shadow-xl">
              {isPDF ? (
                <iframe
                  src={scopeDocUrl}
                  className="w-full h-[70vh] min-h-[600px] bg-white"
                  title="Scope of Services"
                  style={{ maxHeight: '800px' }}
                />
              ) : isImage ? (
                <img
                  src={scopeDocUrl}
                  alt={scopeDocFile.name || 'Scope of Services'}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {loading ? 'Processing...' : "I confirm I have read this"}
            </button>
          </div>
        );
      }
      
      // Fallback if no document
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          <p 
            className="text-neutral-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            No document available.
          </p>
        </div>
      );

    case 'invoice':
      const paymentStatus = node.config?.payment_status || 'pending';
      const isPaid = paymentStatus === 'paid' || paymentStatus === 'confirmed';
      
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 mb-6 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          {!isPaid ? (
            <>
          {node.config.stripe_url && (
            <div className="space-y-6">
              {node.config.amount_label && (
                <div className="p-6 bg-neutral-800/50 rounded-xl border border-white/10">
                  <p 
                    className="text-xl text-white font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Amount: <span className="text-[#D6B36A] text-2xl">{node.config.amount_label}</span>
                  </p>
                </div>
              )}
              <a
                href={node.config.stripe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Pay Now
              </a>
            </div>
          )}
              {!node.config.stripe_url && (
                <div className="p-6 bg-neutral-800/50 rounded-xl border border-white/10">
                  <p 
                    className="text-neutral-400"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    No payment link configured.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 bg-[#D6B36A]/10 rounded-xl border border-[#D6B36A]/30">
              <p 
                className="text-[#D6B36A] font-medium mb-4 text-lg"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Payment Received
              </p>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? 'Processing...' : "I confirm I have paid"}
          </button>
            </div>
          )}
        </div>
      );

    case 'contract':
      // Always use ContractSigning component which handles both document and HTML content cases
      return (
        <ContractSigning
          node={node}
          orgId={orgId}
          clerkOrgId={clerkOrgId}
          userId={userId}
          onComplete={handleComplete}
          loading={loading}
        />
      );

    case 'terms':
      const [termsAccepted, setTermsAccepted] = useState(false);
      const [privacyAccepted, setPrivacyAccepted] = useState(false);

      const handleTermsComplete = async () => {
        if (!termsAccepted || !privacyAccepted) {
          alert('Please accept both Terms of Service and Privacy Policy');
          return;
        }

        setLoading(true);
        try {
          const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: node.id,
              metadata: {
                terms_version: node.config.terms_url || 'v1.0',
                privacy_version: node.config.privacy_url || 'v1.0',
                accepted_at: new Date().toISOString(),
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to complete step');
          }

          router.refresh();
        } catch (error) {
          console.error('Error completing terms:', error);
          alert('Failed to complete step. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      // If document file is uploaded, show it
      const termsDocFile = node.config?.document_file;
      const termsDocUrl = termsDocFile?.url || termsDocFile?.data;

      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 mb-6 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          
          {/* Document Display if uploaded */}
          {termsDocUrl && (
            <div className="bg-neutral-800/50 rounded-xl border border-white/10 overflow-hidden mb-6 shadow-xl">
              {termsDocFile.type === 'application/pdf' ? (
                <iframe
                  src={termsDocUrl}
                  className="w-full h-[70vh] min-h-[600px] bg-white"
                  title="Terms & Privacy"
                  style={{ maxHeight: '800px' }}
                />
              ) : termsDocFile.type?.startsWith('image/') ? (
                <img
                  src={termsDocUrl}
                  alt={termsDocFile.name || 'Terms & Privacy'}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-800/30 rounded-lg border border-white/5 hover:border-white/10 transition-all">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A]"
              />
              <div className="flex-1">
                <span 
                  className="text-white font-medium"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  I accept the Terms of Service
                </span>
                {node.config.terms_url && (
                  <a
                    href={node.config.terms_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[#D6B36A] hover:text-[#D6B36A]/80 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    (View Terms)
                  </a>
                )}
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-800/30 rounded-lg border border-white/5 hover:border-white/10 transition-all">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A]"
              />
              <div className="flex-1">
                <span 
                  className="text-white font-medium"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  I accept the Privacy Policy
                </span>
                {node.config.privacy_url && (
                  <a
                    href={node.config.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[#D6B36A] hover:text-[#D6B36A]/80 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    (View Policy)
                  </a>
                )}
              </div>
            </label>
          </div>
          <button
            onClick={handleTermsComplete}
            disabled={loading || !termsAccepted || !privacyAccepted}
            className="px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      );

    default:
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          <p 
            className="text-neutral-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            This step type is not yet implemented.
          </p>
        </div>
      );
  }
}

