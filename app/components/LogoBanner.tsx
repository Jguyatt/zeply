'use client';

import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function LogoBanner() {
  const [sectionRef, isVisible] = useScrollAnimation();
  const logos = [
    { 
      name: 'Vercel', 
      logo: 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
      alt: 'Vercel',
      className: 'text-lg text-gray-900 font-semibold tracking-tight'
    },
    { 
      name: 'Cursor', 
      logo: 'https://cursor.sh/favicon.ico',
      alt: 'Cursor',
      className: 'text-lg text-gray-900 font-medium tracking-tight'
    },
    { 
      name: 'GitHub', 
      logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      alt: 'GitHub',
      className: 'text-lg text-gray-900 font-semibold tracking-tight'
    },
    { 
      name: 'Stripe', 
      logo: 'https://stripe.com/favicon.ico',
      alt: 'Stripe',
      className: 'text-lg text-gray-900 font-medium tracking-normal'
    },
    { 
      name: 'Notion', 
      logo: 'https://www.notion.so/images/logo-ios.png',
      alt: 'Notion',
      className: 'text-lg text-gray-900 font-medium tracking-tight'
    },
  ];

  return (
    <section ref={sectionRef as any} className={`py-12 glass-border-b ${isVisible ? 'scroll-fade' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm text-secondary font-light">Trusted by leading brands:</p>
        </div>
        
        {/* Static logo grid */}
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center gap-3">
              <img 
                src={logo.logo} 
                alt={logo.alt}
                className="h-10 w-auto object-contain opacity-60 grayscale"
                onError={(e) => {
                  (e.target as HTMLImageElement).classList.add('hidden');
                }}
              />
              <span className="text-lg text-secondary font-medium tracking-tight">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

