import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { OrganizationProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { Settings as SettingsIcon, User, Building2 } from 'lucide-react';

/**
 * HQ Organization Settings Page
 */
export default async function HQOrganizationSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/signin');
  }

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
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-secondary hover:bg-white/5 hover:text-primary"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Profile Settings</span>
              </Link>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-primary">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium">Organization</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Organization Profile - Right Panel */}
        <div className="lg:col-span-3">
          <div className="glass-surface rounded-lg shadow-prestige-soft overflow-hidden">
            <OrganizationProfile
              routing="path"
              path="/settings/organization"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-0",
                  navbar: "bg-transparent border-0",
                  navbarButton: "text-secondary hover:text-primary hover:bg-white/5 text-sm font-medium",
                  navbarButtonActive: "text-primary bg-white/10 font-medium",
                  page: "bg-transparent",
                  headerTitle: "text-primary text-2xl font-light mb-1",
                  headerSubtitle: "text-secondary text-sm",
                  formButtonPrimary: "bg-accent/20 text-accent hover:bg-accent/30 border-0 rounded-lg shadow-prestige-soft font-medium",
                  formFieldInput: "bg-white/5 border-white/10 text-primary placeholder:text-muted focus:border-accent/50 rounded-lg text-sm",
                  formFieldLabel: "text-secondary text-sm font-medium",
                  badge: "bg-white/10 text-primary border-white/10 rounded text-xs",
                  tableHead: "text-secondary border-white/10 text-xs font-medium",
                  tableCell: "text-primary border-white/10 text-sm",
                  dividerLine: "bg-white/10",
                  alertText: "text-secondary text-sm",
                  identityPreview: "bg-white/5 border-white/10 rounded-lg",
                  identityPreviewText: "text-primary font-medium",
                  identityPreviewEditButton: "text-accent hover:bg-white/5 rounded-lg text-sm",
                  formResendCodeLink: "text-accent hover:text-accent/80 text-sm",
                  footerActionLink: "text-accent hover:text-accent/80 text-sm",
                  formFieldSuccessText: "text-accent text-sm",
                  formFieldErrorText: "text-red-400 text-sm",
                  alertError: "bg-red-400/10 border-red-400/20 text-red-400 rounded-lg",
                  alertSuccess: "bg-accent/10 border-accent/20 text-accent rounded-lg",
                  button: "bg-white/5 text-primary hover:bg-white/10 border-white/10 rounded-lg transition-colors text-sm font-medium",
                  buttonPrimary: "bg-accent/20 text-accent hover:bg-accent/30 border-0 rounded-lg shadow-prestige-soft font-medium",
                  buttonDanger: "bg-red-400/20 text-red-400 hover:bg-red-400/30 border-0 rounded-lg font-medium",
                  modalContent: "bg-charcoal-flat border-white/10 rounded-lg",
                  modalBackdrop: "bg-black/60",
                  table: "bg-transparent",
                  tableRow: "hover:bg-white/5 transition-colors",
                  avatarBox: "ring-2 ring-white/10",
                  selectButton: "bg-white/5 border-white/10 text-primary hover:bg-white/10 rounded-lg text-sm",
                  selectOption: "bg-charcoal-flat text-primary hover:bg-white/10",
                  searchInput: "bg-white/5 border-white/10 text-primary placeholder:text-muted rounded-lg text-sm",
                },
                variables: {
                  colorPrimary: "#C7CCD6",
                  colorText: "#E6E8EE",
                  colorTextSecondary: "#A1A6B3",
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
}

