import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Contact = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Contact <span className="italic font-normal">Us</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Let's discuss how we can help grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-6 tracking-tight">Get in Touch</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Email</p>
                  <p className="text-lg text-gray-900 font-light">support@elvance.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">Sales</p>
                  <p className="text-lg text-gray-900 font-light">sales@elvance.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-light mb-1">General Inquiries</p>
                  <p className="text-lg text-gray-900 font-light">hello@elvance.com</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-6 tracking-tight">Response Time</h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                We typically respond within 24 hours during business days. For urgent matters, please mention it in your email subject line.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Contact

