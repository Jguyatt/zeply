import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthModal from './AuthModal'

const Header = () => {
  const [logoError, setLogoError] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Elvance" 
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-2xl font-light text-gray-800 hover:text-gray-600 transition-colors tracking-tight">
                Elvance
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm text-gray-700 hover:text-gray-900 font-light transition-colors duration-200 px-2 py-1">
              Home
            </Link>
            <Link to="/features" className="text-sm text-gray-700 hover:text-gray-900 font-light transition-colors duration-200 px-2 py-1">
              Services
            </Link>
            <Link to="/pricing" className="text-sm text-gray-700 hover:text-gray-900 font-light transition-colors duration-200 px-2 py-1">
              Pricing
            </Link>
            <Link to="/about" className="text-sm text-gray-700 hover:text-gray-900 font-light transition-colors duration-200 px-2 py-1">
              About
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setAuthMode('signin')
                setAuthModalOpen(true)
              }}
              className="px-5 py-2 text-sm bg-white text-gray-900 font-light hover:bg-gray-50 transition-all duration-200 border border-gray-300 rounded-full"
            >
              Login
            </button>
            <button 
              onClick={() => {
                setAuthMode('signup')
                setAuthModalOpen(true)
              }}
              className="px-5 py-2 text-sm bg-gray-900 text-white font-light hover:bg-gray-800 transition-all duration-200 rounded-full"
            >
              Signup
            </button>
          </div>
        </div>
      </div>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </header>
  )
}

export default Header

