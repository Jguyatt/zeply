'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface OnboardingWelcomeScreenProps {
  orgName: string;
  children: React.ReactNode;
}

export default function OnboardingWelcomeScreen({ orgName, children }: OnboardingWelcomeScreenProps) {
  const [hasStarted, setHasStarted] = useState(false);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D6B36A]/10 rounded-full mix-blend-screen filter blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D6B36A]/5 rounded-full mix-blend-screen filter blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl text-center">
          <h1 
            className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight tracking-tight"
            style={{ fontFamily: "'canela-text', serif" }}
          >
            Welcome to <span className="italic font-normal text-[#D6B36A]">{orgName}</span>
          </h1>
          
          <p 
            className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto mb-4 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            We're excited to work with you!
          </p>
          
          <p 
            className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Before you can access your dashboard, we'd like to share some important information with you. This will only take a few minutes.
          </p>

          <button
            onClick={() => setHasStarted(true)}
            className="px-10 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-lg font-medium rounded-lg transition-all duration-200 shadow-lg flex items-center gap-3 mx-auto"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Start Onboarding
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
