'use client';

import { Upload, Zap, FolderKanban, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function AutomatedWorkflows() {
  const [sectionRef, isVisible] = useScrollAnimation();
  const [titleRef, titleVisible] = useScrollAnimation();

  return (
    <section ref={sectionRef as any} className={`py-20 glass-border-t ${isVisible ? 'scroll-fade-in' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef as any} className={`text-center mb-16 ${titleVisible ? 'scroll-fade-in' : ''}`}>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
            MARKETING WORKFLOWS
          </h2>
          <h3 className="text-4xl md:text-5xl font-light text-primary mb-5 tracking-tight">
            Streamline Your Marketing
          </h3>
          <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            From strategy to execution, we create integrated marketing workflows that deliver consistent results and scale with your business.
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
          {/* Step 1 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 glass-surface glass-border rounded-xl flex items-center justify-center mb-5 shadow-prestige-soft hover:bg-white/10 transition-all duration-200">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-lg font-light text-primary mb-3">Discover & Plan</h4>
            <p className="text-sm text-secondary text-center leading-relaxed">
              Deep dive into your business, audience, and market to create winning strategies
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:block">
            <ArrowRight className="w-7 h-7 text-muted" />
          </div>
          <div className="md:hidden">
            <ArrowRight className="w-7 h-7 text-muted rotate-90" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 glass-surface glass-border rounded-xl flex items-center justify-center mb-5 shadow-prestige-soft hover:bg-white/10 transition-all duration-200">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-lg font-light text-primary mb-3">Create & Launch</h4>
            <p className="text-sm text-secondary text-center leading-relaxed">
              Develop compelling campaigns and launch across all channels with precision
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:block">
            <ArrowRight className="w-7 h-7 text-muted" />
          </div>
          <div className="md:hidden">
            <ArrowRight className="w-7 h-7 text-muted rotate-90" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 glass-surface glass-border rounded-xl flex items-center justify-center mb-5 shadow-prestige-soft hover:bg-white/10 transition-all duration-200">
              <FolderKanban className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-lg font-light text-primary mb-3">Measure & Scale</h4>
            <p className="text-sm text-secondary text-center leading-relaxed">
              Track performance, optimize campaigns, and scale what works for maximum ROI
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

