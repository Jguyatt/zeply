'use client';

import { CreditCard } from 'lucide-react';

interface CompactStripeButtonProps {
  workspaceId: string;
}

export default function CompactStripeButton({ workspaceId }: CompactStripeButtonProps) {
  return (
    <button
      disabled
      className="rounded-xl bg-accent/15 px-3 py-2 text-sm font-medium text-accent/60 cursor-not-allowed flex items-center gap-2"
      title="Coming soon"
    >
      <CreditCard className="w-4 h-4" />
      Stripe (Coming Soon)
    </button>
  );
}

