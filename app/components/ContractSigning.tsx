'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import type { OnboardingNode } from '@/app/types/onboarding';

interface ContractSigningProps {
  node: OnboardingNode;
  orgId: string;
  clerkOrgId: string;
  userId: string;
  onComplete: () => void;
  loading: boolean;
}

export default function ContractSigning({
  node,
  orgId,
  clerkOrgId,
  userId,
  onComplete,
  loading,
}: ContractSigningProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [legalName, setLegalName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!legalName.trim()) {
      alert('Please enter your full legal name');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      alert('Please accept both Terms of Service and Privacy Policy');
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      // Get signature as data URL
      const signatureDataUrl = signatureRef.current.toDataURL('image/png');

      // Calculate contract hash (simplified - in production, use actual contract content)
      const contractHash = node.config.html_content
        ? await calculateSHA256(node.config.html_content)
        : null;

      // Upload signature and create contract signature
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          signed_name: legalName.trim(),
          signature_data_url: signatureDataUrl,
          contract_sha256: contractHash,
          terms_version: node.config.terms_url || 'v1.0',
          privacy_version: node.config.privacy_url || 'v1.0',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign contract');
      }

      // Refresh to show next step
      router.refresh();
      onComplete();
    } catch (error) {
      console.error('Error signing contract:', error);
      alert(error instanceof Error ? error.message : 'Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">{node.title}</h2>
        {node.description && (
          <p className="text-secondary">{node.description}</p>
        )}
      </div>

      {/* Contract Viewer */}
      {node.config.html_content && (
        <div className="glass-surface rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: node.config.html_content }}
          />
        </div>
      )}

      {/* Legal Name Input */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Full Legal Name
        </label>
        <input
          type="text"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Enter your full legal name as it appears on official documents"
          className="w-full px-4 py-3 glass-surface rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
        />
      </div>

      {/* Signature Canvas */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Signature
        </label>
        <div className="glass-surface rounded-lg p-4">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full border border-white/20 rounded-lg bg-white',
              style: { background: 'transparent' },
            }}
            backgroundColor="transparent"
            penColor="#ffffff"
          />
          <button
            onClick={clearSignature}
            className="mt-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Clear Signature
          </button>
        </div>
      </div>

      {/* Terms and Privacy Checkboxes */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
          />
          <div>
            <span className="text-primary font-medium">I agree to the Terms of Service</span>
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
            <span className="text-primary font-medium">I agree to the Privacy Policy</span>
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

      {/* Sign Button */}
      <button
        onClick={handleSign}
        disabled={signing || loading || !legalName.trim() || !termsAccepted || !privacyAccepted}
        className="w-full px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
      >
        {signing ? 'Signing...' : 'Sign and Continue'}
      </button>
    </div>
  );
}

// Helper function to calculate SHA256 hash
async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

