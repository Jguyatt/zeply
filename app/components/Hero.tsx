'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SignUpButton } from '@clerk/nextjs';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const processSectionRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const [phoneRotation, setPhoneRotation] = useState(0);
  
  const [isVisible, setIsVisible] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false
  });

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && dashboardRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const dashboardRate = scrolled * 0.3;

        heroRef.current.style.transform = `translateY(${rate}px)`;
        dashboardRef.current.style.transform = `translateY(${dashboardRate}px) scale(${1 + scrolled * 0.0001})`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let ticking = false;
    const isMobile = window.innerWidth <= 768;

    const handleDisperseScroll = () => {
      if (ticking) return;

      // Throttle on mobile for better performance
      if (isMobile) {
        ticking = true;
        requestAnimationFrame(() => {
          updateDisperse();
          ticking = false;
        });
      } else {
        updateDisperse();
      }
    };

    const updateDisperse = () => {
      // Keep cards visible much longer before dispersing
      if (processSectionRef.current) {
        const rect = processSectionRef.current.getBoundingClientRect();
        const viewH = window.innerHeight || document.documentElement.clientHeight;

        // Only start dispersing when cards are well past the viewport
        const start = viewH * -0.5; // Start dispersing much later
        const end = viewH * 1.5; // Longer range for smoother effect
        const relative = Math.min(Math.max(end - (rect.top + start), 0), end);
        const progress = Math.min(Math.max(relative / end, 0), 1);

        // Much gentler fade - cards stay fully visible longer
        processSectionRef.current.style.opacity = String(1 - (progress * 0.3));
        processSectionRef.current.style.transform = `translateY(${progress * 10}px)`;

        const applySmoothDisperse = (el: HTMLDivElement | null, index: number) => {
          if (!el) return;
          const disperseProgress = Math.min(1, progress * 0.7); // Much gentler progression

          // Calculate smooth dispersal direction and distance
          let tx, ty, rot, scale, opacity;

          if (index === 0) { // Top-left: move left and up
            tx = -disperseProgress * 60;
            ty = -disperseProgress * 30;
            rot = -disperseProgress * 6;
          } else if (index === 1) { // Top-right: move right and up
            tx = disperseProgress * 60;
            ty = -disperseProgress * 30;
            rot = disperseProgress * 6;
          } else if (index === 2) { // Bottom-left: move left and down
            tx = -disperseProgress * 60;
            ty = disperseProgress * 30;
            rot = -disperseProgress * 6;
          } else { // Bottom-right: move right and down
            tx = disperseProgress * 60;
            ty = disperseProgress * 30;
            rot = disperseProgress * 6;
          }

          scale = 1 - (disperseProgress * 0.1); // Minimal scaling
          opacity = 1 - (disperseProgress * 0.2); // Stay visible much longer

          // Use transform3d for hardware acceleration (reduced on mobile)
          if (isMobile) {
            el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
          } else {
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg) scale(${scale})`;
          }
          el.style.opacity = String(opacity);

          // Only use will-change on desktop for better mobile performance
          if (!isMobile) {
            el.style.willChange = 'transform, opacity';
          }
        };

        applySmoothDisperse(step1Ref.current, 0);
        applySmoothDisperse(step2Ref.current, 1);
        applySmoothDisperse(step3Ref.current, 2);
        applySmoothDisperse(step4Ref.current, 3);
      }
    };

    window.addEventListener('scroll', handleDisperseScroll, { passive: true });
    handleDisperseScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleDisperseScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const refName = entry.target.getAttribute('data-ref');
          if (refName) {
            setIsVisible(prev => ({ ...prev, [refName]: true }));
          }
        }
      });
    }, observerOptions);

    [step1Ref, step2Ref, step3Ref, step4Ref].forEach(ref => {
      if (ref.current) {
        ref.current.setAttribute('data-ref', ref === step1Ref ? 'step1' : ref === step2Ref ? 'step2' : ref === step3Ref ? 'step3' : 'step4');
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .logo-scroll {
          animation: scroll-left 40s linear infinite;
        }

        .logo-scroll:hover {
          animation-play-state: paused;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(214, 179, 106, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(214, 179, 106, 0.5);
        }

        .depth-shadow-1 {
          filter: blur(80px);
          opacity: 0.4;
        }

        .depth-shadow-2 {
          filter: blur(120px);
          opacity: 0.3;
        }

        .depth-shadow-3 {
          filter: blur(160px);
          opacity: 0.2;
        }
      `}</style>
    <section className="relative min-h-screen flex items-center pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-[#0a0a0a]" />

      {/* Large teal/gold glow on right side where mockup will be */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[900px] h-[700px] bg-teal-500/10 rounded-full blur-[150px]" />

      <div className="container mx-auto relative z-10 max-w-7xl">
        {/* Split layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start lg:items-center">

          {/* Left side - Clean typography */}
          <div className="text-left lg:-mt-32 max-w-2xl px-4 sm:px-0">
            <h1
              className="text-6xl sm:text-7xl lg:text-8xl text-white mb-6 leading-tight tracking-tight font-light fade-in-up"
            >
              Automate the work that slows you down.
            </h1>

            <p className="text-base sm:text-lg text-white/70 mb-8 leading-tight max-w-xl fade-in-up font-normal tracking-tight" style={{ animationDelay: '0.2s' }}>
              We design and deploy AI workflows that remove manual steps across sales and ops, fast, clean, measurable.
            </p>

            {/* Single CTA */}
            <div className="fade-in-up mb-4" style={{ animationDelay: '0.3s' }}>
              <button
                className="group relative px-10 py-4 bg-[#D6B36A] text-black text-base font-semibold rounded-full transition-all duration-500 overflow-hidden border-2 border-white shadow-lg shadow-[#D6B36A]/30"
              >
                <div className="absolute inset-0 bg-white origin-center scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out"
                  style={{ clipPath: 'ellipse(150% 100% at 50% 50%)' }} />

                <span className="relative transition-colors duration-500 group-hover:text-[#D6B36A]">
                  Request an audit
                </span>
              </button>
            </div>

          </div>

          {/* Right side - Mobile App Showcase - Full Width */}
          <div ref={dashboardRef} className="relative fade-in-up w-full h-full flex items-center justify-center lg:justify-start" style={{ animationDelay: '0.3s' }}>
            {/* Premium glow effect */}
            <div className="absolute -inset-48 pointer-events-none z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] rounded-full blur-[140px] bg-gradient-to-br from-[#D6B36A]/25 to-[#D6B36A]/20 animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[450px] rounded-full blur-[100px] bg-[#D6B36A]/20 animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
            </div>

            {/* Cave-like depth effect behind phone */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Cave entrance - darkest, furthest back */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[700px] bg-black/80 rounded-full depth-shadow-3" style={{ transform: 'translate(-50%, -50%) translateY(120px) scale(1.2)' }} />
              {/* Cave middle layer */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-black/70 rounded-full depth-shadow-2" style={{ transform: 'translate(-50%, -50%) translateY(90px) scale(1.1)' }} />
              {/* Cave closer layer */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-black/60 rounded-full depth-shadow-1" style={{ transform: 'translate(-50%, -50%) translateY(60px)' }} />
              {/* Additional dark layers for cave depth */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-black/50 rounded-full blur-[100px]" style={{ transform: 'translate(-50%, -50%) translateY(40px)' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-black/40 rounded-full blur-[80px]" style={{ transform: 'translate(-50%, -50%) translateY(20px)' }} />
              {/* Subtle accent glow deep in cave */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-[#D6B36A]/8 rounded-full blur-[140px]" style={{ transform: 'translate(-50%, -50%) translateY(100px)' }} />
            </div>

            {/* Phone container - Full size */}
            <div className="relative z-10 w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0">

              {/* Enhanced gold ambient glow around phone */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {/* Bright gold glow layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/25 via-amber-400/15 to-transparent rounded-[4rem] blur-[70px] animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 bg-gradient-to-tl from-yellow-500/20 via-amber-500/10 to-transparent rounded-[4rem] blur-[90px] animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
                <div className="absolute inset-0 bg-amber-400/10 rounded-[4rem] blur-[60px]" />

                {/* Phone contact shadow with gold glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 w-[300px] h-[100px]">
                  {/* Phone contact shadow for 3D depth */}
                  <div className="absolute inset-x-[40px] bottom-0 h-[60px] bg-black/90 rounded-full blur-[40px]"
                    style={{ transform: 'scale(0.85, 0.5)' }} />
                  {/* Additional shadow layers for depth */}
                  <div className="absolute inset-x-[30px] bottom-0 h-[80px] bg-black/70 rounded-full blur-[60px]"
                    style={{ transform: 'scale(1.0, 0.6)' }} />
                  <div className="absolute inset-x-[50px] bottom-0 h-[100px] bg-black/50 rounded-full blur-[80px]"
                    style={{ transform: 'scale(1.1, 0.7)' }} />
                  {/* Primary gold ambient glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/35 via-amber-400/18 to-transparent rounded-full blur-[70px] animate-pulse" style={{ animationDuration: '3.5s' }} />
                  {/* Secondary warm glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/25 to-transparent rounded-full blur-[80px]" />
                </div>
              </div>

              {/* Rotating mobile phone mockup */}
              <div
                ref={phoneRef}
                className="relative z-10"
                style={{
                  transform: `rotateY(${phoneRotation}deg)`,
                  transition: 'transform 0.1s ease-out',
                  transformStyle: 'preserve-3d',
                  perspective: '2000px'
                }}>
              {/* iPhone frame - realistic 3D design */}
              <div className="relative"
                style={{
                     transform: 'perspective(2000px) rotateY(-8deg) rotateX(3deg) translateZ(50px)',
                     transformStyle: 'preserve-3d',
                     filter: 'drop-shadow(0 60px 120px rgba(0, 0, 0, 0.8)) drop-shadow(0 40px 80px rgba(0, 0, 0, 0.6)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4)) drop-shadow(0 10px 20px rgba(20, 184, 166, 0.2))'
                   }}>

                {/* Phone outer casing with metallic frame */}
                <div className="relative bg-gradient-to-br from-[#3a3a3c] via-[#2c2c2e] to-[#1c1c1e] rounded-[3rem] shadow-2xl"
                  style={{
                       boxShadow: `
                         0 80px 160px -30px rgba(0, 0, 0, 0.95),
                         0 50px 100px -20px rgba(0, 0, 0, 0.85),
                         0 30px 60px -20px rgba(0, 0, 0, 0.7),
                         0 15px 30px -10px rgba(214, 179, 106, 0.15),
                         inset 0 0 0 1px rgba(255, 255, 255, 0.15),
                         inset -2px 0 4px rgba(255, 255, 255, 0.1),
                         inset 2px 0 4px rgba(0, 0, 0, 0.3)
                       `,
                       transform: 'translateZ(20px)'
                     }}>

                  {/* Metallic side buttons */}
                  {/* Volume up button */}
                  <div className="absolute -left-[2px] top-[120px] w-[3px] h-[45px] bg-gradient-to-r from-[#4a4a4c] to-[#2c2c2e] rounded-l-sm"
                    style={{ boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.2), -1px 0 3px rgba(0,0,0,0.5)' }} />
                  {/* Volume down button */}
                  <div className="absolute -left-[2px] top-[180px] w-[3px] h-[45px] bg-gradient-to-r from-[#4a4a4c] to-[#2c2c2e] rounded-l-sm"
                    style={{ boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.2), -1px 0 3px rgba(0,0,0,0.5)' }} />
                  {/* Power button */}
                  <div className="absolute -right-[2px] top-[150px] w-[3px] h-[55px] bg-gradient-to-l from-[#4a4a4c] to-[#2c2c2e] rounded-r-sm"
                    style={{ boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.2), 1px 0 3px rgba(0,0,0,0.5)' }} />

                  {/* Inner bezel with glass effect */}
                  <div className="relative m-[8px] bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a] rounded-[2.7rem] p-[3px]"
                    style={{
                      boxShadow: `
                        inset 0 0 0 1px rgba(255,255,255,0.1),
                        inset 0 2px 8px rgba(0,0,0,0.6),
                        0 0 0 1px rgba(0,0,0,0.3)
                      `
                    }}>

                    {/* Dynamic Island / Notch with depth */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 flex items-center justify-center gap-3"
                        style={{
                           boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.05)',
                           transform: 'translateZ(5px)'
                         }}>
                      <div className="w-14 h-3 bg-gray-950 rounded-full" />
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-900 border border-indigo-800"
                        style={{ boxShadow: '0 0 4px rgba(99, 102, 241, 0.5)' }} />
                    </div>

                {/* Phone screen with enhanced clarity */}
                <div className="relative bg-gradient-to-b from-[#0d1117] to-[#0B0E13] rounded-[2.5rem] overflow-hidden"
                        style={{
                       aspectRatio: '9/19.5',
                       boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 20px rgba(214, 179, 106, 0.05), inset 0 4px 12px rgba(0,0,0,0.6)'
                     }}>


                  {/* Screen content - Premium Workflow Visualization */}
                  <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-black">
                    {/* App header - minimal and clean */}
                    <div className="flex items-center justify-between px-5 pt-14 pb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#D6B36A] flex items-center justify-center shadow-[0_0_12px_rgba(214,179,106,0.3)]">
                          <span className="text-black font-semibold text-[10px]">E</span>
                        </div>
                        <span className="text-white font-semibold text-xs tracking-tight">Elvance</span>
                      </div>
                    </div>

                    {/* Content - centered with premium spacing */}
                    <div className="flex-1 px-5 pb-6 flex flex-col justify-center -mt-4">
                      {/* Top Stats - 3 Numbers */}
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] p-4 mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-[20px] text-white font-semibold mb-1">47</div>
                            <div className="text-[9px] text-white/60 uppercase tracking-wider">Leads</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[20px] text-[#D6B36A] font-semibold mb-1">42</div>
                            <div className="text-[9px] text-white/60 uppercase tracking-wider">Automated</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[20px] text-white font-semibold mb-1">89%</div>
                            <div className="text-[9px] text-white/60 uppercase tracking-wider">Success</div>
                          </div>
                        </div>
                      </div>

                      {/* Workflow Card - Premium Design */}
                      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-[#0a0a0a] p-5 mb-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D6B36A]/5 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="relative space-y-4">
                          {/* Workflow Steps - Premium styling */}
                          {[
                            { num: 1, label: 'New lead' },
                            { num: 2, label: 'AI replies' },
                            { num: 3, label: 'Qualifies' },
                            { num: 4, label: 'Books' },
                            { num: 5, label: 'Updates CRM' }
                          ].map((step, idx) => (
                            <div key={step.num} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <div className="w-7 h-7 rounded-lg bg-[#D6B36A]/10 border border-[#D6B36A]/20 flex items-center justify-center shadow-[0_0_8px_rgba(214,179,106,0.15)] group-hover:bg-[#D6B36A]/15 transition-colors">
                                    <span className="text-[#D6B36A] text-[10px] font-semibold">{step.num}</span>
                                  </div>
                                  {idx < 4 && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-3 bg-gradient-to-b from-[#D6B36A]/30 to-transparent mt-0.5" />
                                  )}
                                </div>
                                <span className="text-[12px] text-white/90 font-medium tracking-tight">{step.label}</span>
                              </div>
                              {idx < 4 && (
                                <svg className="w-4 h-4 text-[#D6B36A]/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Log Preview - Premium Design */}
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] p-3.5 mb-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D6B36A] shadow-[0_0_6px_rgba(214,179,106,0.5)]"></div>
                          <span className="text-[9px] text-white/50 font-medium uppercase tracking-widest">Activity Log</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { time: '14:32:15', action: 'Lead received', status: 'default' },
                            { time: '14:32:18', action: 'AI response sent', status: 'default' },
                            { time: '14:33:42', action: 'Qualified', status: 'success' },
                            { time: '14:35:01', action: 'Calendar booked', status: 'default' },
                            { time: '14:35:03', action: 'CRM updated', status: 'default' }
                          ].map((log, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                              <span className="text-[9px] text-white/40 font-mono tabular-nums min-w-[52px]">{log.time}</span>
                              <span className={`text-[9px] font-medium ${
                                log.status === 'success' 
                                  ? 'text-[#D6B36A]' 
                                  : 'text-white/70'
                              }`}>
                                {log.action}
                                {log.status === 'success' && (
                                  <span className="ml-1.5 text-[#D6B36A]">✓</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance Metrics Card */}
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D6B36A] shadow-[0_0_6px_rgba(214,179,106,0.5)]"></div>
                          <span className="text-[9px] text-white/50 font-medium uppercase tracking-widest">Today</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/60">Leads processed</span>
                            <span className="text-[12px] text-white font-semibold">47</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/60">Automated</span>
                            <span className="text-[12px] text-[#D6B36A] font-semibold">42</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                            <span className="text-[10px] text-white/60">Success rate</span>
                            <span className="text-[12px] text-white font-semibold">89%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Home indicator - iPhone style (fixed at bottom) */}
                    <div className="flex justify-center py-2 bg-black/50 border-t border-white/[0.06] backdrop-blur-sm">
                      <div className="w-32 h-1 bg-white/20 rounded-full" />
                    </div>
                  </div>

                    {/* Realistic screen glass reflections */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-[2.5rem]"
                      style={{ transform: 'translateZ(2px)' }} />
                    <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-white/15 to-transparent blur-xl pointer-events-none rounded-tl-[2.5rem]" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-[#D6B36A]/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
                  </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </section>
    </>
  );
}
