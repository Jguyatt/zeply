'use client';

import { useState } from 'react';

interface TermsAcceptanceCheckboxesProps {
  termsUrl?: string;
  privacyUrl?: string;
  onAcceptanceChange?: (termsAccepted: boolean, privacyAccepted: boolean) => void;
}

export default function TermsAcceptanceCheckboxes({ 
  termsUrl, 
  privacyUrl,
  onAcceptanceChange 
}: TermsAcceptanceCheckboxesProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    onAcceptanceChange?.(checked, privacyAccepted);
  };

  const handlePrivacyChange = (checked: boolean) => {
    setPrivacyAccepted(checked);
    onAcceptanceChange?.(termsAccepted, checked);
  };

  return (
    <div className="space-y-3 w-full max-w-2xl">
      <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-900/80 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => handleTermsChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A]"
        />
        <div className="flex-1">
          <span 
            className="text-white font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            I accept the Terms of Service
          </span>
          {termsUrl && (
            <a
              href={termsUrl}
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
          onChange={(e) => handlePrivacyChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-[#D6B36A] focus:ring-[#D6B36A]"
        />
        <div className="flex-1">
          <span 
            className="text-white font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            I accept the Privacy Policy
          </span>
          {privacyUrl && (
            <a
              href={privacyUrl}
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
  );
}
