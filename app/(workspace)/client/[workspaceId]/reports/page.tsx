/**
 * Client Reports Page
 * View published, client-visible reports
 */

import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/app/lib/security';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Download, Calendar, ArrowRight } from 'lucide-react';

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // CRITICAL SECURITY CHECK
  await requireWorkspaceAccess(workspaceId, 'member', '/dashboard');

  // Handle Clerk org ID vs Supabase UUID
  let supabaseWorkspaceId = workspaceId;
  if (workspaceId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(workspaceId);
    if (orgResult && 'data' in orgResult && orgResult.data) {
      supabaseWorkspaceId = orgResult.data;
    } else {
      redirect('/dashboard');
    }
  }

  const supabase = await createServerClient();

  // Fetch published, client-visible reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('org_id', supabaseWorkspaceId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
  }

  const publishedReports = reports || [];

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-primary mb-2">Reports</h1>
        <p className="text-secondary">Performance reports and analytics</p>
      </div>

      {publishedReports.length === 0 ? (
        <div className="glass-surface glass-border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">No reports yet</h3>
          <p className="text-secondary">
            Published reports will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedReports.map((report: any) => (
            <Link
              key={report.id}
              href={`/client/${workspaceId}/reports/${report.id}`}
              className="block glass-surface glass-border rounded-lg p-6 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-medium text-primary">
                      {report.title || 'Performance Report'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-secondary mb-2">
                    {report.period_start && report.period_end && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatPeriod(report.period_start, report.period_end)}
                      </span>
                    )}
                    {report.published_at && (
                      <span>Published {formatDate(report.published_at)}</span>
                    )}
                  </div>
                  {report.summary && (
                    <p className="text-secondary text-sm line-clamp-2">
                      {report.summary}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-accent ml-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
