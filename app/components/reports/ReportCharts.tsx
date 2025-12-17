'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricDataPoint {
  period: string;
  leads?: number;
  spend?: number;
  revenue?: number;
  roas?: number;
  conversions?: number;
}

interface ReportChartsProps {
  metrics: MetricDataPoint[];
  chartType?: 'line' | 'bar';
  metricsToShow?: Array<'leads' | 'spend' | 'revenue' | 'roas' | 'conversions'>;
}

export default function ReportCharts({
  metrics,
  chartType = 'line',
  metricsToShow = ['leads', 'spend', 'revenue'],
}: ReportChartsProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-8 text-center glass-subtle rounded-lg border border-white/10">
        <p className="text-sm text-secondary">No metrics data available for visualization</p>
      </div>
    );
  }

  const colors = {
    leads: '#4C8DFF',
    spend: '#FF6B6B',
    revenue: '#51CF66',
    roas: '#FFD93D',
    conversions: '#A78BFA',
  };

  if (chartType === 'bar') {
    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="period" 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend 
              wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            {metricsToShow.includes('leads') && (
              <Bar dataKey="leads" fill={colors.leads} name="Leads" />
            )}
            {metricsToShow.includes('spend') && (
              <Bar dataKey="spend" fill={colors.spend} name="Spend" />
            )}
            {metricsToShow.includes('revenue') && (
              <Bar dataKey="revenue" fill={colors.revenue} name="Revenue" />
            )}
            {metricsToShow.includes('conversions') && (
              <Bar dataKey="conversions" fill={colors.conversions} name="Conversions" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="period" 
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.6)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 25, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend 
            wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
          />
          {metricsToShow.includes('leads') && (
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke={colors.leads} 
              name="Leads"
              strokeWidth={2}
              dot={{ fill: colors.leads, r: 4 }}
            />
          )}
          {metricsToShow.includes('spend') && (
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke={colors.spend} 
              name="Spend"
              strokeWidth={2}
              dot={{ fill: colors.spend, r: 4 }}
            />
          )}
          {metricsToShow.includes('revenue') && (
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.revenue} 
              name="Revenue"
              strokeWidth={2}
              dot={{ fill: colors.revenue, r: 4 }}
            />
          )}
          {metricsToShow.includes('roas') && (
            <Line 
              type="monotone" 
              dataKey="roas" 
              stroke={colors.roas} 
              name="ROAS"
              strokeWidth={2}
              dot={{ fill: colors.roas, r: 4 }}
            />
          )}
          {metricsToShow.includes('conversions') && (
            <Line 
              type="monotone" 
              dataKey="conversions" 
              stroke={colors.conversions} 
              name="Conversions"
              strokeWidth={2}
              dot={{ fill: colors.conversions, r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

