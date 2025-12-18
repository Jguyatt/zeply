import Header from '../components/Header';
import Footer from '../components/Footer';
import { SignUpButton } from '@clerk/nextjs';
import { CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const allFeatures = [
    'Unlimited clients',
    'Full-service digital marketing',
    'Brand strategy & creative services',
    'Marketing automation & analytics',
    'AI-powered content & optimization',
    'Client portal & deliverable tracking',
    'Custom integrations & features',
    'Dedicated account manager',
    'Priority support & SLA guarantee'
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-white/5 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
              <span className="italic font-normal">Pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Comprehensive marketing solutions tailored to your business needs
            </p>
          </div>
        </div>
      </section>

      {/* Single Pricing Plan */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="group relative bg-neutral-900 rounded-2xl p-10 md:p-12 lg:p-16 border-2 border-[#D6B36A]/30 hover:border-[#D6B36A]/50 transition-all duration-300 hover:-translate-y-1 flex flex-col">
            {/* Plan Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight tracking-tight" style={{ fontFamily: "'canela-text', serif" }}>
                Complete Marketing <span className="italic font-normal">Solution</span>
              </h2>
              <div className="mb-8">
                <span className="text-3xl md:text-4xl font-light text-[#D6B36A] tracking-wide" style={{ fontFamily: "'canela-text', serif" }}>
                  Please Contact
                </span>
              </div>
              <p className="text-base md:text-lg text-neutral-400 max-w-xl mx-auto font-light leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                All-inclusive marketing services designed to grow your business
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 mb-12 flex-1">
              {allFeatures.map((feature, index) => (
                <li key={index} className="text-base md:text-lg text-neutral-300 flex items-start gap-4 font-light leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <CheckCircle2 className="w-5 h-5 text-[#D6B36A] flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button className="w-full px-8 py-4 bg-[#D6B36A] hover:bg-[#D6B36A]/90 text-black text-base md:text-lg font-medium rounded-lg transition-all duration-200 shadow-lg tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
              Contact Us
            </button>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D6B36A]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
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
