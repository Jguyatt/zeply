import React, { useState } from 'react'
import AuthModal from './AuthModal'

const Hero = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signup')

  return (
    <section className="bg-white border-b border-gray-100 py-36 lg:py-48 relative">
      {/* Full-width horizontal lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gray-400"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-400"></div>
      
      {/* Two vertical lines on sides */}
      <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gray-600"></div>
      <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gray-600"></div>
      
      <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 relative">
        <div className="text-center">
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-8 leading-[1.1] tracking-tight">
            Grow Your Business with <span className="italic font-normal">Strategic Marketing</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-gray-500 mb-16 max-w-2xl mx-auto font-light leading-relaxed">
            We help brands reach their full potential through data-driven marketing strategies, creative campaigns, and measurable results that drive growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => {
                setAuthMode('signup')
                setAuthModalOpen(true)
              }}
              className="px-10 py-3.5 bg-gray-900 text-white text-base font-medium hover:bg-gray-800 transition-all duration-200 rounded-full shadow-sm hover:shadow-md"
            >
              Signup
            </button>
            <button className="px-10 py-3.5 bg-white text-gray-900 text-base font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-200 rounded-full shadow-sm hover:shadow-md">
              View Our Work
            </button>
          </div>
        </div>
      </div>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </section>
  )
}

export default Hero

