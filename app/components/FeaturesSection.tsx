'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileCheck, FileText, Mail, Target, Search, Globe, Zap, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Deliverable Management',
    description: 'Create, track, and manage deliverables across all service types. Assign to team members, track progress, and automatically sync to client portals. Clients see real-time updates as work progresses.',
    uiComponent: 'pricehike'
  },
  {
    icon: Target,
    title: 'Performance Metrics & KPIs',
    description: 'Track campaign performance, leads, spend, CPL, and ROAS for every client. Real-time KPI dashboards show exactly how marketing investments are performing.',
    uiComponent: 'cancel'
  },
  {
    icon: Globe,
    title: 'Client Portals',
    description: 'Beautiful, automatic client dashboards showing deliverables, KPIs, weekly updates, and reports. No login required. Everything updates automatically as you work.',
    uiComponent: 'riskflags'
  },
  {
    icon: Mail,
    title: 'Weekly Updates',
    description: 'Automatically generate and send weekly progress reports to clients. Show completed work, in-progress items, and upcoming deliverables. Keep clients informed without extra effort.',
    uiComponent: 'marketrates'
  },
  {
    icon: FileCheck,
    title: 'Reports & Insights',
    description: 'Generate comprehensive performance reports automatically. Show campaign results, deliverable summaries, and strategic insights. Clients can access reports anytime.',
    uiComponent: 'cancellation'
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Automate client onboarding, deliverable tracking, and status updates. Connect with CRMs, email systems, and other tools. Reduce manual work and focus on delivering results.',
    uiComponent: 'vendorlogos'
  },
];

interface CardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  index?: number;
}

const Card = ({ title, description, children, className = "", isVisible = true, cardRef, index = 0 }: CardProps) => {
  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-2xl
        border border-white/5 bg-neutral-900/30
        group hover:border-[#D6B36A]/30 transition-all duration-300
        flex flex-col justify-between
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        ${isVisible ? 'hover:-translate-y-0.5' : ''}
        ${className}
      `}
      style={{
        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms`
      }}
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D6B36A]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content Visuals (Center) */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 min-h-[240px]">
        {children}
      </div>

      {/* Text Content (Bottom) */}
      <div className="relative z-10 p-6 pt-0 border-t border-white/5">
        <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'canela-text', serif" }}>{title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{description}</p>
      </div>
    </div>
  );
};

// 1. DELIVERABLE WORKFLOW - Progress tracking visualization
const DeliverableWorkflowVisual = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(75), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-sm relative">
      {/* Deliverable Card */}
      <div className="bg-neutral-900/80 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#D6B36A]/10 border border-[#D6B36A]/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#D6B36A]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Campaign</div>
              <div className="text-xs text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>In Review</div>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-[#D6B36A]/15 border border-[#D6B36A]/30">
            <span className="text-xs text-[#D6B36A] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>75%</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#D6B36A]/60 to-[#D6B36A] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Status Icons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>Planned</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-[#D6B36A]"></div>
            <span className="text-[10px] text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. KPI DASHBOARD - Performance metrics visualization
const KPIDashboardVisual = () => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full max-h-[200px] flex flex-col justify-center px-4 gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Leads */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Leads</div>
          <div className={`text-2xl font-bold text-white transition-all duration-700 ${animated ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: "'Inter', sans-serif" }}>47</div>
          <div className="text-[10px] text-emerald-400 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>↑ 23%</div>
        </div>
        {/* ROAS */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>ROAS</div>
          <div className={`text-2xl font-bold text-white transition-all duration-700 delay-100 ${animated ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: "'Inter', sans-serif" }}>3.2x</div>
          <div className="text-[10px] text-[#D6B36A] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>On target</div>
        </div>
        {/* CPL */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>CPL</div>
          <div className={`text-2xl font-bold text-white transition-all duration-700 delay-200 ${animated ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: "'Inter', sans-serif" }}>$51</div>
          <div className="text-[10px] text-emerald-400 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>↓ 12%</div>
        </div>
        {/* Spend */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Spend</div>
          <div className={`text-2xl font-bold text-white transition-all duration-700 delay-300 ${animated ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: "'Inter', sans-serif" }}>$2.4k</div>
          <div className="text-[10px] text-neutral-400 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>This month</div>
        </div>
      </div>
    </div>
  );
};

