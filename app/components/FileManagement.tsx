'use client';

import { useState } from 'react';
import { Search, BarChart3, TrendingUp, Users, DollarSign, Target, Zap, Mail, Megaphone, FileText, Calendar } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function FileManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionRef, isVisible] = useScrollAnimation();
  const [titleRef, titleVisible] = useScrollAnimation();

  const marketingChannels = [
    { name: 'SEO Campaigns', icon: Search, count: 24, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { name: 'PPC Ads', icon: Megaphone, count: 18, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { name: 'Social Media', icon: Users, count: 12, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  ];

  const campaigns = [
    { name: 'Q1 Brand Awareness Campaign', type: 'Campaign', status: 'Active', date: 'Jan 15, 2024', icon: Target, metric: '+32% engagement' },
    { name: 'Product Launch Email Series', type: 'Email', status: 'Active', date: 'Jan 14, 2024', icon: Mail, metric: '2.4% CTR' },
    { name: 'Social Media Content Calendar', type: 'Content', status: 'Scheduled', date: 'Jan 13, 2024', icon: Calendar, metric: '45 posts' },
    { name: 'Google Ads Performance Report', type: 'Report', status: 'Completed', date: 'Jan 12, 2024', icon: BarChart3, metric: '$12.3K revenue' },
    { name: 'Website Optimization Plan', type: 'Strategy', status: 'In Review', date: 'Jan 11, 2024', icon: Zap, metric: '+18% conversions' },
    { name: 'Brand Guidelines Document', type: 'Document', status: 'Published', date: 'Jan 10, 2024', icon: FileText, metric: 'Updated' },
  ];

  const metrics = [
    { label: 'Website Traffic', value: '45.2K', change: '+24%', icon: TrendingUp },
    { label: 'Lead Generation', value: '1,247', change: '+18%', icon: Users },
    { label: 'Revenue', value: '$124K', change: '+32%', icon: DollarSign },
    { label: 'Conversion Rate', value: '3.8%', change: '+12%', icon: Target },
  ];

  return (
    <section ref={sectionRef as any} className={`py-20 glass-border-b ${isVisible ? 'scroll-fade-in' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={titleRef as any} className={`mb-10 text-center ${titleVisible ? 'scroll-fade-in' : ''}`}>
          <h2 className="text-4xl font-light text-primary mb-3 tracking-tight">Your Marketing Dashboard</h2>
          <p className="text-lg text-secondary font-light mb-6 max-w-3xl mx-auto">
            See how Elvance transforms your marketing operations with a unified dashboard that brings all your campaigns, metrics, and insights together.
          </p>
        </div>

        {/* Computer Screen Frame */}
        <div className="relative mx-auto max-w-6xl">
          {/* Screen Bezel */}
          <div className="bg-gray-900 rounded-t-2xl p-4 shadow-2xl">
            {/* Screen Top Bar */}
            <div className="bg-gray-950 rounded-t-lg px-4 py-2 flex items-center space-x-2 glass-border-b">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center flex items-center justify-center">
                <span className="text-xs text-secondary font-light">Elvance - Marketing Dashboard</span>
              </div>
            </div>
            
            {/* Screen Content - Dark Mode Marketing Dashboard */}
            <div className="bg-charcoal rounded-b-lg min-h-[600px] flex flex-col">
              {/* Toolbar */}
              <div className="glass-border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-primary">Dashboard</span>
                  <span className="text-sm text-secondary/50">|</span>
                  <span className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer">Campaigns</span>
                  <span className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer">Analytics</span>
                  <span className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer">Reports</span>
                </div>
                <div className="flex-1 max-w-md ml-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="text"
                      placeholder="Search campaigns, reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm glass-surface text-primary placeholder:text-secondary/50 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 p-6 overflow-auto bg-charcoal">
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="glass-surface rounded-lg shadow-prestige-soft p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="w-5 h-5 text-accent" />
                          <span className="text-xs font-medium text-accent">{metric.change}</span>
                        </div>
                        <div className="text-2xl font-semibold text-primary mb-1">{metric.value}</div>
                        <div className="text-xs text-secondary font-light">{metric.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Marketing Channels */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-primary mb-3">Marketing Channels</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {marketingChannels.map((channel, index) => {
                      const Icon = channel.icon;
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center p-4 rounded-lg glass-surface border border-white/10 shadow-prestige-soft"
                        >
                          <div className="w-12 h-12 glass-surface rounded-lg flex items-center justify-center mb-3 border border-white/10">
                            <Icon className="w-6 h-6 text-accent" />
                          </div>
                          <span className="text-sm font-medium text-primary mb-1">{channel.name}</span>
                          <span className="text-xs text-secondary">{channel.count} active</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Campaigns */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Recent Campaigns & Activities</h3>
                  <div className="space-y-2">
                    {campaigns.map((campaign, index) => {
                      const Icon = campaign.icon;
                      const statusColors: Record<string, string> = {
                        'Active': 'bg-green-500/20 text-green-400 border-green-500/30',
                        'Scheduled': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                        'Completed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                        'In Review': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                        'Published': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                      };
                      return (
                        <div
                          key={index}
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg glass-surface border border-white/10 hover:border-white/20 hover:shadow-prestige-soft transition-all"
                        >
                          <div className="w-10 h-10 glass-surface rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-sm font-medium text-primary truncate">{campaign.name}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[campaign.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {campaign.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-secondary">
                              <span>{campaign.type}</span>
                              <span>•</span>
                              <span>{campaign.date}</span>
                              <span>•</span>
                              <span className="text-accent font-medium">{campaign.metric}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Screen Stand/Base */}
          <div className="flex justify-center">
            <div className="w-32 h-2 bg-gray-700 rounded-b-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

