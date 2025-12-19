'use client';

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import OnboardingModal from './OnboardingModal';
import type { OnboardingNode } from '@/app/types/onboarding';

interface ContractSigningFormProps {
  node: OnboardingNode;
  clerkOrgId: string;
  onSign: (legalName: string, signatureDataUrl: string) => Promise<void>;
  loading: boolean;
  termsAlreadyAccepted?: boolean;
  onNameChange?: (name: string) => void;
  onSignatureChange?: (signatureDataUrl: string) => void;
}

export default function ContractSigningForm({
  node,
  clerkOrgId,
  onSign,
  loading,
  termsAlreadyAccepted = false,
  onNameChange,
  onSignatureChange,
}: ContractSigningFormProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [legalName, setLegalName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(termsAlreadyAccepted);
  const [privacyAccepted, setPrivacyAccepted] = useState(termsAlreadyAccepted);
  const [signing, setSigning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'info' | 'warning'>('warning');
  
  // Notify parent of name changes for contract preview
  useEffect(() => {
    onNameChange?.(legalName);
  }, [legalName, onNameChange]);
  
  // Update contract when signature is drawn
  useEffect(() => {
    const canvas = signatureRef.current?.getCanvas();
    if (!canvas || !onSignatureChange) return;
    
    const updateSignature = () => {
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        const signatureDataUrl = signatureRef.current.toDataURL('image/png');
        onSignatureChange(signatureDataUrl);
      } else {
        onSignatureChange('');
      }
    };
    
    canvas.addEventListener('mouseup', updateSignature);
    canvas.addEventListener('touchend', updateSignature);
    
    return () => {
      canvas.removeEventListener('mouseup', updateSignature);
      canvas.removeEventListener('touchend', updateSignature);
    };
  }, [onSignatureChange]);

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
    if (!legalName.trim()) {
      setModalMessage('Please enter your full legal name');
      setModalType('warning');
      setModalOpen(true);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setModalMessage('Please accept both Terms of Service and Privacy Policy');
      setModalType('warning');
      setModalOpen(true);
      return;
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setModalMessage('Please provide your signature');
      setModalType('warning');
      setModalOpen(true);
      return;
    }

    setSigning(true);
    try {
      const signatureDataUrl = signatureRef.current.toDataURL('image/png');
      await onSign(legalName.trim(), signatureDataUrl);
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Failed to sign contract. Please try again.');
      setModalType('error');
      setModalOpen(true);
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <div className="space-y-4 w-full max-w-2xl">
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
                className: 'w-full border border-white/20 rounded-lg',
                style: { background: '#1a1a1a' },
              }}
              backgroundColor="#1a1a1a"
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
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-900/80 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={termsAlreadyAccepted}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A] disabled:opacity-50"
            />
            <div>
              <span 
                className={`font-medium ${termsAlreadyAccepted ? 'text-neutral-400' : 'text-white'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                I agree to the Terms of Service
                {termsAlreadyAccepted && ' (Already accepted)'}
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
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-900/80 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              disabled={termsAlreadyAccepted}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A] disabled:opacity-50"
            />
            <div>
              <span 
                className={`font-medium ${termsAlreadyAccepted ? 'text-neutral-400' : 'text-white'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                I agree to the Privacy Policy
                {termsAlreadyAccepted && ' (Already accepted)'}
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

      <OnboardingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
        type={modalType}
      />
    </>
  );
}
