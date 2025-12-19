'use client';

import { useState } from 'react';

// Real company logo URLs found from their websites with text fallbacks
// Removed broken logos: The Gallerist, Notre Succes, Parijan, Cainte
const logos = [
  { 
    url: 'https://zevacci.com/cdn/shop/files/zevacci_transparent_bl.png?height=72&v=1740649812', 
    alt: 'Zevacci',
    text: 'ZEVACCI',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '700',
    letterSpacing: '0.05em',
    showTextWithLogo: false
  },
  { 
    url: 'https://valusis.com/cdn/shop/files/logo_blackk_sitee.png?v=1711575427&width=230', 
    alt: 'Valusis',
    text: 'VALUSIS',
    fontFamily: "'Roboto', sans-serif",
    fontWeight: '500',
    letterSpacing: '0.15em',
    showTextWithLogo: false
  },
  { 
    url: 'https://calitheshop.com/cdn/shop/files/logggg.png?v=1678043964&width=280', 
    alt: 'Cali The Shop',
    text: 'CALITHE',
    fontFamily: "'Raleway', sans-serif",
    fontWeight: '700',
    letterSpacing: '0.12em',
    showTextWithLogo: false
  },
  { 
    url: 'https://artveux.com/cdn/shop/files/Logo_white.svg?v=1754651213&width=200', 
    alt: 'Artveux',
    text: 'ARTVEUX',
    fontFamily: "'Oswald', sans-serif",
    fontWeight: '500',
    letterSpacing: '0.2em',
    showTextWithLogo: false
  },
  { 
    url: 'https://cdn.instant.so/sites/9m9NOCxHNwUK7yNf/assets/UbRxvHMmX3gJI45C/based.svg', 
    alt: 'Based Bodyworks',
    text: 'BASED',
    fontFamily: "'Bebas Neue', sans-serif",
    fontWeight: '400',
    letterSpacing: '0.15em',
    showTextWithLogo: false
  },
  { 
    url: 'https://skagenclothing.com/cdn/shop/files/Skagen_No-wordmark_Black_4x_ac8e89cc-7d51-45a9-b62d-187aca45d6f4.png?v=1765474637&width=200', 
    alt: 'Skagen Clothing',
    text: 'SKAGEN',
    fontFamily: "'Lato', sans-serif",
    fontWeight: '700',
    letterSpacing: '0.1em',
    showTextWithLogo: false
  },
];

export default function LogoBanner() {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (logoUrl: string) => {
    setFailedImages(prev => new Set(prev).add(logoUrl));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@500&family=Raleway:wght@700&family=Oswald:wght@500&family=Bebas+Neue&family=Lato:wght@700&display=swap');
        
        :root {
          --bg-color: #f9f9f9;
          --banner-height: 100px;
        }

        .logo-slider {
          overflow: hidden;
          padding: 40px 0;
          background: #000000;
          white-space: nowrap;
          position: relative;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .logo-heading {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 30px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .logo-track {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
        }

        .slide {
          width: auto;
          min-width: auto;
          height: var(--banner-height);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-shrink: 0;
          position: relative;
        }

        .slide.logo-with-text {
          flex-direction: row;
          align-items: center;
        }

        .slide .company-name {
          color: white;
          font-size: 18px;
          white-space: nowrap;
          opacity: 0.9;
        }

        .slide img {
          max-width: 140px;
          max-height: 60px;
          width: auto;
          height: auto;
          object-fit: contain;
          filter: brightness(0) invert(1);
          transition: filter 0.3s ease;
        }

        .slide.based-slide {
          margin-left: -90px;
        }

        .slide.based-slide img {
          max-width: 180px;
          max-height: 75px;
        }

        .slide.based-slide .logo-text {
          font-size: 24px;
        }

        .slide img:hover {
          filter: brightness(1.2) invert(0);
        }

        .slide .logo-text {
          color: white;
          font-size: 18px;
          white-space: nowrap;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .slide img.hidden {
          display: none;
        }

        .slide:hover .logo-text {
          opacity: 1;
        }

      `}} />
      <div className="logo-slider">
        <div className="logo-heading">Trusted by Leading Brands</div>
        <div className="logo-track">
          {logos.map((logo, index) => {
            const imageFailed = failedImages.has(logo.url);
            const showTextWithLogo = logo.showTextWithLogo && !imageFailed;
            const isBased = logo.alt === 'Based Bodyworks';
            return (
              <div key={index} className={`slide ${showTextWithLogo ? 'logo-with-text' : ''} ${isBased ? 'based-slide' : ''}`}>
                {!imageFailed && (
                  <>
                    <img 
                      src={logo.url} 
                      alt={logo.alt}
                      loading="lazy"
                      crossOrigin="anonymous"
                      onError={() => handleImageError(logo.url)}
                      className={imageFailed ? 'hidden' : ''}
                    />
                    {showTextWithLogo && (
                      <span 
                        className="company-name"
                        style={{
                          fontFamily: logo.fontFamily,
                          fontWeight: logo.fontWeight,
                          letterSpacing: logo.letterSpacing,
                        }}
                      >
                        {logo.text}
                      </span>
                    )}
                  </>
                )}
                {imageFailed && (
                  <span
                    className="logo-text"
                    style={{
                      fontFamily: logo.fontFamily,
                      fontWeight: logo.fontWeight,
                      letterSpacing: logo.letterSpacing,
                    }}
                  >
                    {logo.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

