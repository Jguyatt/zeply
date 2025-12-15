'use client';

import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function Steps() {
  const [sectionRef, isVisible] = useScrollAnimation<HTMLElement>();
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();

  const steps = [
    {
      number: '1',
      title: 'Strategy',
      description: 'We analyze your business and create a custom marketing strategy'
    },
    {
      number: '2',
      title: 'Execute',
      description: 'Launch campaigns across channels with creative excellence'
    },
    {
      number: '3',
      title: 'Optimize',
      description: 'Continuously refine and scale what works for maximum ROI'
    }
  ];

  return (
    <section ref={sectionRef as any} className={`py-24 glass-border-b ${isVisible ? 'scroll-fade-in' : ''}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef as any} className={`text-center mb-16 ${titleVisible ? 'scroll-fade-in' : ''}`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary mb-4 leading-tight">
            How We <span className="italic font-normal">Work</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-center gap-12 md:gap-16 lg:gap-20">
          {steps.map((step, index) => {
            const [stepRef, stepVisible] = useScrollAnimation<HTMLDivElement>();
            return (
              <div 
                key={index} 
                ref={stepRef as any}
                className={`flex flex-col items-center text-center max-w-[220px] ${stepVisible ? `scroll-fade-in-delay${index > 0 ? `-${index}` : ''}` : ''}`}
              >
                <div className="w-14 h-14 rounded-full bg-white/10 text-primary flex items-center justify-center mb-6 text-xl font-medium border border-white/10">
                  {step.number}
                </div>
                <h3 className="text-lg font-light text-primary mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-secondary font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

