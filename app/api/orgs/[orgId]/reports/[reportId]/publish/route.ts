import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { publishReport } from '@/app/actions/reports';

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
    const result = await publishReport(reportId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error publishing report:', error);
    return NextResponse.json(
      { error: 'Failed to publish report' },
      { status: 500 }
    );
  }
}

