import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrgMembers } from '@/app/lib/getOrgMembers';

/**
 * Get organization members for assignee dropdown
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  const result = await getOrgMembers(params.orgId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Filter to only return admins and owners (exclude members)
  const adminMembers = (result.data || []).filter((member: any) => {
    const role = member?.role?.toLowerCase?.() || member?.role || '';
    return role === 'admin' || role === 'owner';
  });

  return NextResponse.json({ data: adminMembers });
}

