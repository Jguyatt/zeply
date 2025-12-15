/**
 * API Routes for Onboarding Nodes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';
import {
  getOnboardingNodes,
  createOnboardingNode,
  updateOnboardingNode,
  deleteOnboardingNode,
  reorderOnboardingNodes,
} from '@/app/actions/onboarding';

async function getSupabaseOrgId(orgId: string): Promise<string | null> {
  if (orgId.startsWith('org_')) {
    const result = await getSupabaseOrgIdFromClerk(orgId);
    if (result && 'data' in result) {
      return result.data;
    }
  }
  return orgId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');

    if (!flowId) {
      return NextResponse.json({ error: 'flowId required' }, { status: 400 });
    }

    const result = await getOnboardingNodes(flowId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in GET /api/orgs/[orgId]/onboarding/nodes:', error);
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
    const { flowId, ...nodeData } = body;

    if (!flowId) {
      return NextResponse.json({ error: 'flowId required' }, { status: 400 });
    }

    const result = await createOnboardingNode(flowId, nodeData);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in POST /api/orgs/[orgId]/onboarding/nodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nodeId, ...updates } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    }

    const result = await updateOnboardingNode(nodeId, updates);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in PUT /api/orgs/[orgId]/onboarding/nodes:', error);
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
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    }

    const result = await deleteOnboardingNode(nodeId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orgs/[orgId]/onboarding/nodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flowId, nodeOrders } = body;

    if (!flowId || !nodeOrders) {
      return NextResponse.json(
        { error: 'flowId and nodeOrders required' },
        { status: 400 }
      );
    }

    const result = await reorderOnboardingNodes(flowId, nodeOrders);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/orgs/[orgId]/onboarding/nodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

