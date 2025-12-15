import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Check } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Custom',
      files: 'Small Business',
      description: 'Perfect for startups and small businesses',
      features: [
        'Digital marketing strategy',
        'SEO & content marketing',
        'Social media management',
        'Monthly reporting',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: 'Custom',
      files: 'Growing Business',
      description: 'Ideal for scaling companies',
      features: [
        'Full marketing suite',
        'PPC & paid advertising',
        'Brand strategy & creative',
        'Marketing automation',
        'Priority support',
        'Advanced analytics & insights'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      files: 'Large Organizations',
      description: 'For enterprise clients',
      features: [
        'Dedicated marketing team',
        'Multi-channel campaigns',
        'Custom marketing solutions',
        '24/7 priority support',
        'Advanced analytics & insights',
        'Marketing technology stack',
        'Strategic consulting',
        'Account management'
      ]
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
              Flexible <span className="italic font-normal">Pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Custom marketing packages tailored to your business needs and growth goals.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-lg border ${
                  plan.popular
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white'
                } p-8 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-xs font-light px-4 py-1.5 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-light mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-light text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 font-light ml-2 text-sm">pricing</span>
                    </div>
                    <p className="text-xs text-gray-400 font-light mt-1">Tailored to your needs</p>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-lg font-light text-gray-900 mb-6">
                      {plan.files}
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-gray-900 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 font-light">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-12 text-center leading-tight">
            Frequently Asked <span className="italic font-normal">Questions</span>
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-light text-gray-900 mb-2">
                How is pricing determined?
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Pricing is customized based on your business needs, goals, and scope of work. We'll work with you to create a package that fits your budget and delivers maximum ROI.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-light text-gray-900 mb-2">
                What's included in each package?
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Each package includes a tailored mix of services based on your needs. We'll customize the services, reporting frequency, and support level to match your requirements.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-light text-gray-900 mb-2">
                Can I change my package later?
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Yes, you can upgrade, downgrade, or modify your package at any time. We'll adjust your services and pricing accordingly to match your evolving needs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-light text-gray-900 mb-2">
                Do you offer contracts?
              </h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                We offer flexible month-to-month agreements as well as annual contracts with discounted rates. We'll work with you to find the best arrangement for your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Pricing

