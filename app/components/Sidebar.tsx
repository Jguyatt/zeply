'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk, OrganizationSwitcher, useOrganization } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  LogOut,
  TrendingUp,
  CreditCard,
  Plug,
  MessageSquare,
} from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('member');
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const supabase = createClient();
  
  // Check if we're in preview mode (via ?mode=client query param)
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  useEffect(() => {
    // Check URL for preview mode
    const params = new URLSearchParams(window.location.search);
    setIsPreviewMode(params.get('mode') === 'client');
  }, [pathname]);

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user, organization]);

  const loadUserRole = async () => {
    if (!user?.id) return;

    // ENFORCE: Check if user is an admin in ANY org (not just current org)
    // If they're an admin anywhere, they should always see admin UI
    const { data: allMemberships } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin']);

    // If user is an admin in any org, they're an admin globally
    if (allMemberships && allMemberships.length > 0) {
      // User is an admin globally - ALWAYS treat them as admin
      // Check their role in current org for display purposes, but ensure isAdmin is always true
      if (organization?.id) {
        const { data: org } = await supabase
          .from('orgs')
          .select('id')
          .eq('clerk_org_id', organization.id)
          .maybeSingle();
        
        if (org) {
          const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', (org as any).id)
            .eq('user_id', user.id)
            .maybeSingle();
          // If they're an admin in current org, use that role; otherwise default to 'admin'
          const currentRole = (membership as any)?.role;
          setUserRole((currentRole === 'owner' || currentRole === 'admin') ? currentRole : 'admin');
          return;
        }
      }
      // Admin but no current org - set to admin
      setUserRole('admin');
      return;
    }

    // User is NOT an admin in any org - they're a member
    // Check their role in the current org (if any)
    if (organization?.id) {
      const { data: org } = await supabase
        .from('orgs')
        .select('id')
        .eq('clerk_org_id', organization.id)
        .maybeSingle();
      
      if (org) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', (org as any).id)
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole((membership as any)?.role || 'member');
        return;
      }
    }

    // Fallback: Get active org from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('active_org_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error loading user profile:', profileError);
    }

    const activeOrgIdFromProfile = (profile as any)?.active_org_id || null;

    // Get user role in active org
    if (activeOrgIdFromProfile) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', activeOrgIdFromProfile)
        .eq('user_id', user.id)
        .maybeSingle();
      setUserRole((membership as any)?.role || 'member');
    } else {
      // No active org, default to member
      setUserRole('member');
    }
  };

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  // Determine if we're in workspace mode (has org selected via Clerk)
  const orgId = organization?.id || null;
  const isWorkspace = !!orgId;
  
  // ENFORCE: Admins ALWAYS see admin UI, Members ALWAYS see member UI
  // - If user is admin/owner: ALWAYS show agency/admin view (never client view, even in preview)
  // - If user is member: ALWAYS show client view
  const isClientView = isWorkspace && userRole === 'member' && !isAdmin;
  
  // Get org name for client view
  const [orgName, setOrgName] = useState<string>('');
  
  useEffect(() => {
    if (isClientView && orgId) {
      // Fetch org name from Supabase
      const fetchOrgName = async () => {
        const { data } = await supabase
          .from('orgs')
          .select('name')
          .eq('clerk_org_id', orgId)
          .maybeSingle();
        if (data) {
          setOrgName((data as any).name || 'Organization');
        }
      };
      fetchOrgName();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientView, orgId]);

  // HQ Navigation (when no org selected) - Core section (HQ Dashboard is above org selector, so not here)
  const hqCoreItems = [
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
      adminOnly: true,
    },
  ].filter(item => !item.adminOnly || isAdmin);

  // HQ Navigation - Operations section
  const hqOpsItems = [
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCard,
      adminOnly: true,
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: Plug,
      adminOnly: true,
    },
  ].filter(item => !item.adminOnly || isAdmin);

  
  // Workspace Navigation (when org selected)
  // Client view: Only Overview, Deliverables, Reports, Messages
  // Agency view: Same + Client Setup
  const workspaceNavItems = orgId ? [
    // Work items (Overview, Deliverables, Reports, Messages)
    {
      name: 'Overview',
      href: `/${orgId}/dashboard`,
      icon: LayoutDashboard,
      adminOnly: false,
      section: 'work',
    },
    {
      name: 'Deliverables',
      href: `/${orgId}/projects`,
      icon: FileText,
      adminOnly: false,
      section: 'work',
    },
    {
      name: 'Reports',
      href: `/${orgId}/reports`,
      icon: TrendingUp,
      adminOnly: false,
      section: 'work',
    },
    {
      name: 'Messages',
      href: `/${orgId}/messages`,
      icon: MessageSquare,
      adminOnly: false,
      section: 'work',
    },
    // Configuration items (Client Setup - agency only)
    {
      name: 'Client Setup',
      href: `/${orgId}/setup`,
      icon: Settings,
      adminOnly: true,
      section: 'config',
    },
  ].filter(item => {
    // In client view, hide all admin-only items
    if (isClientView && item.adminOnly) return false;
    // In agency view, show everything
    if (!isClientView && item.adminOnly) return isAdmin;
    // Always show non-admin items
    return true;
  }) : [];
  

  // Removed navItems - using separate sections now

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // For workspace routes, match exactly or as prefix
    if (isWorkspace && href.includes(orgId || '')) {
      return pathname === href || pathname?.startsWith(href);
    }
    return pathname?.startsWith(href);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Update main content margin when sidebar collapses
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      if (isCollapsed) {
        mainContent.style.marginLeft = '4rem';
      } else {
        mainContent.style.marginLeft = '16rem';
      }
      mainContent.style.transition = 'margin-left 0.3s ease';
    }
  }, [isCollapsed]);


  return (
    <aside className={`fixed left-0 top-0 h-screen glass-surface flex flex-col transition-all duration-300 z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      {/* CLIENT VIEW - Completely different sidebar */}
      {isClientView ? (
        <>
          {/* Client Sidebar Header */}
          <div className="h-16 flex items-center glass-border-b">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-4">
              <div className="w-2 h-2 bg-accent rounded-sm flex-shrink-0"></div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-medium text-primary truncate">
                    {orgName || organization?.name || 'Organization'}
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`text-secondary hover:text-accent transition-colors p-1.5 rounded hover:bg-white/5 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Client Navigation - Only work items */}
          {workspaceNavItems.filter(item => item.section === 'work').length > 0 && (
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {workspaceNavItems.filter(item => item.section === 'work').map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                // Preserve ?mode=client query param in preview mode
                const href = isPreviewMode ? `${item.href}?mode=client` : item.href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                      active
                        ? 'bg-white/10 text-primary shadow-prestige-soft'
                        : 'text-secondary hover:bg-white/5 hover:text-primary'
                    }`}
                    prefetch={true}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          )}
        </>
      ) : (
        <>
          {/* AGENCY VIEW - Original sidebar */}
          <div className="h-16 flex items-center glass-border-b">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-4">
              <div className="w-2 h-2 bg-accent rounded-sm flex-shrink-0"></div>
              {!isCollapsed && (
                <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-accent transition-colors flex-1 min-w-0">
                  <span className="text-lg font-medium truncate">Elvance</span>
                </Link>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`text-secondary hover:text-accent transition-colors p-1.5 rounded hover:bg-white/5 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* HQ Dashboard */}
          {!isCollapsed && (
            <div className="px-4 py-3 glass-border-b">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                  pathname === '/dashboard'
                    ? 'bg-white/10 text-primary shadow-prestige-soft'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                }`}
              >
                <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${pathname === '/dashboard' ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                <span className="truncate">HQ Dashboard</span>
              </Link>
            </div>
          )}

          {/* CLIENT WORKSPACE section with org selector */}
          {!isCollapsed && (
            <div className="px-4 py-4 space-y-3">
              {/* CLIENT WORKSPACE text */}
              <div className="text-xs font-medium text-muted uppercase tracking-wider px-3">
                Client Workspace
              </div>

              {/* Org Selector */}
              <OrganizationSwitcher
            afterCreateOrganizationUrl={(org) => {
              if (org?.id) {
                return `/${org.id}/dashboard`;
              }
              return '/dashboard';
            }}
            afterSelectOrganizationUrl={(org) => {
              if (org?.id) {
                router.push(`/${org.id}/dashboard`);
                return `/${org.id}/dashboard`;
              }
              router.push('/dashboard');
              return '/dashboard';
            }}
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-between px-3 py-2 text-sm font-medium text-secondary bg-gray-900/50 rounded-lg hover:bg-gray-800/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-white/10 transition-all border border-white/5",
                organizationSwitcherPopoverCard: "bg-gray-900 rounded-lg shadow-prestige border border-white/10",
                organizationSwitcherPopoverActionButton: "text-secondary hover:bg-gray-800/50 hover:text-primary transition-colors",
                organizationSwitcherPopoverActionButtonText: "text-secondary",
                organizationSwitcherPopoverFooter: "border-t border-white/10",
                organizationSwitcherPopoverFooterPages: "text-secondary",
                organizationSwitcherPopoverItem: "text-primary hover:bg-gray-800/50",
                organizationSwitcherPopoverItemText: "text-primary",
                organizationSwitcherPopoverItemDescription: "text-secondary",
                organizationSwitcherPopoverItemActive: "bg-gray-800",
                organizationPreview: "text-primary",
                organizationPreviewText: "text-primary",
                organizationPreviewSecondaryIdentifier: "text-secondary",
                createOrganizationButton: "text-accent hover:bg-gray-800/50 hover:text-accent/80 transition-colors",
                createOrganizationButtonText: "text-accent",
                modalContent: "bg-charcoal-flat border border-white/10 rounded-lg",
                modalBackdrop: "bg-black/60 backdrop-blur-sm",
                modalHeaderTitle: "text-primary text-xl font-light",
                modalHeaderSubtitle: "text-secondary",
                formFieldLabel: "text-secondary text-sm font-medium",
                formFieldInput: "bg-white/5 border border-white/10 text-primary placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-white/10 rounded-lg",
                formButtonPrimary: "bg-accent/20 text-accent hover:bg-accent/30 border-0 rounded-lg shadow-prestige-soft font-medium",
                formButtonReset: "bg-white/5 text-primary hover:bg-white/10 border border-white/10 rounded-lg",
                uploadButton: "bg-white/5 border border-white/10 text-primary hover:bg-white/10 rounded-lg",
                card: "bg-transparent border-0 shadow-none",
                headerTitle: "text-primary",
                headerSubtitle: "text-secondary",
                footer: "border-t border-white/10",
                footerActionLink: "text-accent hover:text-accent/80",
                alertText: "text-secondary",
                formFieldErrorText: "text-red-400",
                formFieldSuccessText: "text-accent",
              },
              variables: {
                colorText: "#E6E8EE",
                colorTextSecondary: "#A1A6B3",
                colorBackground: "#0B0D10",
                colorInputBackground: "rgba(255, 255, 255, 0.05)",
                colorInputText: "#E6E8EE",
                borderRadius: "0.5rem",
              },
            }}
          />
        </div>
      )}

      {/* Navigation - Agency View Only */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {!isWorkspace ? (
          <>
            {/* AGENCY HQ Section */}
            {!isCollapsed && (
              <div>
                <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2 px-3">
                  Agency HQ
                </div>
                <div className="space-y-1">
                  {hqCoreItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                          active
                            ? 'bg-white/10 text-primary shadow-prestige-soft'
                            : 'text-secondary hover:bg-white/5 hover:text-primary'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OPERATIONS Section */}
            {!isCollapsed && hqOpsItems.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2 px-3">
                  Operations
                </div>
                <div className="space-y-1">
                  {hqOpsItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                          active
                            ? 'bg-white/10 text-primary shadow-prestige-soft'
                            : 'text-secondary hover:bg-white/5 hover:text-primary'
                        }`}
                        prefetch={true}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsed view for HQ */}
            {isCollapsed && (
              <div className="space-y-1">
                {/* HQ Dashboard in collapsed view */}
                <Link
                  href="/dashboard"
                  className={`flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                    pathname === '/dashboard'
                      ? 'bg-white/10 text-primary shadow-prestige-soft'
                      : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }`}
                  title="HQ Dashboard"
                >
                  <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${pathname === '/dashboard' ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                </Link>
                {[...hqCoreItems, ...hqOpsItems].map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                        active
                          ? 'bg-white/10 text-primary shadow-prestige-soft'
                          : 'text-secondary hover:bg-white/5 hover:text-primary'
                      }`}
                      title={item.name}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Workspace Navigation - Shows below org selector when org is selected */}
            {!isCollapsed && orgId && workspaceNavItems.length > 0 && (
              <div className="space-y-1">
                {/* Work items: Overview, Deliverables, Reports */}
                {workspaceNavItems.filter(item => item.section === 'work').map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  // Preserve ?mode=client query param in preview mode
                  const href = isPreviewMode ? `${item.href}?mode=client` : item.href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                        active
                          ? 'bg-white/10 text-primary shadow-prestige-soft'
                          : 'text-secondary hover:bg-white/5 hover:text-primary'
                      }`}
                      prefetch={true}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Divider between work and config items */}
                {workspaceNavItems.filter(item => item.section === 'work').length > 0 && 
                 workspaceNavItems.filter(item => item.section === 'config').length > 0 && (
                  <div className="my-3 border-t border-white/10"></div>
                )}
                
                {/* Config items: Client Setup */}
                {workspaceNavItems.filter(item => item.section === 'config').map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const href = item.href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                        active
                          ? 'bg-white/10 text-primary shadow-prestige-soft'
                          : 'text-secondary hover:bg-white/5 hover:text-primary'
                      }`}
                      prefetch={true}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Collapsed view for Workspace */}
            {isCollapsed && orgId && workspaceNavItems.length > 0 && (
              <div className="space-y-1">
                {workspaceNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  // Preserve ?mode=client query param in preview mode
                  const href = isPreviewMode ? `${item.href}?mode=client` : item.href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                        active
                          ? 'bg-white/10 text-primary shadow-prestige-soft'
                          : 'text-secondary hover:bg-white/5 hover:text-primary'
                      }`}
                      title={item.name}
                      prefetch={true}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </nav>
        </>
      )}

      {/* User Profile */}
      <div className="px-3 py-4 glass-border-t relative" data-user-menu>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.firstName || 'User'}
              className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
              {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || 'U'}
            </div>
          )}
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-primary truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-secondary truncate">
                  {user?.primaryEmailAddress?.emailAddress || ''}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-secondary flex-shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {/* User Menu Dropdown */}
        {isUserMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 w-full glass-surface rounded-lg shadow-prestige z-20 overflow-hidden">
              <div className="p-2">
                <div className="px-3 py-2 mb-2 glass-border-b">
                  <div className="flex items-center gap-3">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                        {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-secondary truncate">
                        {user?.primaryEmailAddress?.emailAddress || ''}
                      </div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-secondary hover:bg-white/5 hover:text-primary transition-colors rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage account</span>
                </Link>
                <button
                  onClick={() => {
                    signOut({ redirectUrl: '/' });
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary hover:bg-white/5 hover:text-primary transition-colors rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

