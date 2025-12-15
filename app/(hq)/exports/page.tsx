import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

/**
 * HQ Exports Page
 */
export default async function HQExportsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary">Exports</h1>
        <p className="text-secondary mt-2">Export data across all clients</p>
      </div>
      <div className="glass-surface rounded-lg shadow-prestige-soft p-8 text-center">
        <p className="text-secondary">Export functionality coming soon</p>
      </div>
    </div>
  );
}

