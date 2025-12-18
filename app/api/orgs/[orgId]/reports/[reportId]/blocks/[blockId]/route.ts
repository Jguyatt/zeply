import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateReportBlock } from '@/app/actions/reports';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ orgId: string; reportId: string; blockId: string }> }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { reportId, blockId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    const result = await updateReportBlock(reportId, blockId, content);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error updating report block:', error);
    return NextResponse.json(
      { error: 'Failed to update report block' },
      { status: 500 }
    );
  }
}

