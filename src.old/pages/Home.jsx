import React from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import LogoBanner from '../components/LogoBanner'
import Steps from '../components/Steps'
import FileManagement from '../components/FileManagement'
import AutomatedWorkflows from '../components/AutomatedWorkflows'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <LogoBanner />
      <Steps />
      <FileManagement />
      <AutomatedWorkflows />
      <Footer />
    </div>
  )
}

export default Home

