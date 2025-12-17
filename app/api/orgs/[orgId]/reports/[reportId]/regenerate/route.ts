import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { regenerateReport } from '@/app/actions/reports';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string; reportId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { reportId } = params;
    const result = await regenerateReport(reportId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error regenerating report:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate report' },
      { status: 500 }
    );
  }
}

