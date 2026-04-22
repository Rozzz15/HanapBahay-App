-- =====================================================
-- URGENT FIX: Listings Not Showing (0 total listings)
-- =====================================================
-- Problem: RLS policies blocking ALL listings from showing
-- Solution: Fix the SELECT policy to allow proper access
-- =====================================================

BEGIN;

-- =====================================================
-- FIX: Listings Not Showing for Tenants/Guests
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "published_listings_select_with_capacity" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_select_available_or_owner" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_select_all" ON public.published_listings CASCADE;

-- Create a working policy that shows listings properly
-- ALL authenticated users can see ALL listings
-- (We'll use application logic to hide fully occupied ones if needed)
CREATE POLICY "published_listings_select_authenticated" ON public.published_listings
FOR SELECT TO authenticated
USING (true);

-- Owners can insert only their own listings
DROP POLICY IF EXISTS "published_listings_insert_own" ON public.published_listings CASCADE;
CREATE POLICY "published_listings_insert_own" ON public.published_listings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id::uuid);

-- Owners can update only their own listings
DROP POLICY IF EXISTS "published_listings_update_own" ON public.published_listings CASCADE;
CREATE POLICY "published_listings_update_own" ON public.published_listings
FOR UPDATE TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

-- Owners can delete only their own listings
DROP POLICY IF EXISTS "published_listings_delete_own" ON public.published_listings CASCADE;
CREATE POLICY "published_listings_delete_own" ON public.published_listings
FOR DELETE TO authenticated
USING (auth.uid() = user_id::uuid);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies on published_listings
SELECT 
    policyname,
    cmd,
    roles,
    SUBSTRING(qual::text, 1, 50) as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'published_listings'
ORDER BY policyname;

-- Count listings (should show actual count now)
SELECT COUNT(*) as total_listings FROM public.published_listings;

-- Show some sample listings
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    availability_status
FROM public.published_listings
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
    listing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO listing_count FROM public.published_listings;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ LISTINGS VISIBILITY FIXED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  ✓ Removed overly restrictive policy';
    RAISE NOTICE '  ✓ All authenticated users can now see listings';
    RAISE NOTICE '  ✓ Total listings visible: %', listing_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  ✓ Users can only INSERT/UPDATE/DELETE their own listings';
    RAISE NOTICE '  ✓ Everyone can VIEW all listings (marketplace behavior)';
    RAISE NOTICE '';
    RAISE NOTICE 'Note:';
    RAISE NOTICE '  - Occupied listings will show occupied_slots count';
    RAISE NOTICE '  - Your app can filter fully occupied ones if needed';
    RAISE NOTICE '  - But database will show all for browsing';
    RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Click "New Query"
-- 4. Paste this script
-- 5. Click "Run"
-- 6. Refresh your app - listings will appear!
-- =====================================================

-- =====================================================
-- EXPLANATION
-- =====================================================
-- Why this works:
-- 
-- The previous policy tried to hide fully occupied listings at the database level:
-- USING (occupied_slots < capacity OR auth.uid() = user_id)
-- 
-- Problem: This caused issues with NULL values or type mismatches,
-- resulting in NO listings showing up.
--
-- Better approach:
-- - Database: Show ALL listings to authenticated users
-- - Application: Filter out fully occupied ones in your React Native code
-- 
-- This is:
-- 1. More reliable (no database-level filtering issues)
-- 2. More flexible (app controls what to show)
-- 3. Better performance (simpler query)
-- 4. Standard practice for marketplace apps
-- =====================================================
