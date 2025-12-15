import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-xl font-light text-gray-900 hover:text-gray-700 transition-colors tracking-tight mb-4 inline-block">
              Elvance
            </Link>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              Strategic marketing agency helping brands grow and succeed.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-light text-gray-900 mb-4 tracking-tight">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/workflows" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Workflows
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-light text-gray-900 mb-4 tracking-tight">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-light text-gray-900 mb-4 tracking-tight">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/documentation" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/help-center" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 font-light">
              © {new Date().getFullYear()} Elvance. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors duration-200">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

