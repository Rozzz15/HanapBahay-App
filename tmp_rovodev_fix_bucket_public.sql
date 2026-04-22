-- ============================================
-- FIX: Make owner-documents bucket PUBLIC
-- The bucket exists but it's not public!
-- ============================================

-- Step 1: Make the bucket PUBLIC
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 52428800,  -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'owner-documents';

-- Step 2: Verify it's now public
DO $$ 
DECLARE
  is_public boolean;
  current_limit bigint;
BEGIN
  SELECT public, file_size_limit 
  FROM storage.buckets 
  WHERE id = 'owner-documents' 
  INTO is_public, current_limit;
  
  IF is_public THEN
    RAISE NOTICE '✅ SUCCESS: owner-documents bucket is now PUBLIC!';
    RAISE NOTICE '📦 File size limit: % MB', current_limit / 1048576;
  ELSE
    RAISE NOTICE '❌ ERROR: Bucket is still PRIVATE';
  END IF;
END $$;

-- Step 3: Ensure RLS policies allow uploads
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow anonymous uploads to owner-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create new permissive policies
-- Policy 1: Allow ANYONE (anon + authenticated) to upload
CREATE POLICY "Allow anonymous uploads to owner-documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'owner-documents');

-- Policy 2: Allow ANYONE to read/download
CREATE POLICY "Public read access for owner documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');

-- Policy 3: Allow authenticated users to update
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Policy 4: Allow authenticated users to delete
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Step 4: Show all policies for this bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%owner%'
ORDER BY policyname;

-- Step 5: Final verification
SELECT 
  id,
  name,
  public,
  file_size_limit / 1048576 as "size_limit_mb",
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'owner-documents';
