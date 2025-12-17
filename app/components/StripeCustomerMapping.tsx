'use client';

import { useState } from 'react';
import { CreditCard, Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StripeCustomerMappingProps {
  workspaceId: string;
  clientId: string;
  clientName: string;
  initialExternalBillingRef?: string;
}

export default function StripeCustomerMapping({
  workspaceId,
  clientId,
  clientName,
  initialExternalBillingRef = '',
}: StripeCustomerMappingProps) {
  const [externalBillingRef, setExternalBillingRef] = useState(initialExternalBillingRef);
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSaveExternalRef = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('orgs')
      .update({ external_billing_ref: externalBillingRef || null })
      .eq('id', clientId);

    if (updateError) {
      setError('Failed to save external billing reference');
    } else {
      setSuccess('External billing reference saved');
    }

    setIsSaving(false);
  };

  const handleSaveMapping = async () => {
    if (!stripeCustomerId.trim()) {
      setError('Stripe Customer ID is required');
      return;
    }

    setIsSavingMapping(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('stripe_customer_mappings')
      .upsert({
        workspace_id: workspaceId,
        stripe_customer_id: stripeCustomerId.trim(),
        client_id: clientId,
      }, {
        onConflict: 'workspace_id,stripe_customer_id',
      });

    if (insertError) {
      setError('Failed to save customer mapping');
    } else {
      setSuccess('Stripe customer mapped successfully');
      setStripeCustomerId('');
    }

    setIsSavingMapping(false);
  };

  return (
    <div className="glass-surface rounded-lg shadow-prestige-soft p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-primary mb-1">Stripe Billing Configuration</h3>
        <p className="text-sm text-secondary">
          Configure how invoices for <span className="text-primary font-medium">{clientName}</span> are attributed
        </p>
      </div>

      {/* External Billing Reference */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary">
          External Billing Reference
        </label>
        <p className="text-xs text-muted mb-2">
          Optional reference ID used when creating invoices in Stripe. Set this in invoice metadata as <code className="bg-white/5 px-1 rounded">metadata.client_id</code>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={externalBillingRef}
            onChange={(e) => setExternalBillingRef(e.target.value)}
            placeholder="e.g., CLIENT-001"
            className="flex-1 px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
          <button
            onClick={handleSaveExternalRef}
            disabled={isSaving || externalBillingRef === initialExternalBillingRef}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* Stripe Customer Mapping */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary">
          Map Existing Stripe Customer
        </label>
        <p className="text-xs text-muted mb-2">
          If you already have invoices in Stripe for this client, map the Stripe Customer ID to this client for automatic attribution
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={stripeCustomerId}
            onChange={(e) => setStripeCustomerId(e.target.value)}
            placeholder="cus_xxxxxxxxxxxxx"
            className="flex-1 px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
          <button
            onClick={handleSaveMapping}
            disabled={isSavingMapping || !stripeCustomerId.trim()}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30 flex items-center gap-2"
          >
            {isSavingMapping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Map
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="px-4 py-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-accent/10 border border-accent/20 text-accent rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Help Text */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-muted">
          <strong className="text-secondary">Tip:</strong> When creating new invoices in Stripe, include these metadata fields:
        </p>
        <div className="mt-2 space-y-1 font-mono text-xs text-muted bg-white/5 p-3 rounded">
          <div>metadata.client_id = {clientId}</div>
          <div>metadata.workspace_id = {workspaceId}</div>
        </div>
      </div>
    </div>
  );
}

