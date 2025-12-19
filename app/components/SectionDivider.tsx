'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SectionDivider() {
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (dividerRef.current) {
      observer.observe(dividerRef.current);
    }

    return () => {
      if (dividerRef.current) {
        observer.unobserve(dividerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={dividerRef}
      className={`relative h-px bg-white/10 transition-all duration-1000 ${
        isVisible 
          ? 'opacity-100 scale-x-100' 
          : 'opacity-0 scale-x-0'
      }`}
      style={{ transformOrigin: 'center' }}
    />
  );
}
