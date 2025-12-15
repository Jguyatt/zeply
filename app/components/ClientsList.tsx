'use client';

import { useState } from 'react';
import { createClientOrg } from '@/app/actions/orgs';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface Client {
  client_org_id: string;
  created_at: string;
  orgs: {
    id: string;
    name: string;
    kind: string;
    created_at: string;
  };
}

export default function ClientsList({
  clients,
  agencyOrgId,
}: {
  clients: Client[];
  agencyOrgId: string;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createClientOrg(name, agencyOrgId);
    if (!result.error) {
      setName('');
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <h2 className="text-lg font-medium text-primary mb-4">Add New Client</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client organization name..."
            className="flex-1 px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 disabled:opacity-50 flex items-center gap-2 shadow-prestige-soft"
          >
            <Plus className="w-4 h-4" />
            Create Client
          </button>
        </form>
      </div>

      {/* Clients List */}
      <div className="glass-surface rounded-lg shadow-prestige-soft">
        {clients.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            No clients yet. Create your first client above.
          </div>
        ) : (
          <ul className="divide-y glass-border">
            {clients.map((client) => (
              <li key={client.client_org_id} className="p-6">
                <h3 className="text-lg font-medium text-primary">
                  {client.orgs.name}
                </h3>
                <p className="text-sm text-secondary mt-1">
                  Created {new Date(client.orgs.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

