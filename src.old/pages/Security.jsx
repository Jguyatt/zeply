import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Shield, Lock, Eye, FileCheck, Key, Server, AlertTriangle, CheckCircle2 } from 'lucide-react'

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Client Data Protection',
      description: 'All client data, marketing assets, and business information are protected with enterprise-grade security. Your confidential information stays secure and private.'
    },
    {
      icon: Key,
      title: 'Access Control',
      description: 'Strict access controls and secure authentication ensure only authorized team members can access your account and marketing data.'
    },
    {
      icon: Eye,
      title: 'Confidentiality',
      description: 'We maintain strict confidentiality agreements and never share your business information, strategies, or data with third parties.'
    },
    {
      icon: FileCheck,
      title: 'Transparent Reporting',
      description: 'Complete visibility into your marketing performance with detailed, secure reporting. Track all activities and results in real-time.'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Our marketing tools and platforms are hosted on secure, enterprise-grade infrastructure with regular security audits and compliance certifications.'
    },
    {
      icon: Shield,
      title: 'Data Privacy Compliance',
      description: 'Full compliance with GDPR, CCPA, and other data protection regulations. Your customer data and marketing information are handled with the highest privacy standards.'
    }
  ]

  const securityPractices = [
    'Regular security audits and compliance reviews',
    'Secure client data handling and storage',
    '24/7 monitoring and incident response',
    'Encrypted backups and secure data retention',
    'Secure marketing platform integrations',
    'Regular security training for all team members',
    'Strict confidentiality agreements',
    'GDPR and CCPA compliant data practices'
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Security & <span className="italic font-normal">Privacy</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Enterprise-grade security and confidentiality to protect your business data and marketing assets.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              Security <span className="italic font-normal">Features</span>
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              Multiple layers of security protect your business data and marketing information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Encryption Details */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              Data Protection <span className="italic font-normal">Standards</span>
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-light text-gray-900 mb-4">Client Data Security</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                All client data, marketing assets, and business information are protected with industry-standard encryption. Your confidential business information is secured both in transit and at rest.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>TLS 1.3 encryption for all data transmission</span>
                </li>
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>AES-256 encryption for stored data</span>
                </li>
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Secure access controls and authentication</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-light text-gray-900 mb-4">Marketing Data Privacy</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Your marketing data, customer information, and campaign performance metrics are handled with strict privacy controls. We never share your data with third parties without explicit consent.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>GDPR and CCPA compliant data handling</span>
                </li>
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Strict confidentiality agreements</span>
                </li>
                <li className="flex items-start text-gray-600 font-light">
                  <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Secure data retention and deletion policies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              Security <span className="italic font-normal">Practices</span>
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              Continuous improvement and monitoring to maintain the highest security standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityPractices.map((practice, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-gray-900 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 font-light">{practice}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              Compliance & <span className="italic font-normal">Certifications</span>
            </h2>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-light text-gray-900 mb-3">Data Protection Regulations</h3>
                <p className="text-gray-600 font-light leading-relaxed mb-4">
                  Elvance complies with major data protection regulations to ensure your business and customer data privacy rights are protected.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-600 font-light">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>GDPR:</strong> Full compliance with European General Data Protection Regulation</span>
                  </li>
                  <li className="flex items-start text-gray-600 font-light">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>CCPA:</strong> California Consumer Privacy Act compliance</span>
                  </li>
                  <li className="flex items-start text-gray-600 font-light">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>Industry Standards:</strong> Following best practices for marketing data security</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-light text-gray-900 mb-3">Your Rights</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  You have full control over your marketing data. You can access, export, or request deletion of your data at any time. We respect your privacy choices and maintain transparency in all data handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              Incident <span className="italic font-normal">Response</span>
            </h2>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="flex items-start mb-6">
              <AlertTriangle className="w-6 h-6 text-gray-900 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-light text-gray-900 mb-3">Security Incident Reporting</h3>
                <p className="text-gray-600 font-light leading-relaxed mb-4">
                  If you discover a security vulnerability or have concerns about data security, please report it immediately. We take all security reports seriously and respond promptly.
                </p>
                <p className="text-gray-600 font-light leading-relaxed">
                  <strong>Email:</strong> security@elvance.com
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-light">
              We maintain a responsible disclosure policy and continuously work to improve our security and data protection practices.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Security

