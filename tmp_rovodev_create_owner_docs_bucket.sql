-- ============================================
-- CREATE OWNER-DOCUMENTS BUCKET AND POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the bucket (public=true for easy access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'owner-documents',
  'owner-documents',
  true,  -- Make it public
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,  -- Ensure it's public
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Step 2: Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous uploads to owner-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Step 3: Create RLS policies for the bucket

-- Policy 1: Allow ANONYMOUS users to upload (needed for signup before auth)
CREATE POLICY "Allow anonymous uploads to owner-documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'owner-documents');

-- Policy 2: Allow AUTHENTICATED users to upload
CREATE POLICY "Users can upload owner documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'owner-documents');

-- Policy 3: Allow PUBLIC to read/view documents (for barangay officials)
CREATE POLICY "Public read access for owner documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');

-- Policy 4: Allow authenticated users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Policy 5: Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Step 4: Verify the bucket was created
DO $$ 
DECLARE
  bucket_exists boolean;
  is_public boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'owner-documents') INTO bucket_exists;
  SELECT public FROM storage.buckets WHERE id = 'owner-documents' INTO is_public;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ SUCCESS: owner-documents bucket created!';
    IF is_public THEN
      RAISE NOTICE '✅ Bucket is PUBLIC - uploads will work!';
    ELSE
      RAISE NOTICE '⚠️  Bucket is PRIVATE - you may need to make it public';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: Bucket was not created. Check permissions.';
  END IF;
END $$;

-- Step 5: Show all policies for verification
SELECT 
  polname as policy_name,
  polcmd as operation,
  pol_role.rolname as role
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
JOIN pg_roles pol_role ON pg_policy.polroles[1] = pol_role.oid
WHERE pg_class.relname = 'objects'
  AND polname LIKE '%owner%';
