'use client';

import { SignUpButton } from '@clerk/nextjs';
import { TrendingUp, DollarSign, Target, CheckCircle2, FileText, MessageSquare } from 'lucide-react';

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-24 lg:grid-cols-2 border-b border-white/5">
      {/* Left Content */}
      <div className="max-w-xl">
        <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Grow Your Business
          <br />
          with <span className="italic text-white/90">Strategic</span>
          <br />
          <span className="italic text-white/90">Marketing</span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-white/60">
          We help brands reach their full potential through data-driven marketing strategies, creative campaigns, and measurable results that drive growth.
        </p>

        <div className="mt-8">
          <SignUpButton mode="modal" fallbackRedirectUrl="/">
            <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/10 transition-all">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </div>

      {/* Right Content - Phone Mockup with Constraints */}
      <div className="relative mx-auto w-full max-w-[420px]">
        {/* Background Depth Effects */}
        <div className="absolute -inset-8 rounded-[32px] bg-white/5 blur-2xl"></div>
        
        <div className="relative" style={{ perspective: '1400px', perspectiveOrigin: 'center center' }}>
          {/* Phone Frame - Ultra Realistic with Proper Sizing */}
          <div 
            className="relative w-full"
            style={{
              transform: 'rotateY(-18deg) rotateX(6deg) translateZ(0)',
              transformStyle: 'preserve-3d',
              aspectRatio: '9/16',
            }}
          >
                {/* Outer Frame Layer - Side panels for thickness */}
                <div 
                  className="absolute -inset-1 bg-gradient-to-b from-gray-950 via-black to-gray-950 rounded-[4rem]"
                  style={{ 
                    transform: 'translateZ(-15px)',
                    boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.8)',
                  }}
                ></div>
                
                {/* Side Thickness Panels */}
                <div 
                  className="absolute -left-2 top-8 bottom-8 w-3 bg-gradient-to-r from-gray-900/80 to-gray-950/80 rounded-l-2xl"
                  style={{ 
                    transform: 'translateZ(-10px) rotateY(-5deg)',
                    boxShadow: 'inset 2px 0 8px rgba(0, 0, 0, 0.6)',
                  }}
                ></div>
                <div 
                  className="absolute -right-2 top-8 bottom-8 w-3 bg-gradient-to-l from-gray-900/80 to-gray-950/80 rounded-r-2xl"
                  style={{ 
                    transform: 'translateZ(-10px) rotateY(5deg)',
                    boxShadow: 'inset -2px 0 8px rgba(0, 0, 0, 0.6)',
                  }}
                ></div>
                
                {/* Top and Bottom Thickness */}
                <div 
                  className="absolute -top-2 left-8 right-8 h-3 bg-gradient-to-b from-gray-900/80 to-gray-950/80 rounded-t-2xl"
                  style={{ 
                    transform: 'translateZ(-10px) rotateX(5deg)',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
                  }}
                ></div>
                <div 
                  className="absolute -bottom-2 left-8 right-8 h-3 bg-gradient-to-t from-gray-900/80 to-gray-950/80 rounded-b-2xl"
                  style={{ 
                    transform: 'translateZ(-10px) rotateX(-5deg)',
                    boxShadow: 'inset 0 -2px 8px rgba(0, 0, 0, 0.6)',
                  }}
                ></div>

                {/* Main Phone Bezel - Modern iPhone Style */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950 rounded-[3.8rem] p-[1.5rem]" 
                  style={{ 
                    boxShadow: `
                      inset 0 0 100px rgba(0, 0, 0, 0.95),
                      inset 0 0.5px 1px rgba(255, 255, 255, 0.015),
                      0 50px 100px rgba(0, 0, 0, 0.7),
                      0 25px 50px rgba(0, 0, 0, 0.6)
                    `,
                    transform: 'translateZ(20px)',
                  }}
                >
                  {/* Dynamic Island - Modern iPhone Style */}
                  <div 
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex items-center justify-center"
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Camera & Sensors */}
                    <div className="flex items-center gap-1.5 px-2">
                      <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                      <div className="w-4 h-4 rounded-full bg-gray-900 border border-gray-800/50"></div>
                    </div>
                  </div>
                  
                  {/* Screen with Professional Glass Effect */}
                  <div 
                    className="w-full h-full bg-charcoal rounded-[3rem] overflow-hidden relative" 
                    style={{ 
                      boxShadow: `
                        inset 0 0 120px rgba(0, 0, 0, 0.95),
                        inset 0 1px 2px rgba(255, 255, 255, 0.03),
                        inset 0 -30px 60px rgba(255, 255, 255, 0.008)
                      `,
                      background: 'linear-gradient(to bottom, #1a1a1a 0%, #0f0f0f 50%, #0a0a0a 100%)',
                    }}
                  >
                    {/* Screen Reflection Overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)',
                        mixBlendMode: 'overlay',
                      }}
                    ></div>
                    {/* Status Bar - Modern iOS Style with Dynamic Island Space */}
                    <div className="h-12 flex items-center justify-between px-5 pt-2 text-[10px] text-white/85 font-semibold">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          <div className="w-4 h-2.5 border border-white/25 rounded-sm relative overflow-hidden">
                            <div className="absolute inset-0.5 w-3 h-full bg-white/75 rounded-sm"></div>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-white/75"></div>
                        </div>
                      </div>
                    </div>

                    {/* App Content - Clean Professional Dashboard */}
                    <div className="h-[calc(100%-3rem)] overflow-y-auto" style={{ background: 'linear-gradient(to bottom, #1a1a1a 0%, #0f0f0f 100%)' }}>
                      {/* Header with Live Status - Clean Design */}
                      <div className="px-5 pt-3 pb-3 glass-border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-sm"></div>
                            <span className="text-[11px] font-semibold text-white tracking-tight">elvance</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[9px] text-green-300 font-semibold tracking-wide">LIVE</span>
                          </div>
                        </div>
                      </div>

                      {/* This Month's Performance - Clean Card Design */}
                      <div className="px-5 pt-4 pb-3">
                        <div className="glass-surface rounded-xl p-4 border border-white/10 mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                            <span className="text-[9px] text-green-300 font-semibold tracking-wide uppercase">Live Tracking</span>
                          </div>
                          <div className="text-[10px] text-white/70 mb-2">This Month's Performance</div>
                          <div className="text-2xl font-bold text-white mb-1 tracking-tight">1,247 Leads</div>
                          <div className="text-[10px] text-white/70">
                            <span className="text-white font-medium">$124K</span> spent • <span className="text-accent font-medium">$198K</span> revenue
                          </div>
                        </div>
                      </div>

                      {/* Campaign Performance Cards - Clean List Design */}
                      <div className="px-5 pb-4">
                        <h4 className="text-[11px] text-white/70 uppercase tracking-wider mb-3 font-semibold">Active Campaigns</h4>
                        <div className="space-y-2">
                          <div className="glass-surface rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                                <span className="text-[10px] text-blue-300 font-bold">PPC</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-white mb-0.5">Q1 Brand Campaign</div>
                                <div className="text-[10px] text-white/70">Google Ads • 24% markup</div>
                                <div className="text-[10px] text-white/70 mt-1">892K impressions</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-[11px] font-bold text-white">$42K</div>
                                <div className="text-[9px] text-white/60">THIS MONTH</div>
                              </div>
                            </div>
                          </div>

                          <div className="glass-surface rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                                <span className="text-[10px] text-purple-300 font-bold">SEO</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-white mb-0.5">Content Strategy</div>
                                <div className="text-[10px] text-white/70">Organic • Pass-through</div>
                                <div className="text-[10px] text-white/70 mt-1">1.1M page views</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-[11px] font-bold text-white">$28K</div>
                                <div className="text-[9px] text-white/60">THIS MONTH</div>
                              </div>
                            </div>
                          </div>

                          <div className="glass-surface rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-500/30 flex-shrink-0">
                                <span className="text-[10px] text-pink-300 font-bold">SOC</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-white mb-0.5">Social Media</div>
                                <div className="text-[10px] text-white/70">Meta Ads • 15% markup</div>
                                <div className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                                  <span>▲</span> 85% of monthly cap
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-[11px] font-bold text-white">$54K</div>
                                <div className="text-[9px] text-white/60">THIS MONTH</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alert/Notification at Bottom - Clean Design */}
                      <div className="px-5 pb-6">
                        <div className="glass-surface rounded-xl p-3 border border-red-500/30">
                          <div className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-400/40">
                              <span className="text-[10px] text-red-300 font-bold">!</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-red-300 mb-2 tracking-wide uppercase">Budget Alert</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                                <div className="text-white/70">Campaign:</div>
                                <div className="text-white font-medium">Social Media</div>
                                <div className="text-white/70">Monthly Cap:</div>
                                <div className="text-white font-medium">$60K</div>
                                <div className="text-white/70">Current Spend:</div>
                                <div className="text-red-300 font-semibold">$54K</div>
                                <div className="text-white/70">Action:</div>
                                <div className="text-red-300/90 font-medium">Review required</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Home Indicator Bar */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </div>
    </section>
  );
}


