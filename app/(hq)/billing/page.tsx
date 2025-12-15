import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

/**
 * HQ Billing Page
 */
export default async function HQBillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary">Billing & Usage</h1>
        <p className="text-secondary mt-2">Manage billing across all clients</p>
      </div>
      <div className="glass-surface rounded-lg shadow-prestige-soft p-8 text-center">
        <p className="text-secondary">Billing dashboard coming soon</p>
      </div>
    </div>
  );
}

