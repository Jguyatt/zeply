import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getReport } from '@/app/actions/reports';
import { getMetrics } from '@/app/actions/metrics';

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string; reportId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get report data
    const reportResult = await getReport(params.reportId);
    
    if (reportResult.error || !reportResult.data) {
      return NextResponse.json({ error: reportResult.error || 'Report not found' }, { status: 404 });
    }

    const report = reportResult.data;

    // Verify user has access to this org
    const supabase = await createServerClient();
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', params.orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get metrics for the report period
    let metricsData: any[] = [];
    if (report.period_start && report.period_end) {
      const metricsResult = await getMetrics(params.orgId, report.period_start, report.period_end);
      if (metricsResult.data) {
        metricsData = metricsResult.data;
      }
    }

    // Generate CSV
    const csvRows: string[] = [];
    
    // Report metadata
    csvRows.push('Report Metadata');
    csvRows.push(`Title,${report.title}`);
    csvRows.push(`Period Start,${report.period_start || 'N/A'}`);
    csvRows.push(`Period End,${report.period_end || 'N/A'}`);
    csvRows.push(`Status,${report.status}`);
    csvRows.push(`Created,${report.created_at}`);
    if (report.published_at) {
      csvRows.push(`Published,${report.published_at}`);
    }
    csvRows.push('');

    // Metrics data
    if (metricsData.length > 0) {
      csvRows.push('Metrics Data');
      csvRows.push('Period Start,Period End,Leads,Spend,Revenue,ROAS,CPL,Traffic,Conversions,Conversion Rate');
      metricsData.forEach((metric: any) => {
        csvRows.push([
          metric.period_start || '',
          metric.period_end || '',
          metric.leads || 0,
          metric.spend || 0,
          metric.revenue || 0,
          metric.roas || '',
          metric.cpl || '',
          metric.website_traffic || 0,
          metric.conversions || 0,
          metric.conversion_rate || '',
        ].join(','));
      });
      csvRows.push('');
    }

    // Report sections
    if (report.report_sections && report.report_sections.length > 0) {
      csvRows.push('Report Sections');
      csvRows.push('Section Type,Title,Content');
      report.report_sections.forEach((section: any) => {
        const content = (section.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
        csvRows.push(`"${section.section_type}","${section.title || ''}","${content}"`);
      });
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${report.id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

