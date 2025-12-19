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
    // List all files recursively in the org's onboarding folder
    // Structure: {orgId}/onboarding/{nodeId}/{timestamp}-{filename}
    const folderPath = `${supabaseOrgId}/onboarding/`;
    
    // First, list node directories
    const { data: nodeDirs, error: dirsError } = await supabase.storage
      .from('onboarding_documents')
      .list(folderPath, {
        limit: 100,
        offset: 0,
      });

    if (dirsError) {
      console.error('Error listing node directories:', dirsError);
      return NextResponse.json({ error: dirsError.message }, { status: 500 });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents/route.ts:47',message:'Listed node directories',data:{folderPath,nodeDirCount:nodeDirs?.length,nodeDirs:nodeDirs?.map((d:any)=>({name:d.name,id:d.id,hasMetadata:!!d.metadata}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    // Recursively list files in each node directory
    const allFiles: Array<{ name: string; created_at: string; updated_at: string; metadata?: any; fullPath: string }> = [];
    
    for (const nodeDir of (nodeDirs || [])) {
      // In Supabase Storage, directories don't have an 'id' property, files do
      // But we can also check if it has metadata (files have metadata, directories typically don't)
      // For now, assume all entries are directories and try to list them
      // If listing fails or returns empty, it might be a file (shouldn't happen at this level)
      
      const nodePath = `${folderPath}${nodeDir.name}/`;
      const { data: nodeFiles, error: filesError } = await supabase.storage
        .from('onboarding_documents')
        .list(nodePath, {
          limit: 100,
          offset: 0,
        });

      if (filesError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents/route.ts:filesError',message:'Error listing node files - might be a file not a directory',data:{nodePath,error:filesError.message,nodeDirName:nodeDir.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        console.error(`Error listing files in ${nodePath}:`, filesError);
        continue; // Skip this node directory if listing fails
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'documents/route.ts:nodeFiles',message:'Listed files in node directory',data:{nodePath,fileCount:nodeFiles?.length,fileNames:nodeFiles?.map((f:any)=>f.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      // Add files with their full path
      (nodeFiles || []).forEach((file) => {
        allFiles.push({
          ...file,
          fullPath: `${nodePath}${file.name}`,
        });
      });
    }

    // Sort by creation date (newest first)
    allFiles.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Get public URLs for all files and extract metadata
    const documents = allFiles.map((file) => {
      const { data: publicUrl } = supabase.storage
        .from('onboarding_documents')
        .getPublicUrl(file.fullPath);

      // Extract original filename from timestamp-filename format
      const originalFilename = file.name.includes('-') 
        ? file.name.split('-').slice(1).join('-')
        : file.name;

      return {
        name: originalFilename,
        filename: file.name,
        url: publicUrl.publicUrl,
        path: file.fullPath,
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

