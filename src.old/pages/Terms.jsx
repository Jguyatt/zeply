import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Terms of <span className="italic font-normal">Service</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray max-w-none">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Agreement to Terms</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  By accessing or using Elvance's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Use License</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                  Permission is granted to use Elvance's marketing services for your business marketing purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 font-light leading-relaxed ml-4">
                  <li>Modify or copy the software</li>
                  <li>Use the software for any commercial purpose without explicit authorization</li>
                  <li>Attempt to reverse engineer or decompile the software</li>
                  <li>Remove any copyright or proprietary notations</li>
                  <li>Transfer the software to another person or mirror the software on any other server</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">User Accounts</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Acceptable Use</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed mb-4">
                  You agree not to use Elvance's services to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 font-light leading-relaxed ml-4">
                  <li>Upload, store, or transmit any illegal, harmful, or offensive content</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the intellectual property rights of others</li>
                  <li>Transmit viruses, malware, or other harmful code</li>
                  <li>Interfere with or disrupt the service or servers</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Payment Terms</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  Subscription fees are billed in advance on a monthly basis. All fees are non-refundable except as required by law. We reserve the right to change our pricing with 30 days' notice. Failure to pay may result in suspension or termination of your account.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Service Availability</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We strive to maintain high availability of our services but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Intellectual Property</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  The service and its original content, features, and functionality are owned by Elvance and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Disclaimer</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  The service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Limitation of Liability</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  In no event shall Elvance be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Termination</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Changes to Terms</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Contact Information</h2>
                <p className="text-lg text-gray-600 font-light leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at legal@elvance.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Terms

