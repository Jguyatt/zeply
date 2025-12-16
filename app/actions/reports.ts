export async function updateReport(
  reportId: string,
  data: {
    title?: string;
    summary?: string;
    period_start?: string;
    period_end?: string;
    status?: 'draft' | 'published';
    client_visible?: boolean;
  }
) {
  const supabase = createServiceClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get report to check org_id
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  if (!report) {
    return { error: 'Report not found' };
  }

  // Verify user is admin/owner in this org (members cannot update reports)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', (report as any).org_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not a member of this organization' };
  }

  const userRole = (membership as any).role || 'member';
  if (userRole === 'member') {
    return { error: 'Only admins can update reports' };
  }

  const updateData: any = { ...data };

  // If status is being changed to published, set published_at
  if (data.status === 'published') {
    // Check if it was previously unpublished
    const { data: existing } = await supabase
      .from('reports')
      .select('published_at')
      .eq('id', reportId)
      .single();

    // FIX: Cast to any to prevent 'property does not exist on type never' error
    if (!(existing as any)?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data: updatedReport, error } = await (supabase
    .from('reports') as any)
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${(report as any).org_id}/reports`);
  return { data: updatedReport };
}