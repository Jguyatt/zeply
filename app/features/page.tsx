'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { SignUpButton } from '@clerk/nextjs';

export default function Features() {

  const features = [
    // Row 1: 3 normal cards
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M8 4h12l4 4v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M20 4v6h6" />
          <path d="M10 12h12M10 16h12M10 20h8" />
          <circle cx="8" cy="8" r="1" />
        </svg>
      ),
      title: 'Digital Marketing',
      description: 'Comprehensive SEO, PPC, social media, and content marketing strategies that drive qualified traffic and measurable conversions.',
      size: 'normal'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <rect x="4" y="4" width="24" height="24" rx="2" />
          <path d="M10 10h12v12H10z" />
          <path d="M4 10h6M22 10h6M4 22h6M22 22h6M10 4v6M10 22v6M22 4v6M22 22v6" />
          <circle cx="16" cy="16" r="2" />
        </svg>
      ),
      title: 'Brand Strategy',
      description: 'Develop a compelling brand identity, messaging, and positioning that resonates with your target audience and drives loyalty.',
      size: 'normal'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M4 4v24h24" />
          <path d="M8 16l6-6 4 4 8-8" />
          <circle cx="26" cy="26" r="2.5" />
          <path d="M4 8h4M4 12h4M4 20h4" />
        </svg>
      ),
      title: 'Marketing Analytics',
      description: 'Data-driven insights and performance tracking to measure ROI, optimize campaigns, and make informed marketing decisions.',
      size: 'normal'
    },
    // Row 2: wide card (2 cols) + normal card (1 col)
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M6 10h20M6 16h20M6 22h20" />
          <path d="M10 4v8M22 4v8" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="24" cy="12" r="2" />
          <rect x="6" y="6" width="20" height="20" rx="1" />
        </svg>
      ),
      title: 'Creative Services',
      description: 'Eye-catching design, video production, and creative campaigns across all channels that capture attention and drive engagement.',
      size: 'wide'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <rect x="4" y="4" width="10" height="10" rx="1.5" />
          <rect x="18" y="4" width="10" height="10" rx="1.5" />
          <rect x="4" y="18" width="10" height="10" rx="1.5" />
          <rect x="18" y="18" width="10" height="10" rx="1.5" />
          <path d="M9 9h14M9 23h14M9 16h14" />
          <circle cx="9" cy="9" r="1" />
          <circle cx="23" cy="9" r="1" />
        </svg>
      ),
      title: 'Marketing Automation',
      description: 'Streamlined workflows and automated campaigns that nurture leads, engage customers, and scale your marketing efforts.',
      size: 'normal'
    },
    // Row 3: large card (2 cols) + normal card (1 col)
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <circle cx="16" cy="16" r="12" />
          <path d="M16 8v8l6 3" />
          <path d="M16 4a12 12 0 0 1 12 12" />
          <circle cx="16" cy="16" r="1.5" />
        </svg>
      ),
      title: 'Growth Marketing',
      description: 'Scalable growth strategies that acquire customers efficiently, improve retention, and maximize lifetime value.',
      size: 'large'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M16 4L4 10l12 6 12-6-12-6z" />
          <path d="M4 22l12 6 12-6" />
          <path d="M4 16l12 6 12-6" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
          <circle cx="16" cy="22" r="1.5" />
        </svg>
      ),
      title: 'AI Content Generation',
      description: 'Generate high-quality marketing copy, blog posts, and social media content in seconds using advanced AI that understands your brand voice.',
      size: 'normal'
    },
    // Row 4: 3 normal cards
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M12 14l4 4 10-10" />
          <path d="M26 16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14" />
          <path d="M10 16h12M10 20h10" />
          <circle cx="6" cy="6" r="1.5" />
        </svg>
      ),
      title: 'AI-Powered A/B Testing',
      description: 'Run thousands of campaign variations simultaneously. Our AI automatically tests and optimizes to find the highest-performing combinations.',
      size: 'normal'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="5" />
          <path d="M16 4v6M16 22v6M4 16h6M22 16h6" />
          <path d="M8.5 8.5l4 4M19.5 19.5l4 4M8.5 23.5l4-4M19.5 8.5l4-4" />
          <circle cx="16" cy="16" r="1.5" />
        </svg>
      ),
      title: 'Intelligent Audience Segmentation',
      description: 'AI analyzes customer behavior to create hyper-targeted segments, ensuring your message reaches the right people at the right time.',
      size: 'wide'
    }
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-white/5 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
              Our <span className="italic font-normal">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Comprehensive marketing solutions designed to grow your business and drive measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-fr">
            {features.map((feature, index) => {
              // Calculate size classes to ensure rectangular grid
              const sizeClass = feature.size === 'large' ? 'md:col-span-2 lg:col-span-2' : 
                               feature.size === 'wide' ? 'md:col-span-2 lg:col-span-2' : 
                               '';
              const minHeight = feature.size === 'large' || feature.size === 'wide' ? 'min-h-[280px] lg:min-h-[300px]' : 
                               'min-h-[320px] lg:min-h-[340px]';
              
              return (
                <div 
                  key={index} 
                  className={`group relative bg-neutral-900 rounded-2xl p-8 border border-white/5 hover:border-[#D6B36A]/20 transition-all duration-300 hover:-translate-y-1 flex flex-col ${minHeight} ${sizeClass}`}
                >
                  {/* Icon - Top Left */}
                  <div className="mb-6 text-[#D6B36A] flex-shrink-0">
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3 className={`font-semibold text-white mb-4 leading-tight flex-shrink-0 ${feature.size === 'large' || feature.size === 'wide' ? 'text-3xl lg:text-4xl' : 'text-2xl'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-neutral-400 leading-relaxed flex-1 ${feature.size === 'large' || feature.size === 'wide' ? 'text-base lg:text-lg' : 'text-sm lg:text-base'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {feature.description}
                  </p>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D6B36A]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
            Ready to <span className="italic font-normal">Get Started?</span>
          </h2>
          <p className="text-lg text-neutral-400 mb-8 font-light max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Let's discuss how we can help grow your business with strategic marketing.
          </p>
          <SignUpButton mode="modal" fallbackRedirectUrl="/">
            <button className="px-10 py-3.5 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base font-semibold transition-all duration-200 rounded-lg shadow-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get Started
            </button>
          </SignUpButton>
        </div>
      </section>

      <Footer />
    </main>
  );
}
