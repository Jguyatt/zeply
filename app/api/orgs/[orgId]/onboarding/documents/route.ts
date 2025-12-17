import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseOrgIdFromClerk } from '@/app/actions/orgs';

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createServiceClient();
  
  // Handle Clerk org ID vs Supabase UUID
  let supabaseOrgId = params.orgId;
  if (params.orgId.startsWith('org_')) {
    const orgResult = await getSupabaseOrgIdFromClerk(params.orgId);
    if (orgResult && 'data' in orgResult) {
      supabaseOrgId = orgResult.data;
    } else {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
  }

  try {
    // List all files in the org's onboarding folder
    const folderPath = `${supabaseOrgId}/onboarding/`;
    
    const { data: files, error } = await supabase.storage
      .from('onboarding_documents')
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listing documents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URLs for all files and extract metadata
    const documents = (files || []).map((file) => {
      const filePath = `${folderPath}${file.name}`;
      const { data: publicUrl } = supabase.storage
        .from('onboarding_documents')
        .getPublicUrl(filePath);

      // Extract original filename from timestamp-filename format
      const originalFilename = file.name.includes('-') 
        ? file.name.split('-').slice(1).join('-')
        : file.name;

      return {
        name: originalFilename,
        filename: file.name,
        url: publicUrl.publicUrl,
        path: filePath,
        created_at: file.created_at,
        updated_at: file.updated_at,
        size: file.metadata?.size || 0,
      };
    });

    return NextResponse.json({ data: documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

