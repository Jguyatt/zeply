import React from 'react'
import { Upload, Zap, FolderKanban, ArrowRight } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const AutomatedWorkflows = () => {
  const [sectionRef, isVisible] = useScrollAnimation()
  const [titleRef, titleVisible] = useScrollAnimation()

  return (
    <section ref={sectionRef} className={`py-20 bg-white border-t border-gray-200 ${isVisible ? 'scroll-fade-in' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-center mb-16 ${titleVisible ? 'scroll-fade-in' : ''}`}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            AUTOMATED WORKFLOWS
          </h2>
          <h3 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-5 tracking-tight">
            Streamline File Management
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Organizes your files into folders, detects duplicates, and cleans up your storage. One-time cleanup that gets everything organized—no manual sorting needed.
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
          {/* Step 1 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center mb-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <Upload className="w-10 h-10 text-gray-700" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Select Folders</h4>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Choose which folders you want to organize
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:block">
            <ArrowRight className="w-7 h-7 text-gray-300" />
          </div>
          <div className="md:hidden">
            <ArrowRight className="w-7 h-7 text-gray-300 rotate-90" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center mb-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <Zap className="w-10 h-10 text-gray-700" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Organize Files</h4>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Files are sorted into organized folders automatically
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:block">
            <ArrowRight className="w-7 h-7 text-gray-300" />
          </div>
          <div className="md:hidden">
            <ArrowRight className="w-7 h-7 text-gray-300 rotate-90" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center max-w-[240px]">
            <div className="w-20 h-20 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center mb-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <FolderKanban className="w-10 h-10 text-gray-700" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Clean & Done</h4>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Duplicates found, storage optimized, and you're done
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AutomatedWorkflows

