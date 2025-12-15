import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Blog = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Tips, insights, and updates on file management.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg text-gray-500 font-light">
              Coming soon. Check back for articles on file management best practices, productivity tips, and product updates.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Blog

