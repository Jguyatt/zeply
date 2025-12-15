import Header from '../components/Header';
import Footer from '../components/Footer';
import { Zap, Shield, Users, Target } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Zap,
      title: 'Data-Driven',
      description: 'Every decision is backed by data and analytics. We measure what matters and optimize for results, not vanity metrics.'
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Clear reporting, honest communication, and full visibility into your marketing performance. No black boxes or hidden processes.'
    },
    {
      icon: Users,
      title: 'Partnership',
      description: "We're not just vendors—we're your marketing partners. We invest in your success and grow alongside your business."
    },
    {
      icon: Target,
      title: 'Results-Focused',
      description: 'We focus on outcomes that matter: revenue, growth, and ROI. Every campaign is designed to move the needle for your business.'
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
              About <span className="italic font-normal">Elvance</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              We help brands grow through strategic marketing that delivers measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-light text-primary mb-6 text-center tracking-tight">
            Our <span className="italic font-normal">Mission</span>
          </h2>
          <p className="text-lg text-secondary font-light leading-relaxed text-center max-w-3xl mx-auto">
            At Elvance, we believe that great marketing is about more than just campaigns—it's about building lasting relationships, 
            creating meaningful connections, and driving real business growth. We combine strategic thinking with creative excellence 
            to deliver marketing solutions that not only look great but perform even better.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-light text-primary mb-16 text-center tracking-tight">
            Our <span className="italic font-normal">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-light text-primary mb-4 tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-sm text-secondary font-light leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
