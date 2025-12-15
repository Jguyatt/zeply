import Header from '../components/Header';
import Footer from '../components/Footer';
import { SignUpButton } from '@clerk/nextjs';
import { CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-charcoal">
      {/* Full-bleed background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#151823] via-[#0B0D10] to-[#0B0D10]" />
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1E3A8A]/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[700px] -translate-y-1/2 rounded-full bg-[#4C1D95]/20 blur-3xl" />
      </div>

      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-primary mb-4 tracking-tight">
            Pricing
          </h1>
          <p className="text-lg text-secondary font-light">
            Choose the plan that works for your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="glass-surface rounded-lg p-8 border border-white/10 shadow-prestige-soft">
            <h3 className="text-2xl font-light text-primary mb-2">Starter</h3>
            <div className="mb-6">
              <span className="text-2xl font-semibold text-primary">Please Contact</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Up to 5 clients
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Basic contract management
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Email support
              </li>
            </ul>
            <button className="w-full px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all border border-white/10">
              Contact Us
            </button>
          </div>

          {/* Professional Plan */}
          <div className="glass-surface rounded-lg p-8 relative border-2 border-accent/30 shadow-prestige">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-accent/20 text-accent px-4 py-1 text-xs rounded-full border border-accent/30">Popular</span>
            </div>
            <h3 className="text-2xl font-light text-primary mb-2">Professional</h3>
            <div className="mb-6">
              <span className="text-2xl font-semibold text-primary">Please Contact</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Unlimited clients
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Advanced contract management
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Priority support
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Custom integrations
              </li>
            </ul>
            <button className="w-full px-4 py-2 bg-white/10 text-primary rounded-lg hover:bg-white/15 transition-all border border-white/10">
              Contact Us
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-surface rounded-lg p-8 border border-white/10 shadow-prestige-soft">
            <h3 className="text-2xl font-light text-primary mb-2">Enterprise</h3>
            <div className="mb-6">
              <span className="text-2xl font-semibold text-primary">Please Contact</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Everything in Professional
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Dedicated account manager
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                Custom features
              </li>
              <li className="text-sm text-secondary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                SLA guarantee
              </li>
            </ul>
            <button className="w-full px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all border border-white/10">
              Contact Us
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </main>
  );
}
