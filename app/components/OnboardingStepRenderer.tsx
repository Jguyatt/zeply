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
        body: JSON.stringify({ nodeId: node.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      // Refresh to show next step
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
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
              {node.description && (
                <p className="text-secondary mb-4">{node.description}</p>
              )}
            </div>
            <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
              {isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-[600px] bg-white"
                  title="Document"
                />
              ) : isImage ? (
                <img
                  src={documentUrl}
                  alt={documentFile.name || 'Document'}
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-8 text-center text-secondary">
                  <p>Unsupported file type</p>
                </div>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
            >
              {loading ? 'Processing...' : "I've read this"}
            </button>
          </div>
        );
      }
      
      // Fallback if no document
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
            {node.description && (
              <p className="text-secondary">{node.description}</p>
            )}
          </div>
          <p className="text-secondary">No document available.</p>
        </div>
      );

    case 'payment':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
            {node.description && (
              <p className="text-secondary">{node.description}</p>
            )}
          </div>
          {node.config.stripe_url && (
            <div className="space-y-4">
              {node.config.amount_label && (
                <p className="text-lg text-primary font-medium">
                  Amount: {node.config.amount_label}
                </p>
              )}
              <a
                href={node.config.stripe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30"
              >
                Pay Invoice
              </a>
            </div>
          )}
          <button
            onClick={handleComplete}
            disabled={loading || !node.config.stripe_url}
            className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
          >
            {loading ? 'Processing...' : "I've paid"}
          </button>
        </div>
      );

    case 'contract':
      // If document file is uploaded, show it with signing (support both URL and base64)
      const contractFile = node.config?.document_file;
      const contractUrl = contractFile?.url || contractFile?.data;
      if (contractUrl) {
        const fileType = contractFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
              {node.description && (
                <p className="text-secondary mb-4">{node.description}</p>
              )}
            </div>
            <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
              {isPDF ? (
                <iframe
                  src={contractUrl}
                  className="w-full h-[600px] bg-white"
                  title="Contract"
                />
              ) : isImage ? (
                <img
                  src={contractUrl}
                  alt={contractFile.name || 'Contract'}
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-8 text-center text-secondary">
                  <p>Unsupported file type</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Legal Name"
                className="w-full px-4 py-2 glass-surface rounded-lg border border-white/10 focus:border-accent/50 focus:outline-none text-primary placeholder:text-muted"
              />
              <div className="h-32 glass-surface rounded-lg border border-white/10 flex items-center justify-center text-secondary text-sm">
                Signature Canvas
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-primary text-sm">I agree to the Terms of Service</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-primary text-sm">I agree to the Privacy Policy</span>
                </label>
              </div>
            </div>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
            >
              {loading ? 'Processing...' : 'Sign and Continue'}
            </button>
          </div>
        );
      }
      
      // Fallback to ContractSigning component if no document
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

    case 'consent':
      const [termsAccepted, setTermsAccepted] = useState(false);
      const [privacyAccepted, setPrivacyAccepted] = useState(false);

      const handleConsentComplete = async () => {
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
          console.error('Error completing consent:', error);
          alert('Failed to complete step. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
            {node.description && (
              <p className="text-secondary">{node.description}</p>
            )}
          </div>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-primary font-medium">Terms of Service</span>
                {node.config.terms_url && (
                  <a
                    href={node.config.terms_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-accent hover:text-accent/80"
                  >
                    (View Terms)
                  </a>
                )}
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-primary font-medium">Privacy Policy</span>
                {node.config.privacy_url && (
                  <a
                    href={node.config.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-accent hover:text-accent/80"
                  >
                    (View Privacy Policy)
                  </a>
                )}
              </div>
            </label>
          </div>
          <button
            onClick={handleConsentComplete}
            disabled={loading || !termsAccepted || !privacyAccepted}
            className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      );

    default:
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
            {node.description && (
              <p className="text-secondary">{node.description}</p>
            )}
          </div>
          <p className="text-secondary">This step type is not yet implemented.</p>
        </div>
      );
  }
}

