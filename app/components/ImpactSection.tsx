'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Quote, X, ExternalLink } from 'lucide-react';
import { useScrollAnimation } from '@/app/hooks/useScrollAnimation';

/* -------------------------------------------------------------------------- */
/* TESTIMONIAL DATA                                                           */
/* -------------------------------------------------------------------------- */
const testimonials = [
  {
    id: 'zevacci',
    company: 'Zevacci',
    companyUrl: 'https://zevacci.com',
    logo: 'https://zevacci.com/cdn/shop/files/zevacci_transparent_bl.png?height=72&v=1740649812',
    name: 'Priya Sharma',
    role: 'Head of Marketing',
    photo: 'https://i.pravatar.cc/150?img=47',
    quote: 'Elvance transformed how we track our marketing campaigns. We went from spending hours compiling reports to having everything update automatically. Our client retention increased by 40% because they can see their progress in real-time.',
    story: {
      title: 'How Zevacci Increased Client Retention by 40% with Real-Time Transparency',
      challenge: 'Zevacci, a premium fashion brand, struggled with client communication. Their marketing agency was spending 15+ hours per week creating manual reports, and clients felt disconnected from their campaign progress.',
      solution: 'After implementing Elvance, Zevacci\'s marketing team automated all reporting and deliverable tracking. Clients now see real-time updates on campaign performance, completed work, and upcoming deliverables through their personalized dashboard.',
      results: [
        '40% increase in client retention',
        '15 hours saved per week on manual reporting',
        '98% client satisfaction score',
        '3x faster campaign approvals'
      ],
      quote: 'Before Elvance, we were constantly fielding questions about campaign status. Now our clients can see everything in real-time, and we can focus on what we do best—creating amazing campaigns.',
      author: 'Priya Sharma, Head of Marketing at Zevacci'
    }
  },
  {
    id: 'skagen',
    company: 'Skagen Clothing',
    companyUrl: 'https://skagenclothing.com',
    logo: 'https://skagenclothing.com/cdn/shop/files/Skagen_No-wordmark_Black_4x_ac8e89cc-7d51-45a9-b62d-187aca45d6f4.png?v=1765474637&width=200',
    name: 'Anders Larsson',
    role: 'Founder & CEO',
    photo: 'https://i.pravatar.cc/150?img=12',
    quote: 'We found $8,000 per month in forgotten retainers that we didn\'t even know we had. Elvance paid for itself in the first week. The automated tracking and client portal has been a game-changer for our agency relationships.',
    story: {
      title: 'How Skagen Clothing Recovered $8,000 Monthly in Lost Revenue',
      challenge: 'Skagen Clothing was losing money on forgotten client retainers and incomplete deliverables. Without proper tracking, they were missing revenue opportunities and struggling to maintain client relationships.',
      solution: 'Elvance\'s automated deliverable tracking and client portal system helped Skagen identify all active client relationships, track pending deliverables, and ensure nothing fell through the cracks.',
      results: [
        '$8,000/month recovered in forgotten retainers',
        '100% deliverable completion rate',
        'Zero missed renewal opportunities',
        '50% reduction in client churn'
      ],
      quote: 'Elvance showed us money we didn\'t even know we were leaving on the table. The system pays for itself multiple times over, and our clients love the transparency.',
      author: 'Anders Larsson, Founder & CEO at Skagen Clothing'
    }
  }
];

