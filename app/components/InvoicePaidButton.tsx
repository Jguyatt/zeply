'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InvoicePaidButtonProps {
  nodeId: string;
  clerkOrgId: string;
}

export default function InvoicePaidButton({ nodeId, clerkOrgId }: InvoicePaidButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          status: 'completed',
        }),
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        console.error('Failed to mark invoice as paid');
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMarkAsPaid}
      disabled={loading}
      className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 text-sm font-medium rounded-lg transition-all duration-200 border border-white/10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {loading ? 'Processing...' : "I've Paid"}
    </button>
  );
}
