import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

/**
 * HQ Integrations Page
 */
export default async function HQIntegrationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary">Integrations</h1>
        <p className="text-secondary mt-2">Manage global integrations</p>
      </div>
      <div className="glass-surface rounded-lg shadow-prestige-soft p-8 text-center">
        <p className="text-secondary">Integrations coming soon</p>
      </div>
    </div>
  );
}

