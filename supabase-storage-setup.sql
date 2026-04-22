-- ============================================
-- SUPABASE STORAGE BUCKET SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up storage buckets and permissions
-- Project: pslcopwbzlfmuuqwshkx

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================
-- Note: You should create these buckets manually in Supabase Dashboard > Storage
-- because bucket creation via SQL is restricted in some Supabase versions

-- Buckets to create:
-- 1. owner-documents (Public: Yes)
-- 2. property-images (Public: Yes)
-- 3. property-videos (Public: Yes)
-- 4. profile-photos (Public: Yes)

-- ============================================
-- 2. SET UP ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OWNER DOCUMENTS BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for owner documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to owner-documents" ON storage.objects;

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'owner-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow ANON users to upload documents (for signup before authentication)
CREATE POLICY "Allow anonymous uploads to owner-documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'owner-documents');

-- Allow public read access to documents
CREATE POLICY "Public read access for owner documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'owner-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'owner-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- PROPERTY IMAGES BUCKET POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;

-- Allow authenticated users to upload property images
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow public read access
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow users to delete property images
CREATE POLICY "Users can delete their property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');

-- ============================================
-- PROPERTY VIDEOS BUCKET POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload property videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property videos" ON storage.objects;

-- Allow authenticated users to upload property videos
CREATE POLICY "Authenticated users can upload property videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-videos');

-- Allow public read access
CREATE POLICY "Public read access for property videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-videos');

-- Allow users to delete property videos
CREATE POLICY "Users can delete their property videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-videos');

-- ============================================
-- PROFILE PHOTOS BUCKET POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their profile photos" ON storage.objects;

-- Allow authenticated users to upload profile photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow public read access
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow users to delete their profile photos
CREATE POLICY "Users can delete their profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check all policies
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
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Storage bucket policies created successfully!';
    RAISE NOTICE '⚠️ Remember to create the following buckets manually in Supabase Dashboard:';
    RAISE NOTICE '   1. owner-documents (Public: Yes)';
    RAISE NOTICE '   2. property-images (Public: Yes)';
    RAISE NOTICE '   3. property-videos (Public: Yes)';
    RAISE NOTICE '   4. profile-photos (Public: Yes)';
END $$;
