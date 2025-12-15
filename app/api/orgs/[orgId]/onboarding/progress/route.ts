/**
 * API Routes for Onboarding Progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getOnboardingProgress,
  completeOnboardingNode,
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

    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || userId;

    // Users can only view their own progress unless they're admin
    if (targetUserId !== userId) {
      // TODO: Add admin check here if needed
    }

    const result = await getOnboardingProgress(orgId, targetUserId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in GET /api/orgs/[orgId]/onboarding/progress:', error);
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

    const { orgId } = await params;
    const body = await request.json();
    const { nodeId, metadata } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    }

    const result = await completeOnboardingNode(orgId, userId, nodeId, metadata);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in POST /api/orgs/[orgId]/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

