import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Folder, Search, Shield, Zap, BarChart3, Clock, Brain, Sparkles, Target, MessageSquare, TrendingUp, FileText } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: Folder,
      title: 'Digital Marketing',
      description: 'Comprehensive SEO, PPC, social media, and content marketing strategies that drive qualified traffic and measurable conversions.'
    },
    {
      icon: Search,
      title: 'Brand Strategy',
      description: 'Develop a compelling brand identity, messaging, and positioning that resonates with your target audience and drives loyalty.'
    },
    {
      icon: Shield,
      title: 'Creative Services',
      description: 'Eye-catching design, video production, and creative campaigns across all channels that capture attention and drive engagement.'
    },
    {
      icon: Zap,
      title: 'Marketing Analytics',
      description: 'Data-driven insights and performance tracking to measure ROI, optimize campaigns, and make informed marketing decisions.'
    },
    {
      icon: BarChart3,
      title: 'Growth Marketing',
      description: 'Scalable growth strategies that acquire customers efficiently, improve retention, and maximize lifetime value.'
    },
    {
      icon: Clock,
      title: 'Marketing Automation',
      description: 'Streamlined workflows and automated campaigns that nurture leads, engage customers, and scale your marketing efforts.'
    },
    {
      icon: Brain,
      title: 'AI Content Generation',
      description: 'Generate high-quality marketing copy, blog posts, and social media content in seconds using advanced AI that understands your brand voice.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered A/B Testing',
      description: 'Run thousands of campaign variations simultaneously. Our AI automatically tests and optimizes to find the highest-performing combinations.'
    },
    {
      icon: Target,
      title: 'Intelligent Audience Segmentation',
      description: 'AI analyzes customer behavior patterns to create hyper-targeted segments and deliver personalized experiences at scale across all channels.'
    },
    {
      icon: MessageSquare,
      title: 'AI Chatbots & Conversational Marketing',
      description: 'Deploy intelligent chatbots that understand context, qualify leads, book meetings, and provide 24/7 customer support while maintaining your brand voice.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics & Forecasting',
      description: 'Leverage machine learning to predict campaign performance, identify high-value audiences, and optimize your marketing spend before you invest.'
    },
    {
      icon: FileText,
      title: 'Automated Reporting & Insights',
      description: 'AI-powered reporting that automatically generates insights, identifies trends, and recommends optimizations to continuously improve your marketing performance.'
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
              Our <span className="italic font-normal">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Comprehensive marketing solutions designed to drive growth and deliver measurable results for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              All Our <span className="italic font-normal">Services</span>
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              From traditional marketing to cutting-edge AI automation, we provide everything you need to grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* AI Automation Highlight Section */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 leading-tight">
              AI-Powered <span className="italic font-normal">Automations</span>
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              Our AI automations handle repetitive tasks, optimize campaigns in real-time, and scale your marketing operations without increasing your workload.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <Brain className="w-8 h-8 text-gray-900 mb-4" />
              <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">
                Content Automation
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
                Automatically generate, optimize, and schedule content across all your marketing channels. Our AI learns your brand voice and creates content that converts.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 font-light">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Blog posts and articles</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Social media content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Email campaigns</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Ad copy variations</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <Zap className="w-8 h-8 text-gray-900 mb-4" />
              <h3 className="text-xl font-light text-gray-900 mb-3 tracking-tight">
                Campaign Automation
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
                Automatically optimize campaigns, adjust budgets, pause underperformers, and scale winners. Set it and forget it—our AI handles the rest.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 font-light">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Real-time bid optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Automatic budget allocation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Performance-based scaling</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Smart campaign pausing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 leading-tight">
            Ready to Grow Your <span className="italic font-normal">Business</span>?
          </h2>
          <p className="text-lg text-gray-500 mb-8 font-light max-w-xl mx-auto">
            Let's discuss how Elvance can help you achieve your marketing goals and drive measurable growth.
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

export default Features

