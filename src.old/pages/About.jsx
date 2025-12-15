import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Zap, Shield, Users, Target } from 'lucide-react'

const About = () => {
  const values = [
    {
      icon: Zap,
      title: 'Data-Driven',
      description: 'Every decision is backed by data and analytics. We measure what matters and optimize for results, not vanity metrics.'
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Clear reporting, honest communication, and full visibility into your marketing performance. No black boxes or hidden processes.'
    },
    {
      icon: Users,
      title: 'Partnership',
      description: "We're not just vendors—we're your marketing partners. We invest in your success and grow alongside your business."
    },
    {
      icon: Target,
      title: 'Results-Focused',
      description: 'We focus on outcomes that matter: revenue, growth, and ROI. Every campaign is designed to move the needle for your business.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              About <span className="italic font-normal">Elvance</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              We help brands grow through strategic marketing that delivers measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 leading-tight">
              Our <span className="italic font-normal">Mission</span>
            </h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
              Elvance was founded with a simple mission: to help businesses grow through strategic marketing that actually works. We believe marketing should be measurable, transparent, and focused on driving real business results.
            </p>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Our team combines deep marketing expertise with data-driven insights to create campaigns that deliver. Whether you're a startup looking to establish your brand or an enterprise scaling growth, we adapt our strategies to your unique needs and goals.
            </p>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              We're not just another agency—we're your marketing partners. Every campaign is designed with your business objectives in mind, ensuring that marketing becomes a growth engine rather than a cost center.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              What We <span className="italic font-normal">Believe</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 leading-tight">
            Ready to Get <span className="italic font-normal">Started</span>?
          </h2>
          <p className="text-lg text-gray-500 mb-8 font-light max-w-xl mx-auto">
            Join the brands that trust Elvance to drive their marketing success and business growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.location.href = '/auth/signup'}
              className="px-10 py-3.5 bg-gray-900 text-white text-base font-medium hover:bg-gray-800 transition-all duration-200 rounded-full shadow-sm hover:shadow-md"
            >
              Signup
            </button>
            <button className="px-10 py-3.5 bg-white text-gray-900 text-base font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-200 rounded-full shadow-sm hover:shadow-md">
              View Case Studies
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About

