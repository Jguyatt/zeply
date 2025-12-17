'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StripeConnectButtonProps {
  workspaceId: string;
  isAgency: boolean;
}

export default function StripeConnectButton({ workspaceId, isAgency }: StripeConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  useEffect(() => {
    checkStripeConnection();
  }, [workspaceId]);

  const checkStripeConnection = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (data && !error) {
      setIsConnected(true);
      setStripeAccountId((data as any).stripe_account_id);
    } else {
      setIsConnected(false);
    }
    setIsLoading(false);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    const appUrl = window.location.origin;
    window.location.href = `${appUrl}/api/stripe/connect/authorize?workspace_id=${workspaceId}`;
  };

  // Show for any workspace (removed agency-only restriction)

  if (isLoading) {
    return (
      <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
          <span className="text-secondary">Checking Stripe connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-primary mb-1">Stripe Integration</h3>
          <p className="text-sm text-secondary">
            Connect your Stripe account to track revenue and invoices automatically
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <CreditCard className="w-4 h-4" />
            <span>Stripe Account: {stripeAccountId?.substring(0, 20)}...</span>
          </div>
          <p className="text-xs text-muted">
            Your Stripe account is connected. Invoices will be automatically synced via webhooks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Connect your Stripe account to enable automatic revenue tracking and invoice synchronization.
            This uses Stripe Connect Standard for secure OAuth integration.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full px-4 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30 flex items-center justify-center gap-2 font-medium"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Connect Stripe Account
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

