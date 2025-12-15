import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Privacy <span className="italic font-normal">Policy</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Introduction</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  At Elvance, we are committed to protecting your privacy and ensuring the security of your personal and business information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketing services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Information We Collect</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 font-light leading-relaxed ml-4">
                  <li>Account information (name, email address, password)</li>
                  <li>File metadata and organization preferences</li>
                  <li>Usage data and analytics</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">How We Use Your Information</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 font-light leading-relaxed ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze usage patterns</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Data Security</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Data Retention</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You may request deletion of your account and data at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Your Rights</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 font-light leading-relaxed ml-4">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Rectify inaccurate or incomplete information</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to processing of your personal data</li>
                  <li>Data portability</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Third-Party Services</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We may use third-party services to help us operate our business and administer activities on our behalf. These third parties have access to your information only to perform specific tasks and are obligated not to disclose or use it for any other purpose.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Changes to This Policy</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Contact Us</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at privacy@elvance.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Privacy

