'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { Folder, Search, Shield, Zap, BarChart3, Clock, Brain, Sparkles, Target, MessageSquare, TrendingUp, FileText } from 'lucide-react';
import { SignUpButton } from '@clerk/nextjs';

export default function Features() {

  const features = [
    {
      icon: Folder,
      title: 'Digital Marketing',
      description: 'Comprehensive SEO, PPC, social media, and content marketing strategies that drive qualified traffic and measurable conversions.'
    },
    {
      icon: Search,
      title: 'Brand Strategy',
      description: 'Develop a compelling brand identity, messaging, and positioning that resonates with your target audience and drives loyalty.'
    },
    {
      icon: Shield,
      title: 'Creative Services',
      description: 'Eye-catching design, video production, and creative campaigns across all channels that capture attention and drive engagement.'
    },
    {
      icon: Zap,
      title: 'Marketing Analytics',
      description: 'Data-driven insights and performance tracking to measure ROI, optimize campaigns, and make informed marketing decisions.'
    },
    {
      icon: BarChart3,
      title: 'Growth Marketing',
      description: 'Scalable growth strategies that acquire customers efficiently, improve retention, and maximize lifetime value.'
    },
    {
      icon: Clock,
      title: 'Marketing Automation',
      description: 'Streamlined workflows and automated campaigns that nurture leads, engage customers, and scale your marketing efforts.'
    },
    {
      icon: Brain,
      title: 'AI Content Generation',
      description: 'Generate high-quality marketing copy, blog posts, and social media content in seconds using advanced AI that understands your brand voice.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered A/B Testing',
      description: 'Run thousands of campaign variations simultaneously. Our AI automatically tests and optimizes to find the highest-performing combinations.'
    },
    {
      icon: Target,
      title: 'Intelligent Audience Segmentation',
      description: 'AI analyzes customer behavior to create hyper-targeted segments, ensuring your message reaches the right people at the right time.'
    },
    {
      icon: MessageSquare,
      title: 'Predictive Analytics',
      description: 'Forecast campaign performance, identify high-value opportunities, and allocate budget where it will have the greatest impact.'
    },
    {
      icon: TrendingUp,
      title: 'Performance Optimization',
      description: 'Real-time campaign optimization that adjusts targeting, bidding, and creative based on performance data and AI insights.'
    },
    {
      icon: FileText,
      title: 'Automated Reporting',
      description: 'Get comprehensive, AI-generated reports that highlight key insights, trends, and actionable recommendations for your marketing.'
    }
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-charcoal">
      {/* Full-bleed background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#151823] via-[#0B0D10] to-[#0B0D10]" />
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1E3A8A]/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[700px] -translate-y-1/2 rounded-full bg-[#4C1D95]/20 blur-3xl" />
      </div>

      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-white/5 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-primary mb-6 leading-[1.1] tracking-tight">
              Our <span className="italic font-normal">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Comprehensive marketing solutions designed to grow your business and drive measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex flex-col glass-surface rounded-lg p-6 border border-white/10 shadow-prestige-soft hover:border-white/20 transition-all">
                  <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center mb-4 border border-white/10">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-light text-primary mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-secondary font-light leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-primary mb-6 tracking-tight">
            Ready to <span className="italic font-normal">Get Started?</span>
          </h2>
          <p className="text-lg text-secondary mb-8 font-light max-w-2xl mx-auto">
            Let's discuss how we can help grow your business with strategic marketing.
          </p>
          <SignUpButton mode="modal" fallbackRedirectUrl="/">
            <button className="px-10 py-3.5 bg-white/10 text-primary text-base font-medium hover:bg-white/15 transition-all duration-200 rounded-full shadow-prestige-soft border border-white/10">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </section>

      <Footer />
    </main>
  );
}
