-- Supabase Storage Policies for Profile Photos
-- Run this in your Supabase SQL Editor to fix the "row-level security policy" error

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================

-- Create profile-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create property-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create property-videos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- STORAGE POLICIES FOR PROFILE-PHOTOS BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;

-- Allow anyone to view profile photos (public read)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload profile photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to update their own profile photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow users to delete their own profile photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- ============================================
-- STORAGE POLICIES FOR PROPERTY-IMAGES BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

-- Allow anyone to view property images (public read)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload property images
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow users to update their own property images
CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images');

-- Allow users to delete their own property images
CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');

-- ============================================
-- STORAGE POLICIES FOR PROPERTY-VIDEOS BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property videos" ON storage.objects;

-- Allow anyone to view property videos (public read)
CREATE POLICY "Anyone can view property videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

-- Allow authenticated users to upload property videos
CREATE POLICY "Authenticated users can upload property videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-videos');

-- Allow users to update their own property videos
CREATE POLICY "Users can update own property videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-videos');

-- Allow users to delete their own property videos
CREATE POLICY "Users can delete own property videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-videos');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies configured successfully!';
  RAISE NOTICE '📸 Profile photos bucket: Ready';
  RAISE NOTICE '🏠 Property images bucket: Ready';
  RAISE NOTICE '🎥 Property videos bucket: Ready';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 All authenticated users can now upload files!';
  RAISE NOTICE '👀 All files are publicly viewable';
END $$;
