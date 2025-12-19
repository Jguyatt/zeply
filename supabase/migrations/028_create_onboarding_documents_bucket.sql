-- Create onboarding_documents storage bucket
-- This bucket stores PDFs and images uploaded during the onboarding process

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding_documents',
  'onboarding_documents',
  true, -- Public bucket so clients can view documents
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for Clerk authentication
-- Note: Uploads/updates/deletes are handled server-side via API routes using service role (bypasses RLS)
-- These policies are mainly for direct client access scenarios

-- Public read access - clients need to view documents
DROP POLICY IF EXISTS "Public can view onboarding documents" ON storage.objects;
CREATE POLICY "Public can view onboarding documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'onboarding_documents');

-- Note: Insert/Update/Delete operations are handled via API routes (/api/orgs/[orgId]/onboarding/upload-document)
-- which use Clerk authentication + service role client, so RLS policies aren't needed for those operations.
-- The service role bypasses RLS, and Clerk auth is handled in the API route before calling Supabase.
