'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SignUpButton } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/app/hooks/useScrollAnimation';

export default function BottomCTA() {
  const router = useRouter();
  const [sectionRef, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    // CHANGED: Main section is now relative and contains the background effects directly.
    // No more "box" container.
    <section 
      ref={sectionRef}
      className={`relative py-40 md:py-48 bg-black overflow-hidden font-sans transition-all duration-1000 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
    >

      {/* === INTERNAL CSS FOR ANIMATION === */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate; /* Slower, smoother movement */
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* === BACKGROUND EFFECTS (Now span the whole section) === */}
      <div className="absolute inset-0 pointer-events-none">

        {/* 1. The Grid Pattern (Subtle) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] z-0" />

        {/* 2. The Moving Blobs (RECOLORED: No Pink/Purple) */}
        <div className="absolute inset-0 z-0 opacity-60">
           {/* Blob 1: Primary Teal (Top Left) */}
           <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-[#D6B36A]/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />

           {/* Blob 2: Deep Cyan/Blue (Top Right - Was Purple) */}
           <div className="absolute top-0 -right-1/4 w-[600px] h-[600px] bg-cyan-800/40 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />

           {/* Blob 3: Brighter Teal (Bottom Center - Was Pink) */}
           <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#D6B36A]/80/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
      </div>

        {/* 3. The Decorative Squiggle (Now larger and freer) */}
        <svg className="absolute top-10 right-0 h-[120%] w-2/3 opacity-10 z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
           <path d="M0 100 C 30 50 70 50 100 0" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* === CONTENT (Centered and contained) === */}
      <div className={`relative z-10 max-w-4xl mx-auto text-center px-6 space-y-8 transition-all duration-1000 delay-200 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}>

        <h2 className="text-4xl md:text-6xl font-serif text-white tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
          Start managing campaigns <span className="italic text-[#D6B36A]">today.</span>
        </h2>

        <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          The inventory system for agency software costs. Transform software from "Overhead" (a vague cost you eat) into "COGS" (Cost of Goods Sold, which belongs to the client). Know exactly which clients are making money.
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-1000 delay-400 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}>
          {/* Primary Button */}
          <SignUpButton
            mode="modal"
            fallbackRedirectUrl="/"
          >
            <button className="h-14 px-8 rounded-full bg-[#D6B36A] text-black font-bold text-lg hover:bg-[#D6B36A]/80 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(214,179,106,0.4)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get started for free
              <ArrowRight className="h-5 w-5" />
            </button>
          </SignUpButton>

          {/* Secondary Button */}
          <button
            onClick={() => router.push('/pricing')}
            className="h-14 px-8 rounded-full bg-white text-black font-bold text-lg hover:bg-neutral-200 hover:scale-105 transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            View pricing
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          No credit card required · Cancel anytime
        </p>

      </div>
    </section>
  );
}
