import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Careers = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Careers
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Join us in helping brands grow through strategic marketing.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
              We're always looking for talented marketers, strategists, and creatives to join our team. If you're passionate about driving growth and delivering results, we'd love to hear from you.
            </p>
            <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
              Currently, we don't have any open positions, but we're growing fast. Check back soon or send us your resume at careers@elvance.com.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Careers

