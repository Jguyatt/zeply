-- Create deliverables storage bucket
-- This bucket stores files uploaded for deliverables (proofs, attachments, etc.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  true, -- Public bucket so clients can view deliverable files
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/webm',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for Clerk authentication
-- Note: Uploads/updates/deletes are handled server-side via API routes using service role (bypasses RLS)
-- These policies are mainly for direct client access scenarios

-- Public read access - clients need to view deliverable files
DROP POLICY IF EXISTS "Public can view deliverable files" ON storage.objects;
CREATE POLICY "Public can view deliverable files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'deliverables');

-- Note: Insert/Update/Delete operations are handled via API routes (/api/orgs/[orgId]/deliverables/upload)
-- which use Clerk authentication + service role client, so RLS policies aren't needed for those operations.
-- The service role bypasses RLS, and Clerk auth is handled in the API route before calling Supabase.
