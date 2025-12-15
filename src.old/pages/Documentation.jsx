import React, { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ChevronDown, ChevronRight, Download, Folder, Search, Zap, Settings } from 'lucide-react'

const Documentation = () => {
  const [openSection, setOpenSection] = useState('getting-started')

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Documentation
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Resources and guides to help you get the most from Elvance.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24 space-y-2">
                <button
                  onClick={() => toggleSection('getting-started')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    openSection === 'getting-started' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-light">Getting Started</span>
                  {openSection === 'getting-started' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleSection('services')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    openSection === 'services' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-light">Services</span>
                  {openSection === 'services' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleSection('best-practices')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    openSection === 'best-practices' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-light">Best Practices</span>
                  {openSection === 'best-practices' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleSection('faq')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    openSection === 'faq' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-light">FAQ</span>
                  {openSection === 'faq' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-12">
                {/* Getting Started Section */}
                {openSection === 'getting-started' && (
                  <div>
                    <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">Getting Started</h2>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          Working with Elvance
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                          <p className="text-gray-700 font-light leading-relaxed">
                            Getting started with Elvance is simple. Here's what to expect:
                          </p>
                          <ol className="list-decimal list-inside space-y-3 text-gray-700 font-light">
                            <li>Schedule a consultation call to discuss your marketing goals and challenges</li>
                            <li>We'll conduct a comprehensive audit of your current marketing efforts</li>
                            <li>Receive a customized marketing strategy tailored to your business</li>
                            <li>Begin implementation with our team handling execution and optimization</li>
                            <li>Track results through regular reporting and performance reviews</li>
                          </ol>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Folder className="w-5 h-5" />
                          Initial Consultation
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                          <p className="text-gray-700 font-light leading-relaxed mb-4">
                            During your initial consultation, we'll discuss:
                          </p>
                          <ul className="space-y-2 text-gray-700 font-light">
                            <li>• Your business goals and marketing objectives</li>
                            <li>• Current marketing performance and challenges</li>
                            <li>• Target audience and market positioning</li>
                            <li>• Budget and timeline expectations</li>
                            <li>• Success metrics and KPIs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services Section */}
                {openSection === 'services' && (
                  <div>
                    <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">Our Services</h2>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Folder className="w-5 h-5" />
                          Digital Marketing
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          Comprehensive digital marketing services including:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• <strong className="text-gray-900">SEO:</strong> Search engine optimization to improve organic visibility</li>
                          <li>• <strong className="text-gray-900">PPC:</strong> Paid advertising campaigns on Google, Facebook, and other platforms</li>
                          <li>• <strong className="text-gray-900">Social Media:</strong> Strategy, content creation, and community management</li>
                          <li>• <strong className="text-gray-900">Content Marketing:</strong> Blog posts, articles, and content strategy</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Brand Strategy
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          Develop a compelling brand identity:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• Brand positioning and messaging</li>
                          <li>• Visual identity and design guidelines</li>
                          <li>• Brand voice and tone development</li>
                          <li>• Competitive analysis and differentiation</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Creative Services
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          High-quality creative work:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• Graphic design and visual assets</li>
                          <li>• Video production and editing</li>
                          <li>• Photography and image creation</li>
                          <li>• Campaign creative development</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Best Practices Section */}
                {openSection === 'best-practices' && (
                  <div>
                    <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">Best Practices</h2>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Folder className="w-5 h-5" />
                          Marketing Strategy
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          Key principles for effective marketing:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• <strong className="text-gray-900">Define Clear Goals:</strong> Set specific, measurable marketing objectives</li>
                          <li>• <strong className="text-gray-900">Know Your Audience:</strong> Understand your target customers deeply</li>
                          <li>• <strong className="text-gray-900">Consistent Messaging:</strong> Maintain brand voice across all channels</li>
                          <li>• <strong className="text-gray-900">Measure Everything:</strong> Track KPIs and optimize based on data</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Content Marketing
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          Best practices for content that converts:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• Create valuable, educational content that solves problems</li>
                          <li>• Optimize content for search engines and user experience</li>
                          <li>• Maintain a consistent publishing schedule</li>
                          <li>• Promote content across multiple channels</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Campaign Optimization
                        </h3>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          Continuously improve campaign performance:
                        </p>
                        <ul className="space-y-2 text-gray-700 font-light bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <li>• Test different ad creatives and messaging</li>
                          <li>• Monitor performance metrics regularly</li>
                          <li>• Adjust targeting and bidding strategies</li>
                          <li>• Scale what works and pause what doesn't</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ Section */}
                {openSection === 'faq' && (
                  <div>
                    <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">Frequently Asked Questions</h2>
                    
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4">How long does it take to see results?</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-700 font-light leading-relaxed">
                            Results vary by strategy. PPC campaigns can show immediate results, while SEO typically takes 3-6 months. Content marketing builds over time. We'll provide specific timelines during your strategy session.
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4">What's included in your marketing packages?</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <ul className="space-y-2 text-gray-700 font-light">
                            <li>• Custom marketing strategy development</li>
                            <li>• Campaign creation and execution</li>
                            <li>• Regular performance reporting</li>
                            <li>• Ongoing optimization and adjustments</li>
                            <li>• Dedicated account management</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4">Do you work with small businesses?</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-700 font-light leading-relaxed">
                            Yes! We work with businesses of all sizes, from startups to enterprises. We customize our services and pricing to fit your budget and needs.
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4">How do you measure success?</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-700 font-light leading-relaxed mb-3">
                            We track metrics that matter to your business:
                          </p>
                          <ul className="space-y-2 text-gray-700 font-light">
                            <li>• ROI and revenue growth</li>
                            <li>• Lead generation and conversion rates</li>
                            <li>• Customer acquisition cost</li>
                            <li>• Brand awareness and engagement</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-light text-gray-900 mb-4">Need more help?</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <p className="text-gray-700 font-light mb-3">
                            Have more questions? Contact our team:
                          </p>
                          <p className="text-gray-900 font-medium">support@elvance.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Documentation

