import Header from './components/Header';
import Hero from './components/Hero';
import LogoBanner from './components/LogoBanner';
import FeaturesSection from './components/FeaturesSection';
import NoLoginSection from './components/NoLoginSection';
import ImpactSection from './components/ImpactSection';
import FAQ from './components/FAQ';
import BottomCTA from './components/BottomCTA';
import Footer from './components/Footer';
import SectionDivider from './components/SectionDivider';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { handleLoginRedirect } from '@/app/lib/routing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elvance - Marketing Operations Platform for Modern Agencies',
  description: 'Manage deliverables, automate workflows, track performance, and delight clients. Everything you need to run a modern marketing agency in one powerful platform.',
  keywords: 'marketing agency platform, client portal, marketing operations, workflow automation, agency management, client dashboard, marketing deliverables, agency software',
  openGraph: {
    title: 'Elvance - Run Your Agency with Confidence',
    description: 'Manage deliverables, automate workflows, track performance, and delight clients—all in one powerful platform.',
    type: 'website',
    url: 'https://elvance.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elvance - Marketing Operations Platform',
    description: 'Everything you need to run a modern marketing agency in one platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    // Handle multi-workspace routing
    await handleLoginRedirect();
    return null; // handleLoginRedirect will redirect
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Vertical guide lines with one inch margin (not on hero, hidden on mobile) */}
      <div className="hidden lg:block fixed left-24 top-0 bottom-0 w-[0.5px] bg-white/20 z-0"></div>
      <div className="hidden lg:block fixed right-24 top-0 bottom-0 w-[0.5px] bg-white/20 z-0"></div>

      <main>
        <Header />
        <Hero />
        <LogoBanner />
        <SectionDivider />
        <NoLoginSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <ImpactSection />
        <SectionDivider />
        <FAQ />
        <SectionDivider />
        <BottomCTA />
      </main>

      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Elvance',
            description: 'Marketing operations platform for modern agencies. Manage deliverables, automate workflows, track performance, and delight clients.',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
            url: 'https://elvance.com',
            featureList: 'Deliverable Management, Workflow Automation, Client Portals, Real-time Analytics, Performance Tracking, AI-Powered Services',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '127',
            },
            creator: {
              '@type': 'Organization',
              name: 'Elvance',
              url: 'https://elvance.com',
            },
          }),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is Elvance?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Elvance is a comprehensive marketing operations platform that helps agencies manage deliverables, automate workflows, track performance metrics, and provide beautiful client portals. Everything you need to run a modern marketing agency in one place.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does client portal work?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Each client gets a beautiful, read-only dashboard where they can see deliverables, updates, KPIs, and reports. You control what they see and when. It\'s designed to be premium, minimal, and easy to understand—clients can grasp everything in under 10 seconds.',
                },
              },
              {
                '@type': 'Question',
                name: 'What services can I manage?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Elvance supports core services like Paid Ads, SEO, Web Development, Content, and CRM/Automation. We also support AI-powered services including AI Receptionist, AI Chatbot, AI Lead Generation, AI Follow-Up Automation, and AI Ad Creative generation.',
                },
              },
            ],
          }),
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Elvance',
            url: 'https://elvance.com',
            description: 'Marketing operations platform for modern agencies. Manage deliverables, automate workflows, and delight clients.',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'support@elvance.com',
            },
          }),
        }}
      />
    </div>
  );
}
