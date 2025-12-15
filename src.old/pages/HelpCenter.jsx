import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const HelpCenter = () => {
  const faqs = [
    {
      question: 'What services does Elvance offer?',
      answer: 'Elvance offers comprehensive marketing services including digital marketing, brand strategy, creative services, marketing analytics, growth marketing, and marketing automation. We tailor our services to your business needs.'
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Marketing results vary by strategy and industry. SEO and content marketing typically show results in 3-6 months, while PPC campaigns can show immediate results. We provide detailed timelines during our initial strategy session.'
    },
    {
      question: 'What industries do you work with?',
      answer: 'We work with businesses across various industries including technology, e-commerce, healthcare, finance, and professional services. Our strategies are customized to each industry\'s unique challenges and opportunities.'
    },
    {
      question: 'How do you measure marketing success?',
      answer: 'We use data-driven metrics to measure success, including ROI, conversion rates, customer acquisition cost, lifetime value, and revenue growth. You\'ll receive regular reports with transparent performance tracking.'
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
              Help <span className="italic font-normal">Center</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Find answers to common questions and get support.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-light text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HelpCenter

