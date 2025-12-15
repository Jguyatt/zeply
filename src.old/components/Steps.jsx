import React from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const Steps = () => {
  const [sectionRef, isVisible] = useScrollAnimation()
  const [titleRef, titleVisible] = useScrollAnimation()

  const steps = [
    {
      number: '1',
      title: 'Download',
      description: 'Get the desktop app for Mac or Windows'
    },
    {
      number: '2',
      title: 'Install',
      description: 'Install and launch the application'
    },
    {
      number: '3',
      title: 'Organize',
      description: 'Run it once and get your files organized'
    }
  ]

  return (
    <section ref={sectionRef} className={`py-24 bg-white border-b border-gray-100 ${isVisible ? 'scroll-fade-in' : ''}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-center mb-16 ${titleVisible ? 'scroll-fade-in' : ''}`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
            Get Started <span className="italic font-normal">in Minutes</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-center gap-12 md:gap-16 lg:gap-20">
          {steps.map((step, index) => {
            const [stepRef, stepVisible] = useScrollAnimation()
            return (
              <div 
                key={index} 
                ref={stepRef}
                className={`flex flex-col items-center text-center max-w-[220px] ${stepVisible ? `scroll-fade-in-delay${index > 0 ? `-${index}` : ''}` : ''}`}
              >
                <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center mb-6 text-xl font-medium">
                  {step.number}
                </div>
                <h3 className="text-lg font-light text-gray-900 mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Steps