// 3. CLIENT PORTAL - Dashboard preview
const ClientPortalVisual = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Dashboard Preview */}
      <div
        className={`w-[90%] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl transition-transform duration-500 relative z-10 ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Your Dashboard</div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neutral-800/50 rounded p-2">
              <div className="text-[10px] text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Leads</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>47</div>
            </div>
            <div className="bg-neutral-800/50 rounded p-2">
              <div className="text-[10px] text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>ROAS</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>3.2x</div>
            </div>
            <div className="bg-neutral-800/50 rounded p-2">
              <div className="text-[10px] text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>CPL</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>$51</div>
            </div>
          </div>

          {/* Deliverables List */}
          <div className="space-y-2">
            <div className="text-xs text-neutral-400 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Active Deliverables</div>
            <div className="flex items-center gap-2 p-2 bg-neutral-800/30 rounded border border-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#D6B36A]"></div>
              <div className="flex-1">
                <div className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Campaign</div>
                <div className="text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>In Review</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-neutral-800/30 rounded border border-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <div className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Landing Page</div>
                <div className="text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>In Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. WEEKLY UPDATE - Email preview
const WeeklyUpdateVisual = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full flex items-end justify-center">
      {/* Email Card */}
      <div
        className={`w-[85%] bg-neutral-900 border border-white/10 rounded-t-xl shadow-2xl transition-transform duration-500 relative z-10 ${
          mounted ? 'translate-y-0' : 'translate-y-2'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D6B36A] to-[#D6B36A]/80 flex items-center justify-center">
            <span className="text-black font-bold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>E</span>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Elvance</div>
            <div className="text-[10px] text-neutral-500" style={{ fontFamily: "'Inter', sans-serif" }}>Weekly Update</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="text-sm font-semibold text-white mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Week of Dec 11-18</div>
          
          {/* Completed Items */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Campaign - Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>2 Blog Posts Published</span>
            </div>
          </div>

          {/* Progress Item */}
          <div className="pt-2 border-t border-white/5">
            <div className="text-xs text-white mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Landing Page Redesign</div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full w-[45%] bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>45% complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. REPORTS - Report preview
const ReportsVisual = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Report Card */}
      <div
        className={`w-[85%] bg-neutral-900 border border-white/10 rounded-lg shadow-2xl transition-transform duration-500 relative z-10 ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D6B36A]" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Performance Report</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Ready</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-800/50 rounded p-2">
              <div className="text-[10px] text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Total Leads</div>
              <div className="text-xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>127</div>
            </div>
            <div className="bg-neutral-800/50 rounded p-2">
              <div className="text-[10px] text-neutral-400 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>ROAS</div>
              <div className="text-xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>3.2x</div>
            </div>
          </div>

          {/* Completed Deliverables */}
          <div className="pt-2 border-t border-white/5">
            <div className="text-xs text-neutral-400 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Completed This Quarter</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>Q4 Ad Campaign</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif" }}>12 Blog Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. VENDOR LOGOS - Connection Beam with dropping lines
const AutomationVisual = () => {
  const vendors = [
    {
      name: 'Microsoft',
      logo: (
        <svg viewBox="0 0 23 23" className="w-6 h-6">
          <rect x="0" y="0" width="11" height="11" fill="#F25022" />
          <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
          <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
          <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
        </svg>
      )
    },
    {
      name: 'Google',
      logo: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    {
      name: 'Slack',
      logo: (
        <svg viewBox="0 0 122 122" className="w-6 h-6">
          <path fill="#E01E5A" d="M27.2 80.7c0 7.3-5.9 13.1-13.1 13.1C6.8 93.8 1 87.9 1 80.7s5.9-13.1 13.1-13.1h13.1v13.1zm6.6 0c0-7.3 5.9-13.1 13.1-13.1 7.3 0 13.1 5.9 13.1 13.1v32.8c0 7.3-5.9 13.1-13.1 13.1-7.3 0-13.1-5.9-13.1-13.1V80.7z"/>
          <path fill="#36C5F0" d="M47.4 27.2c-7.3 0-13.1-5.9-13.1-13.1C34.3 6.8 40.1 1 47.4 1s13.1 5.9 13.1 13.1v13.1H47.4zm0 6.5c7.3 0 13.1 5.9 13.1 13.1 0 7.3-5.9 13.1-13.1 13.1H14.6C7.3 60.9 1.4 55 1.4 47.7c0-7.3 5.9-13.1 13.1-13.1h32.9z"/>
          <path fill="#2EB67D" d="M94.8 41.3c0-7.3 5.9-13.1 13.1-13.1 7.3 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1H94.8V41.3zm-6.6 0c0 7.3-5.9 13.1-13.1 13.1-7.3 0-13.1-5.9-13.1-13.1V8.5c0-7.3 5.9-13.1 13.1-13.1 7.3 0 13.1 5.9 13.1 13.1v32.8z"/>
          <path fill="#ECB22E" d="M74.6 94.8c7.3 0 13.1 5.9 13.1 13.1 0 7.3-5.9 13.1-13.1 13.1-7.3 0-13.1-5.9-13.1-13.1V94.8h13.1zm0-6.5c-7.3 0-13.1-5.9-13.1-13.1 0-7.3 5.9-13.1 13.1-13.1h32.9c7.3 0 13.1 5.9 13.1 13.1 0 7.3-5.9 13.1-13.1 13.1H74.6z"/>
        </svg>
      )
    },
    {
      name: 'Dropbox',
      logo: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path fill="#0061FF" d="M6 2L12 6l6-4v4l-6 4-6-4V2zm6 8l6-4v4l-6 4-6-4V6l6 4zM6 14l6 4 6-4v4l-6 4-6-4v-4zm12 0v4l-6 4-6-4v-4l6-4 6 4z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="relative w-full h-[180px] flex flex-col items-center justify-center">
      {/* Top Row: Vendors */}
      <div className="flex justify-between w-full max-w-lg px-8 relative z-10">
        {/* Vendor Icons */}
        {vendors.map((vendor, i) => (
          <div key={vendor.name} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="h-12 w-12 bg-neutral-900/50 border border-white/10 rounded-xl flex items-center justify-center shadow-lg group-hover:border-[#D6B36A]/50 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#D6B36A]/30 mix-blend-mode-color pointer-events-none z-10 rounded-xl"></div>
              <div className="relative z-0" style={{ filter: 'sepia(20%) saturate(150%) hue-rotate(15deg)' }}>{vendor.logo}</div>
            </div>
            {/* The Vertical Line dropping down */}
            <div className="h-16 w-[1px] bg-gradient-to-b from-white/10 via-[#D6B36A]/30 to-transparent relative overflow-hidden">
            </div>
            <div className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">{vendor.name}</div>
          </div>
        ))}
      </div>

      {/* The Central Hub (Elvance) */}
      <div className="relative z-20 -mt-8">
        <div className="h-16 w-16 bg-gradient-to-br from-[#D6B36A]/20 to-black/50 border border-[#D6B36A]/50 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(214,179,106,0.2)]">
          <div className="w-10 h-10 rounded bg-[#D6B36A] flex items-center justify-center">
            <span className="text-black font-bold text-lg">E</span>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-[#D6B36A] text-center mt-2">Elvance</div>
        {/* Horizontal Connector Line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[1px] bg-gradient-to-r from-transparent via-[#D6B36A]/20 to-transparent -z-10" />
      </div>
    </div>
  );
};

export default function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1 && !visibleCards.includes(index)) {
              setTimeout(() => {
                setVisibleCards(prev => [...prev, index]);
              }, index * 100);
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [visibleCards]);

  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
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
  }, []);

  const renderUIComponent = (type: string) => {
    switch (type) {
      case 'pricehike':
        return <DeliverableWorkflowVisual />;
      case 'cancel':
        return <KPIDashboardVisual />;
      case 'riskflags':
        return <ClientPortalVisual />;
      case 'marketrates':
        return <WeeklyUpdateVisual />;
      case 'cancellation':
        return <ReportsVisual />;
      case 'vendorlogos':
        return <AutomationVisual />;
      default:
        return null;
    }
  };

  return (
    <section
      ref={sectionRef as any}
      id="features"
      className={`relative overflow-hidden transition-all duration-1000 ${
        sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="pt-24 pb-32 px-6 lg:px-12 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div ref={headerRef} className="mb-20 max-w-2xl relative z-10 md:text-center md:mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight mb-6" style={{ fontFamily: "'canela-text', serif" }}>
              Everything you need to run your agency.
            </h2>
            <p className="text-lg text-gray-400 font-semibold leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Manage deliverables, track performance, automate workflows, and delight clients. All in one powerful platform built for modern marketing agencies.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {/* Top Row: Large card (2 cols) + Small card (1 col) */}
            <Card
              title={features[0].title}
              description={features[0].description}
              className="md:col-span-2 min-h-[340px]"
              isVisible={visibleCards.includes(0)}
              cardRef={(el) => cardRefs.current[0] = el}
              index={0}
            >
              {renderUIComponent(features[0].uiComponent)}
            </Card>

            <Card
              title={features[1].title}
              description={features[1].description}
              className="md:col-span-1 min-h-[340px]"
              isVisible={visibleCards.includes(1)}
              cardRef={(el) => cardRefs.current[1] = el}
              index={1}
            >
              {renderUIComponent(features[1].uiComponent)}
            </Card>

            {/* Bottom Row: Three cards (1 col each) + wraps to next row */}
            <Card
              title={features[2].title}
              description={features[2].description}
              className="md:col-span-1 min-h-[320px]"
              isVisible={visibleCards.includes(2)}
              cardRef={(el) => cardRefs.current[2] = el}
              index={2}
            >
              {renderUIComponent(features[2].uiComponent)}
            </Card>

            <Card
              title={features[3].title}
              description={features[3].description}
              className="md:col-span-1 min-h-[320px]"
              isVisible={visibleCards.includes(3)}
              cardRef={(el) => cardRefs.current[3] = el}
              index={3}
            >
              {renderUIComponent(features[3].uiComponent)}
            </Card>

            <Card
              title={features[4].title}
              description={features[4].description}
              className="md:col-span-1 min-h-[320px]"
              isVisible={visibleCards.includes(4)}
              cardRef={(el) => cardRefs.current[4] = el}
              index={4}
            >
              {renderUIComponent(features[4].uiComponent)}
            </Card>

            {/* Full width bottom card */}
            <Card
              title={features[5].title}
              description={features[5].description}
              className="md:col-span-3 min-h-[200px]"
              isVisible={visibleCards.includes(5)}
              cardRef={(el) => cardRefs.current[5] = el}
              index={5}
            >
              {renderUIComponent(features[5].uiComponent)}
            </Card>
          </div>

        </div>
      </div>

      {/* Smooth gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
    </section>
  );
}
