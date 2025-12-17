import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getReport } from '@/app/actions/reports';

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

    // For now, return a JSON response with report data
    // Client-side PDF generation will be handled in the component
    // This allows for better formatting control
    return NextResponse.json({ 
      data: report,
      message: 'PDF export will be handled client-side'
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

