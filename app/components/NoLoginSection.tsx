'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, X, AlertTriangle, TrendingDown, FileWarning, ArrowRight, DollarSign, Mail, FileText, Paperclip, Send, Users, Shield, Copy, Plus, Target, Globe, Search, Zap, Phone, Sparkles } from 'lucide-react';

export default function NoLoginSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<SVGSVGElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [underlineDrawn, setUnderlineDrawn] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refs and state for process steps
  const headingRef = useRef<HTMLDivElement>(null);
  const row0Ref = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const row4Ref = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [row0Visible, setRow0Visible] = useState(true); // Make Step 1 visible by default
  const [row1Visible, setRow1Visible] = useState(false);
  const [row2Visible, setRow2Visible] = useState(false);
  const [row3Visible, setRow3Visible] = useState(false);
  const [row4Visible, setRow4Visible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Trigger underline animation
            if (!underlineDrawn && underlineRef.current) {
              setTimeout(() => {
                if (underlineRef.current) {
                  underlineRef.current.style.width = '100%';
                  const path = underlineRef.current.querySelector('path');
                  if (path) {
                    path.style.strokeDashoffset = '0';
                  }
                  setUnderlineDrawn(true);
                }
              }, 300);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [underlineDrawn]);

  // Scroll animations for process steps
  useEffect(() => {
    const observers: Array<{ observer: IntersectionObserver; element: Element }> = [];
    const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

    // Heading observer
    if (headingRef.current) {
      const headingObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeadingVisible(true);
          }
        });
      }, options);
      headingObserver.observe(headingRef.current);
      observers.push({ observer: headingObserver, element: headingRef.current });
    }

    // Row observers
    const rowRefs = [
      { ref: row0Ref, setter: setRow0Visible },
      { ref: row1Ref, setter: setRow1Visible },
      { ref: row2Ref, setter: setRow2Visible },
      { ref: row3Ref, setter: setRow3Visible },
      { ref: row4Ref, setter: setRow4Visible },
    ];

    rowRefs.forEach(({ ref, setter }) => {
      if (ref.current) {
        const rowObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setter(true);
            }
          });
        }, options);
        rowObserver.observe(ref.current);
        observers.push({ observer: rowObserver, element: ref.current });
      }
    });

    return () => {
      observers.forEach(({ observer, element }) => {
        observer.unobserve(element);
      });
    };
  }, []);

  return (
    <>
    <section
      ref={sectionRef as any}
      className={`relative py-40 lg:py-56 px-6 lg:px-12 bg-neutral-900 transition-all duration-1000 mt-32 lg:mt-48 rounded-[64px] overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{
        borderRadius: '64px',
        boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.15), 0 -10px 30px rgba(0, 0, 0, 0.1), 0 20px 60px rgba(0, 0, 0, 0.1)',
        zIndex: 10
      }}
    >
      {/* Background base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" style={{ borderRadius: 'inherit' }} />

      {/* Subtle ambient glow for light background */}
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none overflow-hidden" style={{ borderRadius: 'inherit' }}>
        <div className="absolute top-1/4 right-[-10%] w-[800px] h-[800px] bg-[#D6B36A]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-[-5%] w-[600px] h-[600px] bg-emerald-100/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Deliverable Analysis Card - Left Side - Email Interface Style */}
          <div className="order-2 lg:order-1 flex justify-center">
            <style>{`
              @keyframes float {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-10px);
                }
              }
              .floating-card {
                animation: float 6s ease-in-out infinite;
              }
              .floating-card:hover {
                animation-play-state: paused;
                transform: translateY(-5px) scale(1.02);
              }
            `}</style>
            <div className="w-full max-w-lg lg:max-w-xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden floating-card transition-all duration-300"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 60px rgba(20, 184, 166, 0.1)'
              }}>
              {/* Email Header Bar */}
              <div className="bg-zinc-800 px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="30" y="30" width="40" height="40" rx="4" fill="#D6B36A" opacity="0.9" />
                  </svg>
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Elvance</span>
                </div>
                <span className="px-3 py-1.5 bg-[#D6B36A] text-black text-sm font-semibold rounded" style={{ fontFamily: "'Inter', sans-serif" }}>
                  New Deliverable
                </span>
              </div>

              {/* Email Content */}
              <div className="p-6 lg:p-8 space-y-5">
                {/* Deliverable Analysis Complete Header */}
                <div className="flex items-start gap-4 mb-5">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#D6B36A" opacity="0.2" />
                    <rect x="30" y="30" width="40" height="40" rx="4" fill="#D6B36A" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-white text-lg font-bold mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Weekly Update Ready
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Q4 Performance Summary - Acme Corp
                    </p>
                  </div>
                </div>

                {/* Key Message */}
                <div className="bg-[#D6B36A]/10 border-l-4 border-[#D6B36A] p-4 rounded-lg">
                  <p className="text-[#D6B36A] text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Your weekly client update is ready. Includes campaign performance, deliverable status, and KPI updates.
                  </p>
                </div>

                {/* Deliverable Details */}
                <div>
                  <h4 className="text-white text-base font-semibold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Included Updates
                  </h4>
                  <div className="space-y-4">
                    {/* Asset 1 */}
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-[#D6B36A]/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white text-base font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Campaign Performance</span>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Meta Ads: 47 leads, $2,400 spend, $51 CPL. Google Ads: 23 leads, $1,200 spend, $52 CPL. Overall ROAS: 3.2x.
                      </p>
                      <a href="#" className="text-[#D6B36A] text-sm font-medium hover:text-[#D6B36A]/80 transition-colors inline-flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        View metrics →
                      </a>
                    </div>

                    {/* Asset 2 */}
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-[#D6B36A]/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-white text-base font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Deliverable Status</span>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                        3 deliverables completed this week. 2 new blog posts published. Landing page redesign approved and in development.
                      </p>
                      <a href="#" className="text-[#D6B36A] text-sm font-medium hover:text-[#D6B36A]/80 transition-colors inline-flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        View deliverables →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Deliverable Overview Section */}
                <div className="pt-4 border-t border-zinc-800">
                  <button className="w-full text-left text-zinc-400 text-sm font-medium hover:text-white transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                    View Full Details ↓
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content - Right Side */}
          <div className="order-1 lg:order-2">
            <h3
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6"
              style={{ fontFamily: "'canela-text', serif", fontWeight: 400 }}
            >
              Your performance{' '}
              <span className="relative inline-block">
                dashboard
                <svg
                  ref={underlineRef}
                  className="absolute bottom-0 left-0 pointer-events-none"
                  style={{
                    width: '0%',
                    height: '12px',
                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(2px)',
                    overflow: 'visible'
                  }}
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 6 Q 25 4, 50 6 T 100 5.5 Q 125 7, 150 6 T 200 6"
                    stroke="#14b8a6"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(214, 179, 106, 0.4))',
                      strokeDasharray: '200',
                      strokeDashoffset: '200',
                      transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 0.95
                    }}
                  />
                </svg>
              </span>
              {' '}at a glance.
            </h3>
            <div className="space-y-6">
              <p className="text-xl sm:text-2xl text-neutral-300 font-light leading-relaxed" style={{ fontFamily: "'canela-text', serif" }}>
                See everything that matters: campaign performance, completed work, and progress, all in one place.
              </p>

              <div className="pl-6 border-l-2 border-[#D6B36A]/30 space-y-4">
                <p className="text-lg text-neutral-400 font-light leading-relaxed" style={{ fontFamily: "'canela-text', serif" }}>
                  Track <span className="font-medium text-white">real-time campaign performance</span>, <span className="font-medium text-white">completed deliverables</span>, <span className="font-medium text-white">weekly progress updates</span>, and <span className="font-medium text-white">performance reports</span>, all in one beautiful, easy-to-understand view.
                </p>
                <p className="text-lg text-neutral-400 font-light leading-relaxed" style={{ fontFamily: "'canela-text', serif" }}>
                  Everything updates automatically. No manual reports, no spreadsheets, no confusion. See your <span className="font-medium text-[#D6B36A]">KPIs</span>, <span className="font-medium text-[#D6B36A]">deliverables</span>, and <span className="font-medium text-[#D6B36A]">progress</span> in under 10 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* THE PROCESS Section - Now with beige/green pattern */}
    <section className="relative py-40 lg:py-56 px-0 bg-[#0a0a0a] w-full overflow-x-hidden">
      {/* Vertical lines - one inch from left and right */}
      <div className="absolute left-[1in] top-0 bottom-0 w-px bg-white/10 z-0" />
      <div className="absolute right-[1in] top-0 bottom-0 w-px bg-white/10 z-0" />

      <div className="relative z-10 w-full">
        {/* Section Heading */}
        <div
          ref={headingRef}
          className={`mb-32 lg:mb-48 px-8 lg:px-16 xl:px-24 text-center transition-all duration-1000 ease-out ${
            headingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h3
            className="text-4xl sm:text-5xl md:text-6xl font-light text-white leading-tight mb-6"
            style={{ fontFamily: "'canela-text', serif", fontWeight: 400 }}
          >
            How Elvance automizes your workflow
          </h3>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto" style={{ fontFamily: "'canela-text', serif" }}>
            From team collaboration to automated analysis, see how Elvance streamlines every step of your deliverable management process.
          </p>
        </div>

        <div className="flex flex-col gap-16 lg:gap-24 w-full">
          {/* ROW 0: Kickoff Call - New Step 1 */}
          <div
            ref={row0Ref}
            className={`relative py-24 px-6 overflow-hidden bg-black transition-all duration-1000 ease-out ${
              row0Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* LEFT COLUMN: The Visual (Kickoff Call/Service Discovery) */}
              <div className="relative order-1 group perspective-1000">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D6B36A]/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                {/* THE CARD */}
                <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.01]">

                  {/* Header */}
                  <div className="border-b border-white/5 p-5 flex justify-between items-center bg-gradient-to-r from-neutral-950/50 to-neutral-900/30 backdrop-blur-sm">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2.5 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <div className="h-8 w-8 rounded-lg bg-[#D6B36A]/10 border border-[#D6B36A]/20 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-[#D6B36A]" />
                        </div>
                        Kickoff Call Scheduled
                      </h3>
                      <p className="text-neutral-400 text-xs mt-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Discovery & Strategy Session</p>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 space-y-4 bg-neutral-950/30">
                    {/* Call Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-neutral-800/60 to-neutral-800/30 border border-[#D6B36A]/20">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D6B36A] to-[#D6B36A]/80 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Strategy Call</div>
                          <div className="text-xs text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>60 minutes • Video call</div>
                        </div>
                      </div>

                      {/* Discovery Points */}
                      <div className="space-y-2 pt-2">
                        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>We'll Discuss</div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-[#D6B36A]/10 border border-[#D6B36A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-[#D6B36A]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Your business goals & challenges</div>
                              <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Understanding what you need to achieve</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-[#D6B36A]/10 border border-[#D6B36A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-[#D6B36A]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Current marketing operations</div>
                              <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>What's working and what's not</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-[#D6B36A]/10 border border-[#D6B36A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-[#D6B36A]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Custom AI-powered solutions</div>
                              <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Tailored systems for your needs</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-3 border-t border-white/5">
                        <button className="w-full bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <Phone className="h-4 w-4" />
                          Book Your Call
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Text Content */}
              <div className="text-left space-y-8 order-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-[#D6B36A]"></div>
                    <span className="text-[#D6B36A] font-mono text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>01. Book a Kickoff Call</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight" style={{ fontFamily: "'canela-text', serif" }}>
                    We understand your pain points. Then we build custom solutions.
                  </h2>
                </div>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Every business is unique. That's why we start with a discovery call to understand your specific challenges, goals, and current operations.
                </p>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  We then design and implement custom AI-powered, human-led systems tailored to fit your exact needs. No one-size-fits-all solutions—just what works for you.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Phone className="h-4 w-4 text-[#D6B36A]" />
                    <span>60-minute strategy & discovery session</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Sparkles className="h-4 w-4 text-[#D6B36A]" />
                    <span>Custom AI-powered systems designed for you</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Users className="h-4 w-4 text-[#D6B36A]" />
                    <span>Human-led implementation and support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 1: Track Your Work - Now Step 2 */}
          <div
            ref={row1Ref}
            className={`relative py-24 px-6 overflow-hidden bg-black transition-all duration-1000 ease-out ${
              row1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* LEFT COLUMN: Text Content */}
              <div className="text-left space-y-8 order-2 lg:order-1">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-[#D6B36A]"></div>
                    <span className="text-[#D6B36A] font-mono text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>02. Track Your Work</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight" style={{ fontFamily: "'canela-text', serif" }}>
                    See everything being worked on. In real-time.
                  </h2>
            </div>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Your dashboard shows every deliverable in progress—from ad campaigns to landing pages to SEO audits. See status, progress percentage, and due dates at a glance.
                </p>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Everything updates automatically as work progresses. No need to ask for status updates or check emails. Your dashboard always shows the latest progress.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <FileText className="h-4 w-4 text-[#D6B36A]" />
                    <span>See all deliverables in one place</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Zap className="h-4 w-4 text-[#D6B36A]" />
                    <span>Real-time progress updates</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: The Visual (Deliverable Workflow) */}
              <div className="relative order-1 lg:order-2 group perspective-1000">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D6B36A]/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                {/* THE CARD */}
                <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.01]">

                  {/* Header */}
                  <div className="border-b border-white/5 p-5 flex justify-between items-center bg-gradient-to-r from-neutral-950/50 to-neutral-900/30 backdrop-blur-sm">
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2.5 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <div className="h-8 w-8 rounded-lg bg-[#D6B36A]/10 border border-[#D6B36A]/20 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#D6B36A]" />
                        </div>
                        Your Deliverables
                      </h3>
                      <p className="text-neutral-400 text-xs mt-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>3 active projects</p>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 space-y-3 bg-neutral-950/30">

                    {/* Deliverable 1 */}
                    <div className="rounded-xl bg-gradient-to-r from-neutral-800/60 to-neutral-800/30 border border-[#D6B36A]/20 hover:border-[#D6B36A]/30 transition-all duration-200 group/item cursor-pointer hover:shadow-lg hover:shadow-[#D6B36A]/5 overflow-hidden">
                      <div className="p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-3.5 w-3.5 text-[#D6B36A]" />
                              <span className="text-white text-sm font-semibold truncate" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Ad Campaign</span>
                            </div>
                            <div className="text-neutral-400 text-xs truncate mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Meta Ads Campaign</div>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-[#D6B36A]/15 border border-[#D6B36A]/30 text-[9px] text-[#D6B36A]/80 font-bold tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                            IN REVIEW
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
                          <div className="h-full w-[75%] bg-gradient-to-r from-[#D6B36A]/60 to-[#D6B36A] rounded-full transition-all duration-500"></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <span>75% complete</span>
                          <span>Due Dec 20</span>
                        </div>
                      </div>
                    </div>

                    {/* Deliverable 2 */}
                    <div className="rounded-xl bg-gradient-to-r from-neutral-800/40 to-neutral-800/20 border border-white/5 hover:border-white/10 transition-all duration-200 group/item cursor-pointer hover:shadow-md overflow-hidden">
                      <div className="p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="h-3.5 w-3.5 text-blue-400" />
                              <span className="text-white text-sm font-semibold truncate" style={{ fontFamily: "'Inter', sans-serif" }}>Landing Page Redesign</span>
                            </div>
                            <div className="text-neutral-400 text-xs truncate mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Landing Page Project</div>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[9px] text-blue-400 font-bold tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                            IN PROGRESS
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
                          <div className="h-full w-[45%] bg-gradient-to-r from-blue-500/60 to-blue-500 rounded-full transition-all duration-500"></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <span>45% complete</span>
                          <span>Due Dec 28</span>
                        </div>
                      </div>
                    </div>

                    {/* Deliverable 3 */}
                    <div className="rounded-xl bg-gradient-to-r from-neutral-800/40 to-neutral-800/20 border border-white/5 hover:border-white/10 transition-all duration-200 group/item cursor-pointer hover:shadow-md overflow-hidden">
                      <div className="p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Search className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-white text-sm font-semibold truncate" style={{ fontFamily: "'Inter', sans-serif" }}>SEO Content Audit</span>
                            </div>
                            <div className="text-neutral-400 text-xs truncate mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>SEO Content Strategy</div>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] text-emerald-400 font-bold tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                            PLANNED
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
                          <div className="h-full w-[10%] bg-gradient-to-r from-emerald-500/60 to-emerald-500 rounded-full transition-all duration-500"></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <span>10% complete</span>
                          <span>Due Jan 5</span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-3"></div>

                    {/* Last Updated Indicator */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 bg-neutral-950 border border-emerald-500/20 rounded-xl p-2.5">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-emerald-400 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Updated automatically</div>
                          <div className="text-[10px] text-neutral-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Last updated 2 minutes ago</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Forward - New Design */}
          <div
            ref={row2Ref}
            className={`relative py-24 px-6 overflow-hidden bg-black transition-all duration-1000 ease-out ${
              row2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* LEFT COLUMN: The Visual (Dark Mode Email Client) */}
              <div className="relative order-1 group perspective-1000">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D6B36A]/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                {/* THE CARD */}
                <div className="relative w-full max-w-md mx-auto bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-1">

                  {/* Email Header */}
                  <div className="bg-neutral-950/80 border-b border-white/5 p-4 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-[#D6B36A]/20 border border-[#D6B36A]/50"></div>
                      <div className="text-xs text-neutral-500 font-mono" style={{ fontFamily: "'Inter', monospace" }}>Weekly Update</div>
                    </div>
                    <div className="text-xs text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>Dec 18, 2024</div>
                </div>

                  {/* Email Body Area */}
                  <div className="p-6 space-y-4">

                    {/* Sender Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D6B36A] to-[#D6B36A]/80 flex items-center justify-center text-white font-bold border border-[#D6B36A]/30" style={{ fontFamily: "'Inter', sans-serif" }}>E</div>
                        <div>
                          <div className="text-white text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Elvance</div>
                          <div className="text-neutral-500 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>Your weekly update</div>
                        </div>
                      </div>
                    </div>

                    {/* Email Content */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Week of Dec 11 - Dec 18</h3>
                      
                      {/* Completed Section */}
                      <div className="space-y-2">
                        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Completed This Week</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Ad Campaign - Approved</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-white" style={{ fontFamily: "'Inter', sans-serif" }}>2 Blog Posts Published</span>
                          </div>
                        </div>
                      </div>

                      {/* In Progress Section */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>In Progress</div>
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-neutral-800/50 border border-white/5">
                            <div className="text-sm text-white mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Landing Page Redesign</div>
                            <div className="h-1 bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full w-[45%] bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="text-xs text-neutral-500 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>45% complete</div>
                          </div>
                        </div>
                      </div>

                      {/* View Dashboard Link */}
                      <div className="pt-2">
                        <a href="#" className="inline-flex items-center gap-2 text-[#D6B36A] text-sm font-medium hover:text-[#D6B36A]/80 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                          View full dashboard →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Text Content */}
              <div className="text-left space-y-8 order-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-[#D6B36A]"></div>
                    <span className="text-[#D6B36A] font-mono text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>03. Weekly Updates</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight" style={{ fontFamily: "'canela-text', serif" }}>
                    Get weekly progress reports. Automatically.
                  </h2>
                </div>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Every week, you receive a summary of what was completed, what's in progress, and what's coming next. No need to schedule status calls or dig through emails.
                </p>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  See completed deliverables, new work started, and progress on ongoing projects. Everything is organized and easy to understand at a glance.
                </p>
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <Mail className="h-4 w-4" /> Delivered to your inbox weekly
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Analysis - New Design */}
          <div
            ref={row3Ref}
            className={`relative py-24 px-6 overflow-hidden bg-black transition-all duration-1000 ease-out ${
              row3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Background Grid Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

              {/* LEFT COLUMN: Text Content */}
              <div className="text-left space-y-8 order-2 lg:order-1">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-[#D6B36A]"></div>
                    <span className="text-[#D6B36A] font-mono text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>04. Performance Metrics</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight" style={{ fontFamily: "'canela-text', serif" }}>
                    See your campaign performance. In real-time.
                  </h2>
                </div>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Track key metrics like leads, spend, cost per lead, and ROAS for all your campaigns. See how your marketing investments are performing.
                </p>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Your dashboard shows real-time KPIs updated automatically. No need to wait for monthly reports or dig through analytics platforms.
                </p>
                {/* Action Link */}
                <div className="pt-4">
                  <a href="#" className="inline-flex items-center gap-2 text-[#D6B36A] hover:text-[#D6B36A]/80 transition-colors group font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    View your performance dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: The Mini Bento Grid */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg mx-auto lg:mx-0 order-1 lg:order-2">
                 {/* Card 1: Wide Campaign Performance */}
                 <div className="col-span-2 relative overflow-hidden rounded-xl border border-white/5 bg-neutral-900/80 backdrop-blur-sm p-8">
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-8">
                       <h4 className="text-neutral-400 text-xs font-medium uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Campaign Performance</h4>
                       <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded">
                         <span className="text-emerald-400 text-xs font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>+15%</span>
                       </div>
                     </div>
                     <div className="space-y-6">
                       {/* Row 1: Leads */}
                       <div>
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-sm text-neutral-400 font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>Leads Generated</span>
                           <span className="text-xl font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>47</span>
                         </div>
                         <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                           <div className="h-full w-[78%] bg-gradient-to-r from-emerald-500/60 to-emerald-500 rounded-full"></div>
                         </div>
                       </div>
                       {/* Row 2: ROAS */}
                       <div>
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-sm text-neutral-400 font-normal" style={{ fontFamily: "'Inter', sans-serif" }}>ROAS</span>
                           <span className="text-xl font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>3.2x</span>
                         </div>
                         <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                           <div className="h-full w-[64%] bg-gradient-to-r from-[#D6B36A]/60 to-[#D6B36A] rounded-full"></div>
                         </div>
                       </div>
                     </div>
                     <div className="mt-8 pt-6 border-t border-white/5">
                       <p className="text-sm text-neutral-400 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                         Campaign is performing <span className="text-white font-medium">15% above target</span> this month with strong lead quality.
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Card 2: Square CPL Card */}
                 <div className="relative overflow-hidden rounded-xl border border-white/5 bg-neutral-900/80 backdrop-blur-sm p-6 flex flex-col">
                   <div className="relative z-10 h-full flex flex-col">
                     <div className="mb-5">
                       <h4 className="text-white font-medium text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Cost Per Lead</h4>
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                       <div className="text-4xl font-semibold text-white mb-3 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>$51</div>
                       <p className="text-xs text-neutral-500 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Average CPL</p>
                     </div>
                     <p className="text-xs text-neutral-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>Down from $58 last month</p>
                   </div>
               </div>

                 {/* Card 3: Square Spend Card */}
                 <div className="relative overflow-hidden rounded-xl border border-white/5 bg-neutral-900/80 backdrop-blur-sm p-6 flex flex-col">
                   <div className="relative z-10 h-full flex flex-col">
                     <div className="mb-5">
                       <h4 className="text-white font-medium text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Ad Spend</h4>
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                       <div className="text-4xl font-semibold text-white mb-3 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>$2,400</div>
                       <p className="text-xs text-neutral-500 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>This Month</p>
                     </div>
                     <p className="text-xs text-neutral-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>On track with budget</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* ROW 4: Alerts - New Design */}
          <div
            ref={row4Ref}
            className={`relative py-24 px-6 overflow-hidden bg-black transition-all duration-1000 ease-out ${
              row4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* LEFT COLUMN: The Visual (The Dark Mode Email) */}
              <div className="relative order-1 perspective-1000 group">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D6B36A]/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

                {/* The Email Card */}
                <div className="relative w-full max-w-md mx-auto bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.02] hover:-rotate-1">

                  {/* Report Header */}
                  <div className="bg-neutral-950/80 border-b border-white/5 p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#D6B36A]/10 border border-[#D6B36A]/20 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-[#D6B36A]" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Performance Report</div>
                        <div className="text-neutral-500 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>Dec 2024</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded">
                      <span className="text-emerald-400 text-xs font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Ready</span>
                    </div>
                  </div>

                  {/* Report Body */}
                  <div className="p-6 space-y-5 bg-neutral-900/50">
                    {/* Executive Summary */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Executive Summary</h4>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-neutral-800/50 border border-white/5">
                          <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Total Leads</div>
                          <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>127</div>
                          <div className="text-xs text-emerald-400 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>↑ 23% vs last quarter</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-neutral-800/50 border border-white/5">
                            <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>ROAS</div>
                            <div className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>3.2x</div>
                          </div>
                          <div className="p-2 rounded bg-neutral-800/50 border border-white/5">
                            <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Avg CPL</div>
                            <div className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>$51</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deliverables Completed */}
                    <div className="pt-3 border-t border-white/5">
                      <h4 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Deliverables Completed</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span>Q4 Ad Campaign</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span>Landing Page Redesign</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                          <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span>12 Blog Posts</span>
                        </div>
                      </div>
                    </div>

                    {/* View Report Link */}
                    <div className="pt-2">
                      <a href="#" className="inline-flex items-center gap-2 text-[#D6B36A] text-sm font-medium hover:text-[#D6B36A]/80 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                        View full report →
                      </a>
                    </div>
                  </div>
                </div>
                </div>

              {/* RIGHT COLUMN: The Text */}
              <div className="text-left space-y-6 order-2">
                <div className="flex items-center gap-3">
                   <div className="h-px w-8 bg-[#D6B36A]"></div>
                   <span className="text-[#D6B36A] font-mono text-sm tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>05. Reports & Insights</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight" style={{ fontFamily: "'canela-text', serif" }}>
                  Get comprehensive reports. <br/>
                  Without asking.
                </h2>

                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Access detailed performance reports, campaign insights, and deliverable summaries whenever you need them. Everything is organized and easy to understand.
                </p>
                <p className="text-lg text-neutral-400 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Reports are automatically generated and updated. No need to request them or wait for your agency to compile data.
                </p>

                {/* Feature List */}
                <div className="pt-4 space-y-3">
                  {['Performance reports', 'Campaign insights', 'Deliverable summaries'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-neutral-300" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <div className="h-5 w-5 rounded-full bg-[#D6B36A]/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#D6B36A]" />
                      </div>
                      {item}
                    </div>
                  ))}
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
