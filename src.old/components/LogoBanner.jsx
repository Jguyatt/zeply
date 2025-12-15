import React from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const LogoBanner = () => {
  const [sectionRef, isVisible] = useScrollAnimation()
  const logos = [
    { 
      name: 'Vercel', 
      logo: 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
      alt: 'Vercel',
      fontStyle: { fontFamily: 'Inter, sans-serif', fontWeight: '600', letterSpacing: '-0.02em' }
    },
    { 
      name: 'Cursor', 
      logo: 'https://cursor.sh/favicon.ico',
      alt: 'Cursor',
      fontStyle: { fontFamily: 'Inter, sans-serif', fontWeight: '500', letterSpacing: '-0.01em' }
    },
    { 
      name: 'GitHub', 
      logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      alt: 'GitHub',
      fontStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '600', letterSpacing: '-0.01em' }
    },
    { 
      name: 'Stripe', 
      logo: 'https://stripe.com/favicon.ico',
      alt: 'Stripe',
      fontStyle: { fontFamily: 'Inter, sans-serif', fontWeight: '500', letterSpacing: '0' }
    },
    { 
      name: 'Notion', 
      logo: 'https://www.notion.so/images/logo-ios.png',
      alt: 'Notion',
      fontStyle: { fontFamily: 'ui-sans-serif, sans-serif', fontWeight: '500', letterSpacing: '-0.01em' }
    },
  ]

  return (
    <section ref={sectionRef} className={`py-12 bg-white border-b border-gray-100 ${isVisible ? 'scroll-fade' : ''}`}>
      <div className="mx-[1in]">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 font-light">Supported by:</p>
        </div>
        
        {/* Static logo grid */}
        <div className="flex items-center justify-center gap-0 flex-wrap">
          {logos.map((logo, index) => (
            <React.Fragment key={index}>
              <div
                className="flex items-center justify-center gap-3 px-8 flex-1 min-w-[160px]"
              >
                <img 
                  src={logo.logo} 
                  alt={logo.alt}
                  className="h-10 w-auto object-contain opacity-80"
                  style={{ filter: 'grayscale(100%)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span 
                  className="text-lg text-gray-900"
                  style={logo.fontStyle}
                >
                  {logo.name}
                </span>
              </div>
              {index < logos.length - 1 && (
                <div className="h-px w-12 bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LogoBanner

