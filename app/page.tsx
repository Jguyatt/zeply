import Header from './components/Header';
import Hero from './components/Hero';
import LogoBanner from './components/LogoBanner';
import Steps from './components/Steps';
import FileManagement from './components/FileManagement';
import AutomatedWorkflows from './components/AutomatedWorkflows';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  // If user is signed in, redirect them to dashboard
  // Dashboard will handle routing based on user's org memberships
  const { userId } = await auth();
  
  if (userId) {
    // Simple redirect - let dashboard handle all routing logic
    // This prevents redirect loops and simplifies the flow
      redirect('/dashboard');
  }
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-charcoal">
      {/* Full-bleed background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#151823] via-[#0B0D10] to-[#0B0D10]" />
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1E3A8A]/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[700px] -translate-y-1/2 rounded-full bg-[#4C1D95]/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[600px] rounded-full bg-[#1E40AF]/15 blur-3xl" />
      </div>

      <Header />
      <Hero />
      <LogoBanner />
      <Steps />
      <FileManagement />
      <AutomatedWorkflows />
      <CTASection />
      <Footer />
    </main>
  );
}
