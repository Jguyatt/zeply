import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { Settings as SettingsIcon, User, Building2 } from 'lucide-react';

/**
 * HQ Settings Page - Profile Settings (Catch-all route for Clerk UserProfile)
 */
export default async function HQSettingsPage({
  params,
}: {
  params: Promise<{ rest?: string[] }>;
}) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/auth/signin');
    }
    
    const { rest } = await params;

    const settingsItems = [
      {
        name: 'Profile Settings',
        icon: User,
        href: '/dashboard/settings',
        section: 'profile',
        active: !rest || rest.length === 0,
      },
      {
        name: 'Organization',
        icon: Building2,
        href: '/dashboard/settings/organization',
        section: 'organization',
        active: false,
      },
    ];

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-6 h-6 text-accent" />
            <h1 className="text-3xl font-light text-text-primary">Settings</h1>
          </div>
          <p className="text-text-secondary">Manage your profile, billing, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation - Left Panel */}
          <div className="lg:col-span-1">
            <div className="glass-surface rounded-lg shadow-prestige-soft p-2">
              <nav className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.section}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        item.active
                          ? 'bg-surface-2 text-text-primary'
                          : 'text-text-secondary hover:bg-surface-1 hover:text-text-primary'
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

          {/* User Profile - Right Panel */}
          <div className="lg:col-span-3">
            <div className="glass-surface rounded-lg shadow-prestige-soft overflow-hidden">
              <UserProfile
                routing="path"
                path="/dashboard/settings"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent border-0",
                    navbar: "bg-transparent border-0 border-b border-white/10",
                    navbarButton: "text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors text-sm font-medium",
                    navbarButtonActive: "text-text-primary bg-surface-2 font-medium",
                    page: "bg-transparent",
                    headerTitle: "text-text-primary text-2xl font-light mb-1",
                    headerSubtitle: "text-text-secondary text-sm",
                    formButtonPrimary: "bg-accent/20 text-accent hover:bg-accent/30 border-0 rounded-lg shadow-prestige-soft font-medium",
                    formFieldInput: "bg-surface-1 border border-border/50 text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 rounded-lg",
                    formFieldLabel: "text-text-secondary text-sm font-medium",
                    badge: "bg-surface-2 text-text-primary border border-border/50 rounded text-xs",
                    tableHead: "text-text-secondary border-border/50 text-xs font-medium",
                    tableCell: "text-text-primary border-border/50 text-sm",
                    dividerLine: "bg-border/50",
                    alertText: "text-text-secondary text-sm",
                    identityPreview: "bg-surface-1 border border-border/50 rounded-lg",
                    identityPreviewText: "text-text-primary font-medium",
                    identityPreviewEditButton: "text-accent hover:bg-surface-1 rounded-lg text-sm",
                    formResendCodeLink: "text-accent hover:text-accent/80 text-sm",
                    footerActionLink: "text-accent hover:text-accent/80 text-sm",
                    formFieldSuccessText: "text-accent text-sm",
                    formFieldErrorText: "text-danger text-sm",
                    alertError: "bg-danger/10 border-danger/20 text-danger rounded-lg",
                    alertSuccess: "bg-accent/10 border-accent/20 text-accent rounded-lg",
                    button: "bg-surface-1 text-text-primary hover:bg-surface-2 border border-border/50 rounded-lg transition-colors text-sm font-medium",
                    buttonPrimary: "bg-accent/20 text-accent hover:bg-accent/30 border-0 rounded-lg shadow-prestige-soft font-medium",
                    buttonDanger: "bg-danger/20 text-danger hover:bg-danger/30 border-0 rounded-lg font-medium",
                    modalContent: "bg-surface-1 border border-border/50 rounded-lg",
                    modalBackdrop: "bg-black/60",
                    table: "bg-transparent",
                    tableRow: "hover:bg-surface-1 transition-colors",
                    avatarBox: "ring-2 ring-border/50",
                    selectButton: "bg-surface-1 border border-border/50 text-text-primary hover:bg-surface-2 rounded-lg text-sm",
                    selectOption: "bg-surface-1 text-text-primary hover:bg-surface-2",
                    searchInput: "bg-surface-1 border border-border/50 text-text-primary placeholder:text-text-muted rounded-lg text-sm",
                    connectedAccountButton: "bg-surface-1 border border-border/50 text-text-primary hover:bg-surface-2 rounded-lg",
                    accountSwitcherTrigger: "bg-surface-1 border border-border/50 text-text-primary hover:bg-surface-2 rounded-lg",
                    profileSection: "bg-transparent",
                    profileSectionTitle: "text-text-primary text-lg font-medium",
                    profileSectionContent: "text-text-secondary text-sm",
                  },
                  variables: {
                    colorPrimary: "#D6B36A",
                    colorText: "#E7EAF0",
                    colorTextSecondary: "#A7B0C0",
                    colorTextOnPrimaryBackground: "#0B0D10",
                    colorBackground: "transparent",
                    colorInputBackground: "rgba(255, 255, 255, 0.05)",
                    colorInputText: "#E6E8EE",
                    colorDanger: "#ef4444",
                    borderRadius: "0.5rem",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
                    fontSize: "14px",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in settings page:', error);
    redirect('/dashboard');
  }
}
