import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  generateAutoReport,
  generateKpiReport,
  generateCsvReport,
} from '@/app/actions/reports';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { orgId } = params;
    
    // Check if it's FormData (CSV upload) or JSON (Auto/KPI)
    const contentType = request.headers.get('content-type') || '';
    let tier: string;
    let periodStart: string;
    let periodEnd: string;
    let kpiData: any;
    let csvFile: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      // CSV upload
      tier = 'csv';
      const formData = await request.formData();
      periodStart = formData.get('periodStart') as string;
      periodEnd = formData.get('periodEnd') as string;
      csvFile = formData.get('file') as File;
    } else {
      // Auto or KPI
      const body = await request.json();
      tier = body.tier;
      periodStart = body.periodStart;
      periodEnd = body.periodEnd;
      kpiData = body.kpiData;
    }

    if (!tier || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    let result;

    if (tier === 'auto') {
      result = await generateAutoReport(orgId, periodStart, periodEnd);
    } else if (tier === 'kpi') {
      if (!kpiData || kpiData.leads === undefined) {
        return NextResponse.json(
          { error: 'Missing required KPI data: leads' },
          { status: 400 }
        );
      }
      result = await generateKpiReport(orgId, periodStart, periodEnd, kpiData);
    } else if (tier === 'csv') {
      if (!csvFile) {
        return NextResponse.json(
          { error: 'Missing CSV file' },
          { status: 400 }
        );
      }
      
      result = await generateCsvReport(orgId, periodStart, periodEnd, csvFile);
    } else {
      return NextResponse.json(
        { error: 'Invalid tier. Must be auto, kpi, or csv' },
        { status: 400 }
      );
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}


