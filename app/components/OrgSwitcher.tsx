'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { switchActiveOrg, getUserOrgs } from '@/app/actions/orgs';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Org {
  org_id: string;
  role: string;
  orgs: {
    id: string;
    name: string;
    kind: 'agency' | 'client';
  };
}

export default function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadOrgs();
    }
  }, [user]);

  const loadOrgs = async () => {
    if (!user?.id) return;

    // Get active org from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('active_org_id')
      .eq('user_id', user.id)
      .single();

    setActiveOrgId(profile?.active_org_id || null);

    // Get all user orgs
    const result = await getUserOrgs();
    if (result.data) {
      setOrgs(result.data as Org[]);
      // Set first org as active if none set
      if (!profile?.active_org_id && result.data.length > 0) {
        const firstOrg = result.data[0] as Org;
        setActiveOrgId(firstOrg.org_id);
        await switchActiveOrg(firstOrg.org_id);
      }
    }
    setLoading(false);
  };

  const handleSwitchOrg = async (orgId: string) => {
    const result = await switchActiveOrg(orgId);
    if (!result.error) {
      setActiveOrgId(orgId);
      setIsOpen(false);
      router.refresh();
    }
  };

  const activeOrg = orgs.find((o) => o.org_id === activeOrgId);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (orgs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        <span>{activeOrg?.orgs.name || 'Select org'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              {orgs.map((org) => (
                <button
                  key={org.org_id}
                  onClick={() => handleSwitchOrg(org.org_id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    org.org_id === activeOrgId
                      ? 'bg-gray-100 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{org.orgs.name}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {org.orgs.kind}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 capitalize">
                    {org.role}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
