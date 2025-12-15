'use client';

import { useState } from 'react';
import { createContract, deleteContract } from '@/app/actions/contracts';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  created_at: string;
}

export default function ContractsList({
  contracts,
  orgId,
  isAdmin = true,
}: {
  contracts: Contract[];
  orgId: string;
  isAdmin?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const result = await createContract(orgId, title);
    if (!result.error) {
      setTitle('');
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    const result = await deleteContract(contractId);
    if (!result.error) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Form - Only for Admins */}
      {isAdmin && (
        <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title..."
            className="flex-1 px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 disabled:opacity-50 flex items-center gap-2 shadow-prestige-soft"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="glass-surface rounded-lg shadow-prestige-soft">
        {contracts.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            {isAdmin ? 'No projects yet. Create your first project above.' : 'No projects yet.'}
          </div>
        ) : (
          <ul className="divide-y glass-border">
            {contracts.map((contract) => (
              <li key={contract.id} className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-primary">
                    {contract.title}
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    Created {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

