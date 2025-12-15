import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Security from './pages/Security'
import Workflows from './pages/Workflows'
import About from './pages/About'
import Blog from './pages/Blog'
import Careers from './pages/Careers'
import Documentation from './pages/Documentation'
import HelpCenter from './pages/HelpCenter'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function App() {
  return (
    <div className="relative min-h-screen">
      {/* Vertical lines - 1 inch from left and right */}
      <div className="fixed inset-y-0 left-[1in] w-[1px] bg-gray-300 z-40 pointer-events-none"></div>
      <div className="fixed inset-y-0 right-[1in] w-[1px] bg-gray-300 z-40 pointer-events-none"></div>
      
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/security" element={<Security />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Redirect /auth/* to Next.js pages if using Next.js, otherwise handle in React Router */}
        </Routes>
      </Router>
    </div>
  )
}

export default App

