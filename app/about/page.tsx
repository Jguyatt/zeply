'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { SignUpButton } from '@clerk/nextjs';

export default function About() {
  const values = [
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M4 4v24h24" />
          <path d="M8 16l6-6 4 4 8-8" />
          <circle cx="26" cy="26" r="2.5" />
          <path d="M4 8h4M4 12h4M4 20h4" />
        </svg>
      ),
      title: 'Data-Driven',
      description: 'Every decision is backed by data and analytics. We measure what matters and optimize for results, not vanity metrics.'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M16 2L4 8v8c0 8 12 14 12 14s12-6 12-14V8L16 2z" />
          <path d="M16 10v6M12 13h8" />
        </svg>
      ),
      title: 'Transparency',
      description: 'Clear reporting, honest communication, and full visibility into your marketing performance. No black boxes or hidden processes.'
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <circle cx="11" cy="11" r="3" />
          <circle cx="21" cy="11" r="3" />
          <circle cx="11" cy="21" r="3" />
          <circle cx="21" cy="21" r="3" />
          <path d="M14 11h4M14 21h4M11 14v4M21 14v4" />
        </svg>
      ),
      title: 'Partnership',
      description: "We're not just vendors—we're your marketing partners. We invest in your success and grow alongside your business."
    },
    {
      icon: (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="6" />
          <path d="M16 4v4M16 24v4M4 16h4M24 16h4" />
        </svg>
      ),
      title: 'Results-Focused',
      description: 'We focus on outcomes that matter: revenue, growth, and ROI. Every campaign is designed to move the needle for your business.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Campaigns Launched' },
    { value: '98%', label: 'Client Retention' },
    { value: '3x', label: 'Average ROI' },
    { value: '50+', label: 'Happy Clients' }
  ];

  const approach = [
    {
      number: '01',
      title: 'Discovery',
      description: 'We start by understanding your business, goals, and challenges. Through deep research and strategic workshops, we identify opportunities and craft a tailored approach.'
    },
    {
      number: '02',
      title: 'Strategy',
      description: 'Every campaign begins with a comprehensive strategy. We analyze your market, competitors, and audience to develop data-driven plans that align with your objectives.'
    },
    {
      number: '03',
      title: 'Execution',
      description: 'Our team brings strategies to life with precision and creativity. From content creation to campaign management, we ensure flawless execution across all channels.'
    },
    {
      number: '04',
      title: 'Optimization',
      description: 'We continuously monitor performance, analyze results, and optimize campaigns in real-time. Data-driven insights guide every decision to maximize your ROI.'
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
              About <span className="italic font-normal">Elvance</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              We help brands grow through strategic marketing that delivers measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 lg:py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-8 text-center tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
            Our <span className="italic font-normal">Mission</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-400 font-light leading-relaxed text-center max-w-3xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            At Elvance, we believe that great marketing is about more than just campaigns—it's about building lasting relationships, 
            creating meaningful connections, and driving real business growth. We combine strategic thinking with creative excellence 
            to deliver marketing solutions that not only look great but perform even better.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-light text-[#D6B36A] mb-2" style={{ fontFamily: "'canela-text', serif" }}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-neutral-400 font-light" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-16 text-center tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
            Our <span className="italic font-normal">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {values.map((value, index) => (
              <div key={index} className="group relative bg-neutral-900 rounded-2xl p-8 border border-white/5 hover:border-[#D6B36A]/20 transition-all duration-300 hover:-translate-y-1">
                <div className="mb-6 text-[#D6B36A]">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {value.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {value.description}
                </p>
                <div className="absolute inset-0 bg-gradient-to-br from-[#D6B36A]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section className="py-20 lg:py-24 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-16 text-center tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
            Our <span className="italic font-normal">Approach</span>
          </h2>
          <div className="space-y-12 lg:space-y-16">
            {approach.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                <div className="flex-shrink-0">
                  <div className="text-6xl md:text-7xl font-light text-[#D6B36A]/20 mb-2" style={{ fontFamily: "'canela-text', serif" }}>
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-lg text-neutral-400 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
            Ready to <span className="italic font-normal">Work Together?</span>
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
