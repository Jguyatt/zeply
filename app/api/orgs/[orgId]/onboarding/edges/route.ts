/**
 * API Routes for Onboarding Edges
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createOnboardingEdge,
  deleteOnboardingEdge,
} from '@/app/actions/onboarding';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Edges are typically retrieved with the flow, so this endpoint may not be needed
    // But we'll return empty array for consistency
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Error in GET /api/orgs/[orgId]/onboarding/edges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flowId, sourceId, targetId } = body;

    if (!flowId || !sourceId || !targetId) {
      return NextResponse.json(
        { error: 'flowId, sourceId, and targetId required' },
        { status: 400 }
      );
    }

    const result = await createOnboardingEdge(flowId, sourceId, targetId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in POST /api/orgs/[orgId]/onboarding/edges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const edgeId = searchParams.get('edgeId');

    if (!edgeId) {
      return NextResponse.json({ error: 'edgeId required' }, { status: 400 });
    }

    const result = await deleteOnboardingEdge(edgeId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orgs/[orgId]/onboarding/edges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

