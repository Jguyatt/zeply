import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AutomatedWorkflows from '../components/AutomatedWorkflows'

const Workflows = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Automated <span className="italic font-normal">Workflows</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Streamline your file management with intelligent automation.
            </p>
          </div>
        </div>
      </section>

      <AutomatedWorkflows />

      <Footer />
    </div>
  )
}

export default Workflows

