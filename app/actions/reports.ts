/**
 * Server Actions for Reports Management
 */

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function getReports(orgId: string, includeDrafts: boolean = true) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  let query = supabase
    .from('reports')
    .select('*, report_sections(*)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data: reports, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // Sort sections by order_index
  const reportsWithSortedSections = (reports || []).map((report: any) => ({
    ...report,
    report_sections: (report.report_sections || []).sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  return { data: reportsWithSortedSections };
}

export async function getReport(reportId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select('*, report_sections(*)')
    .eq('id', reportId)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Sort sections by order_index
  const reportWithSortedSections = {
    ...report,
    report_sections: (report.report_sections || []).sort((a: any, b: any) => a.order_index - b.order_index),
  };

  return { data: reportWithSortedSections };
}

export async function createReport(
  orgId: string,
  data: {
    title: string;
    summary?: string;
    period_start?: string;
    period_end?: string;
    status?: 'draft' | 'published';
    client_visible?: boolean;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: report, error } = await (supabase
    .from('reports') as any)
    .insert({
      org_id: orgId,
      title: data.title,
      summary: data.summary,
      period_start: data.period_start,
      period_end: data.period_end,
      status: data.status || 'draft',
      client_visible: data.client_visible !== undefined ? data.client_visible : true,
      created_by: userId,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${orgId}/reports`);
  return { data: report };
}

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
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
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

    if (!existing?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data: report, error } = await (supabase
    .from('reports') as any)
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${report.org_id}/reports`);
  return { data: report };
}

export async function deleteReport(reportId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get org_id before deleting for revalidation
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    return { error: error.message };
  }

  if (report) {
    revalidatePath(`/${report.org_id}/reports`);
  }

  return { data: { success: true } };
}

export async function createReportSection(
  reportId: string,
  data: {
    section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom';
    title?: string;
    content: string;
    order_index?: number;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: section, error } = await (supabase
    .from('report_sections') as any)
    .insert({
      report_id: reportId,
      section_type: data.section_type,
      title: data.title,
      content: data.content,
      order_index: data.order_index || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get report to revalidate correct path
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single();

  if (report) {
    revalidatePath(`/${report.org_id}/reports`);
  }

  return { data: section };
}

export async function updateReportSection(
  sectionId: string,
  data: {
    title?: string;
    content?: string;
    order_index?: number;
  }
) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const { data: section, error } = await supabase
    .from('report_sections')
    .update(data)
    .eq('id', sectionId)
    .select('report_id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get report to revalidate correct path
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', section.report_id)
    .single();

  if (report) {
    revalidatePath(`/${report.org_id}/reports`);
  }

  return { data: section };
}

export async function deleteReportSection(sectionId: string) {
  const supabase = await createServerClient();
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  // Get report_id before deleting
  const { data: section } = await supabase
    .from('report_sections')
    .select('report_id')
    .eq('id', sectionId)
    .single();

  const { error } = await supabase
    .from('report_sections')
    .delete()
    .eq('id', sectionId);

  if (error) {
    return { error: error.message };
  }

  if (section) {
    // Get report to revalidate correct path
    const { data: report } = await supabase
      .from('reports')
      .select('org_id')
      .eq('id', section.report_id)
      .single();

    if (report) {
      revalidatePath(`/${report.org_id}/reports`);
    }
  }

  return { data: { success: true } };
}

