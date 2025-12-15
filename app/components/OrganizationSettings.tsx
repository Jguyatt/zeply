'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Settings as SettingsIcon, Building2, Users, UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';

interface OrganizationSettingsProps {
  org: any;
  membership: any;
  members: any[];
  userId: string;
}

export default function OrganizationSettings({
  org,
  membership,
  members,
  userId,
}: OrganizationSettingsProps) {
  const [orgName, setOrgName] = useState(org?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdateOrgName = async () => {
    if (!orgName.trim()) {
      setError('Organization name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('orgs')
        .update({ name: orgName.trim() })
        .eq('id', org.id);

      if (updateError) {
        setError('Failed to update organization name');
      } else {
        setIsEditing(false);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setInviting(true);
    setError(null);

    try {
      // TODO: Implement actual invitation logic
      // For now, just show a message
      setError('Invitation feature coming soon. For now, users can be added directly to the organization.');
      setInviteEmail('');
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-accent" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-accent" />;
      default:
        return <User className="w-4 h-4 text-muted" />;
    }
  };

  const canEdit = membership?.role === 'owner' || membership?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-light text-primary">Settings</h1>
        </div>
        <p className="text-secondary">Manage your profile, billing, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation - Left Panel */}
        <div className="lg:col-span-1">
          <div className="glass-surface rounded-lg shadow-prestige-soft p-2">
            <nav className="space-y-1">
              {[
                { name: 'Profile Settings', icon: User, href: '/dashboard/settings' },
                { name: 'Organization', icon: Building2, href: '/dashboard/settings/organization', active: true },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      item.active
                        ? 'bg-white/10 text-primary'
                        : 'text-secondary hover:bg-white/5 hover:text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Organization Settings Content - Right Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Organization Name */}
          <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <h2 className="text-lg font-medium text-primary mb-4">Organization</h2>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
                placeholder="Enter organization name"
              />
            </div>
            {error && (
              <div className="text-sm text-red-400">{error}</div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdateOrgName}
                disabled={loading}
                className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all shadow-prestige-soft disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setOrgName(org?.name || '');
                  setError(null);
                }}
                className="px-4 py-2 text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-medium text-primary mb-2">
                {org?.name || 'Unnamed Organization'}
              </div>
              <div className="text-sm text-secondary">
                ID: {org?.id} • {org?.name?.toLowerCase().replace(/\s+/g, '-')}-{org?.id?.slice(-10)}
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 glass-surface text-accent rounded-lg hover:bg-white/10 transition-all shadow-prestige-soft"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <h2 className="text-lg font-medium text-primary mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-secondary mb-1">Type</div>
            <div className="text-base font-medium text-primary capitalize">{org?.kind || 'agency'}</div>
          </div>
          <div>
            <div className="text-sm text-secondary mb-1">Your Role</div>
            <div className="text-base font-medium text-primary capitalize flex items-center gap-2">
              {getRoleIcon(membership?.role || 'member')}
              {membership?.role || 'member'}
            </div>
          </div>
          <div>
            <div className="text-sm text-secondary mb-1">Members</div>
            <div className="text-base font-medium text-primary">{members.length}</div>
          </div>
          <div>
            <div className="text-sm text-secondary mb-1">Created</div>
            <div className="text-base font-medium text-primary">
              {org?.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="glass-surface rounded-lg shadow-prestige-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members
          </h2>
          {canEdit && (
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email to invite"
                className="px-4 py-2 glass-surface rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleInviteMember();
                  }
                }}
              />
              <button
                onClick={handleInviteMember}
                disabled={inviting}
                className="px-4 py-2 glass-surface text-accent rounded-lg hover:bg-white/10 transition-all shadow-prestige-soft flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {members.map((member: any) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-3 glass-surface rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 glass-surface rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-primary">
                    {member.user_profiles?.full_name || 'Unknown User'}
                  </div>
                  <div className="text-xs text-secondary">
                    {member.user_id === userId ? 'You' : member.user_id}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <span className="text-sm text-secondary capitalize">{member.role}</span>
                </div>
                {canEdit && member.user_id !== userId && (
                  <button
                    className="p-2 text-muted hover:text-red-400 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}

