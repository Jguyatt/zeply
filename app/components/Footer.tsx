import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="glass-border-t relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-[200px] md:text-[300px] lg:text-[400px] font-light text-primary/5 select-none tracking-tight">
          Elvance
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-xl font-light text-primary hover:text-accent transition-colors tracking-tight mb-4 inline-block">
              Elvance
            </Link>
            <p className="text-sm text-secondary font-light leading-relaxed">
              Strategic marketing agency helping brands grow and succeed.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-light text-primary mb-4 tracking-tight">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/workflows" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Workflows
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-light text-primary mb-4 tracking-tight">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-light text-primary mb-4 tracking-tight">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/documentation" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 glass-border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-secondary font-light">
              © {new Date().getFullYear()} Elvance. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-secondary hover:text-primary font-light transition-colors duration-200">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

