import React from 'react'

const StatsCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <div className="bg-white p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 rounded-lg">
      <div className="flex items-start justify-between mb-5">
        <div className="p-3 bg-gray-50 rounded-lg">
          {Icon && <Icon className="w-5 h-5 text-gray-700" />}
        </div>
      </div>
      <div className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">{value}</div>
      <div className="text-sm font-semibold text-gray-800 mb-1">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

export default StatsCard

