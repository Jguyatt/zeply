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

      {/* Contract Viewer - Show document file if uploaded, otherwise show HTML content */}
      {(() => {
        const contractFile = node.config?.document_file;
        const contractUrl = contractFile?.url || contractFile?.data;
        
        if (contractUrl) {
          const fileType = contractFile.type;
          const isPDF = fileType === 'application/pdf';
          const isImage = fileType?.startsWith('image/');
          
          return (
            <div className="bg-neutral-800/50 rounded-xl border border-white/10 overflow-hidden mb-6 shadow-xl">
              {isPDF ? (
                <iframe
                  src={contractUrl}
                  className="w-full h-[70vh] min-h-[600px] bg-white"
                  title="Contract"
                  style={{ maxHeight: '800px' }}
                />
              ) : isImage ? (
                <img
                  src={contractUrl}
                  alt={contractFile.name || 'Contract'}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
          );
        }
        
        if (node.config.html_content) {
          return (
            <div className="bg-neutral-800/50 rounded-xl p-6 max-h-96 overflow-y-auto mb-6 border border-white/10">
              <div
                className="prose prose-invert max-w-none text-neutral-300"
                dangerouslySetInnerHTML={{ __html: node.config.html_content }}
              />
            </div>
          );
        }
        
        return null;
      })()}

      {/* Legal Name Input */}
      <div>
        <label 
          className="block text-sm font-medium text-white mb-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Full Legal Name
        </label>
        <input
          type="text"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Enter your full legal name as it appears on official documents"
          className="w-full px-4 py-3 bg-neutral-800/50 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#D6B36A]/50 border border-white/10 transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
      </div>

      {/* Signature Canvas */}
      <div>
        <label 
          className="block text-sm font-medium text-white mb-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Signature
        </label>
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-white/10">
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
            className="mt-2 text-sm text-neutral-400 hover:text-white transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Clear Signature
          </button>
        </div>
      </div>

      {/* Terms and Privacy Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-800/30 rounded-lg border border-white/5 hover:border-white/10 transition-all">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A]"
          />
          <div>
            <span 
              className="text-white font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              I agree to the Terms of Service
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
          <div>
            <span 
              className="text-white font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              I agree to the Privacy Policy
            </span>
            {node.config.privacy_url && (
              <a
                href={node.config.privacy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-[#D6B36A] hover:text-[#D6B36A]/80 text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
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
        className="w-full px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#D6B36A]"
        style={{ fontFamily: "'Inter', sans-serif" }}
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

