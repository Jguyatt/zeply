'use client';

import React from 'react';

export default function LogoMarquee() {
  return (
    <div className="w-full bg-black py-16 border-t border-white/5">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <img
            src="/banner.png"
            alt="Integration Partners"
            className="h-auto w-full max-w-6xl opacity-60 hover:opacity-80 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
}
