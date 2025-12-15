'use client';

import { SignUpButton } from '@clerk/nextjs';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CTASection() {
  const benefits = [
    'Data-driven marketing strategies',
    'Creative campaign development',
    'Real-time performance tracking',
    'Measurable ROI and growth',
  ];

  return (
    <section className="py-32 lg:py-40 relative glass-border-b overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-accent/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-tight tracking-tight">
            Ready to <span className="italic font-normal">transform</span> your marketing?
          </h2>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-secondary mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join forward-thinking brands that trust Elvance to deliver exceptional results and drive sustainable growth.
          </p>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-base text-secondary font-light">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal" fallbackRedirectUrl="/">
              <button className="group px-10 py-4 bg-white/10 text-primary text-lg font-medium hover:bg-white/15 transition-all duration-300 rounded-full shadow-prestige border border-white/10 flex items-center gap-2">
                Get Started Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
            <button className="px-10 py-4 glass-surface text-primary text-lg font-medium hover:bg-white/10 transition-all duration-300 glass-border rounded-full shadow-prestige-soft">
              Schedule a Demo
            </button>
          </div>

          {/* Trust Indicator */}
          <p className="mt-8 text-sm text-muted font-light">
            No credit card required • Start your free trial today
          </p>
        </div>
      </div>
    </section>
  );
}

