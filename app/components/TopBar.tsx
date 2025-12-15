'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getUnreadCount } from '@/app/actions/messages';

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Extract orgId from path if in workspace mode
  const orgIdMatch = pathname?.match(/\/([^/]+)\/(dashboard|projects|reports|messages|settings|setup|activity)/);
  const orgId = orgIdMatch ? orgIdMatch[1] : null;
  const isWorkspace = !!orgId;

  // Fetch unread count
  useEffect(() => {
    if (orgId && isWorkspace) {
      const fetchUnread = async () => {
        const result = await getUnreadCount(orgId);
        if (result.data !== undefined) {
          setUnreadCount(result.data);
        }
      };
      fetchUnread();
      
      // Poll every 10 seconds
      const interval = setInterval(fetchUnread, 10000);
      return () => clearInterval(interval);
    }
  }, [orgId, isWorkspace]);

  return (
    <div className="h-16 glass-border-b flex items-center justify-end px-6 bg-charcoal-flat gap-4">
      {isWorkspace && orgId && (
        <Link
          href={`/${orgId}/messages`}
          className="relative p-2 glass-surface rounded-lg hover:bg-white/10 transition-all"
        >
          <MessageSquare className="w-5 h-5 text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