/* -------------------------------------------------------------------------- */
/* TESTIMONIAL MODAL                                                          */
/* -------------------------------------------------------------------------- */
const TestimonialModal = ({ testimonial, isOpen, onClose }: { testimonial: typeof testimonials[0] | null, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !testimonial) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors z-10"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/10">
          <div className="flex items-start gap-4 mb-6">
            <img 
              src={testimonial.photo} 
              alt={testimonial.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D6B36A]/30"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'canela-text', serif" }}>
                {testimonial.story.title}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[#D6B36A] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{testimonial.name}</span>
                <span className="text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>•</span>
                <span className="text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>{testimonial.role}</span>
                <span className="text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>•</span>
                <a 
                  href={testimonial.companyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#D6B36A] hover:text-[#D6B36A]/80 inline-flex items-center gap-1 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {testimonial.company}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Challenge */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>The Challenge</h4>
            <p className="text-neutral-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              {testimonial.story.challenge}
            </p>
          </div>

          {/* Solution */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>The Solution</h4>
            <p className="text-neutral-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              {testimonial.story.solution}
            </p>
          </div>

          {/* Results */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>The Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonial.story.results.map((result, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-neutral-800/50 border border-white/5">
                  <div className="h-6 w-6 rounded-full bg-[#D6B36A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-[#D6B36A]"></div>
                  </div>
                  <span className="text-neutral-200" style={{ fontFamily: "'Inter', sans-serif" }}>{result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="pt-6 border-t border-white/10">
            <div className="relative pl-8">
              <Quote className="absolute top-0 left-0 h-6 w-6 text-[#D6B36A]/30" />
              <p className="text-xl text-white italic leading-relaxed mb-4" style={{ fontFamily: "'canela-text', serif" }}>
                "{testimonial.story.quote}"
              </p>
              <p className="text-sm text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                — {testimonial.story.author}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function ImpactSection() {
  const [selectedTestimonial, setSelectedTestimonial] = useState<typeof testimonials[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sectionRef, isSectionVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px',
  });
  const [visibleTestimonials, setVisibleTestimonials] = useState<Set<number>>(new Set());
  const testimonialRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isSectionVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = testimonialRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setVisibleTestimonials(prev => new Set(prev).add(index));
            }
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    testimonialRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isSectionVisible]);

  const handleTestimonialClick = (testimonial: typeof testimonials[0]) => {
    setSelectedTestimonial(testimonial);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTestimonial(null), 300);
  };

  return (
    <>
    <section ref={sectionRef} className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className={`mb-12 text-center transition-all duration-1000 ${
          isSectionVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-5xl font-serif text-white" style={{ fontFamily: "'canela-text', serif" }}>
            One successful campaign pays for Elvance for <span className="italic text-[#D6B36A]">years.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => {
            const isVisible = visibleTestimonials.has(index);
            return (
            <div
              key={testimonial.id}
              ref={(el) => { testimonialRefs.current[index] = el; }}
              onClick={() => handleTestimonialClick(testimonial)}
              className={`group relative overflow-hidden rounded-[2rem] bg-neutral-900 border border-white/10 min-h-[400px] flex flex-col cursor-pointer transition-all duration-500 hover:border-[#D6B36A]/50 hover:-translate-y-1 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#D6B36A]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col h-full">
                {/* Company Logo - Clickable */}
                <div className="mb-6">
                  <a 
                    href={testimonial.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={testimonial.logo} 
                      alt={testimonial.company}
                      className="h-8 w-auto object-contain filter brightness(0) invert(1) opacity-80"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </a>
                </div>

                {/* Quote */}
                <div className="flex-1 mb-6">
                  <Quote className="h-8 w-8 text-[#D6B36A]/30 mb-4" />
                  <p className="text-lg text-white leading-relaxed mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <img 
                    src={testimonial.photo} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#D6B36A]/30"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {testimonial.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {testimonial.role}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <a 
                        href={testimonial.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#D6B36A] hover:text-[#D6B36A]/80 text-sm font-medium transition-colors inline-flex items-center gap-1"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {testimonial.company}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Right Icon */}
              <ArrowUpRight className="absolute top-8 right-8 text-neutral-600 h-6 w-6 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Modal */}
    <TestimonialModal 
      testimonial={selectedTestimonial} 
      isOpen={isModalOpen} 
      onClose={handleCloseModal} 
    />
    </>
  );
}
