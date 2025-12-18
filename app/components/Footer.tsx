'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter signup
    console.log('Newsletter signup:', { firstName, email });

    // Show success message
    setIsSubscribed(true);
    setFirstName('');
    setEmail('');

    // Hide success message after 5 seconds
    setTimeout(() => {
      setIsSubscribed(false);
    }, 5000);
  };

  return (
    <footer className="bg-black relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-24 md:py-32 relative z-10">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-20 md:mb-24">
          {/* SITEMAP Column */}
          <div>
            <h3 className="text-zinc-500 mb-8 text-xs uppercase tracking-widest">
              SITEMAP
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white hover:underline transition-all text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white hover:underline transition-all text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white hover:underline transition-all text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/features/renewal-alerts" className="text-white hover:underline transition-all text-sm">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="text-white hover:underline transition-all text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY Column */}
          <div>
            <h3 className="text-zinc-500 mb-8 text-xs uppercase tracking-widest">
              COMPANY
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms-of-service" className="text-white hover:underline transition-all text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-white hover:underline transition-all text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-white hover:underline transition-all text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/subprocessors" className="text-white hover:underline transition-all text-sm">
                  Subprocessors
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT Column */}
          <div>
            <h3 className="text-zinc-500 mb-8 text-xs uppercase tracking-widest">
              CONTACT
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#faq" className="text-white hover:underline transition-all text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@elvance.com" className="text-white hover:underline transition-all text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER Column - Wide */}
          <div className="lg:col-span-1">
            <h3 className="text-zinc-500 mb-8 text-xs uppercase tracking-widest">
              NEWSLETTER
            </h3>
            <p className="text-white mb-6 text-sm">
              You read this far, might as well sign up.
            </p>
            {isSubscribed ? (
              <div className="space-y-4">
                <div className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded text-sm text-white">
                  ✓ Thanks for signing up! Check your email to confirm.
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex-1 bg-transparent border-b border-white text-white placeholder-zinc-500 focus:outline-none pb-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent border-b border-white text-white placeholder-zinc-500 focus:outline-none pb-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-sm rounded"
                >
                  Sign up
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Signature Background Watermark */}
      <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none overflow-hidden" style={{ height: '250px' }}>
        <div className="text-zinc-900 text-[15rem] font-bold leading-none whitespace-nowrap absolute bottom-0 left-0" style={{ fontFamily: "'Inter', sans-serif", transform: 'translateY(10%)' }}>
          ELVANCE
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 pt-10 pb-10">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Left: Copyright */}
            <div className="text-white text-xs uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.2em' }}>
              ©{currentYear} ELVANCE. ALL RIGHTS RESERVED.
            </div>

            {/* Right: Social Media */}
            <div className="flex items-center gap-6">
              <a
                href="https://www.linkedin.com/company/renlu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline transition-all text-xs uppercase tracking-widest"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.2em' }}
              >
                LINKEDIN
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
