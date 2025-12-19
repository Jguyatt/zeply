'use client';

import { useState } from 'react';
import TermsAcceptanceCheckboxes from './TermsAcceptanceCheckboxes';
import OnboardingCompleteButton from './OnboardingCompleteButton';

interface TermsOnboardingWrapperProps {
  nodeId: string;
  clerkOrgId: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export default function TermsOnboardingWrapper({
  nodeId,
  clerkOrgId,
  termsUrl,
  privacyUrl,
}: TermsOnboardingWrapperProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  return (
    <>
      <div className="mt-6 mb-4 flex justify-center">
        <TermsAcceptanceCheckboxes
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
          onAcceptanceChange={(terms, privacy) => {
            setTermsAccepted(terms);
            setPrivacyAccepted(privacy);
          }}
        />
      </div>
      <div className="mt-4 mb-6 flex justify-center">
        <OnboardingCompleteButton
          nodeId={nodeId}
          clerkOrgId={clerkOrgId}
          termsAccepted={termsAccepted}
          privacyAccepted={privacyAccepted}
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
        />
      </div>
    </>
  );
}
