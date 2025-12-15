'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200 px-2 py-1">
              Home
            </Link>
            <Link href="/features" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200 px-2 py-1">
              Services
            </Link>
            <Link href="/pricing" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200 px-2 py-1">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200 px-2 py-1">
              About
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/">
                <button type="button" className="px-5 py-2 text-sm glass-surface text-primary font-light hover:bg-white/10 transition-all duration-200 glass-border rounded-full whitespace-nowrap">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/">
                <button type="button" className="px-5 py-2 text-sm bg-white/10 text-primary font-light hover:bg-white/15 transition-all duration-200 rounded-full whitespace-nowrap border border-white/10">
                  Signup
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

