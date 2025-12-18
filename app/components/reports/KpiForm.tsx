'use client';

import { useState, useEffect } from 'react';

interface KpiFormProps {
  data: {
    leads: number;
    spend?: number;
    revenue?: number;
    notes?: string;
  };
  onChange: (data: {
    leads: number;
    spend?: number;
    revenue?: number;
    notes?: string;
  }) => void;
}

export default function KpiForm({ data, onChange }: KpiFormProps) {
  const [leads, setLeads] = useState(data.leads.toString());
  const [spend, setSpend] = useState(data.spend?.toString() || '');
  const [revenue, setRevenue] = useState(data.revenue?.toString() || '');
  const [notes, setNotes] = useState(data.notes || '');

  useEffect(() => {
    onChange({
      leads: parseInt(leads) || 0,
      spend: spend ? parseFloat(spend) : undefined,
      revenue: revenue ? parseFloat(revenue) : undefined,
      notes: notes || undefined,
    });
  }, [leads, spend, revenue, notes]);

  const spendNum = spend ? parseFloat(spend) : 0;
  const leadsNum = parseInt(leads) || 0;
  const revenueNum = revenue ? parseFloat(revenue) : 0;
  
  const cpl = spendNum > 0 && leadsNum > 0 
    ? (spendNum / leadsNum).toFixed(2)
    : null;
  const roas = spendNum > 0 && revenueNum > 0
    ? (revenueNum / spendNum).toFixed(2)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Leads <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          value={leads}
          onChange={(e) => setLeads(e.target.value)}
          className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Spend (optional)
        </label>
        <input
          type="number"
          step="0.01"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Revenue (optional)
        </label>
        <input
          type="number"
          step="0.01"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 glass-subtle border border-white/10 rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/50 resize-none"
          placeholder="Additional notes..."
        />
      </div>

      {/* Preview Calculations */}
      {(cpl || roas) && (
        <div className="p-3 rounded-lg glass-subtle border border-white/10">
          <div className="text-xs font-medium text-secondary mb-2">Calculated Metrics:</div>
          <div className="space-y-1 text-sm">
            {cpl && (
              <div className="text-primary">
                CPL: <span className="text-[#4C8DFF]">${cpl}</span>
              </div>
            )}
            {roas && (
              <div className="text-primary">
                ROAS: <span className="text-[#4C8DFF]">{roas}x</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

