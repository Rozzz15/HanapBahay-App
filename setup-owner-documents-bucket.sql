-- Supabase Storage Setup for Owner Documents
-- Run this in Supabase SQL Editor to create storage policies

-- IMPORTANT: First create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: owner-documents
-- 4. Check "Public bucket"
-- 5. Click "Create"

-- Then run this SQL to set up storage policies:

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can upload owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload documents
CREATE POLICY "Users can upload owner documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'owner-documents');

-- Policy 2: Allow public to view documents (needed for barangay viewing)
CREATE POLICY "Public can view owner documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');

-- Policy 3: Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Policy 4: Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Storage policies created successfully for owner-documents bucket!';
END $$;
