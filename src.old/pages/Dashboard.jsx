import React from 'react'
import Header from '../components/Header'
import FileManagement from '../components/FileManagement'
import AutomatedWorkflows from '../components/AutomatedWorkflows'
import Footer from '../components/Footer'

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-8 pb-16">
        <FileManagement />
        <AutomatedWorkflows />
      </div>
      <Footer />
    </div>
  )
}

export default Dashboard

