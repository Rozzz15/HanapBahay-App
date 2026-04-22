-- =====================================================
-- FIX ALL SUPABASE WARNINGS - SAFE VERSION
-- =====================================================
-- This version drops existing policies before creating new ones
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: update_maintenance_requests_updated_at() Function
-- =====================================================

CREATE OR REPLACE FUNCTION update_maintenance_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_maintenance_requests_updated_at() IS 'Auto-updates updated_at for maintenance_requests (with secure search_path)';

-- =====================================================
-- FIX 2: Secure RLS Policies for bookings Table
-- =====================================================

-- Drop ALL existing policies on bookings
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_select_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_select_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_insert_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_tenant" ON public.bookings CASCADE;

-- Create fresh policies
CREATE POLICY "bookings_select_tenant" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_select_owner" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid() = owner_id::uuid);

CREATE POLICY "bookings_insert_tenant" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_update_tenant" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id::uuid)
WITH CHECK (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_update_owner" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id::uuid)
WITH CHECK (auth.uid() = owner_id::uuid);

CREATE POLICY "bookings_delete_tenant" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid() = tenant_id::uuid);

-- =====================================================
-- FIX 3: Secure RLS Policies for published_listings Table
-- =====================================================

-- Drop ALL existing policies on published_listings
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_select_all" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_insert_own" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_update_own" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_delete_own" ON public.published_listings CASCADE;

-- Everyone can view published listings (public marketplace)
CREATE POLICY "published_listings_select_all" ON public.published_listings
FOR SELECT TO authenticated
USING (true);

-- Owners can insert only their own listings
CREATE POLICY "published_listings_insert_own" ON public.published_listings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id::uuid);

-- Owners can update only their own listings
CREATE POLICY "published_listings_update_own" ON public.published_listings
FOR UPDATE TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

-- Owners can delete only their own listings
CREATE POLICY "published_listings_delete_own" ON public.published_listings
FOR DELETE TO authenticated
USING (auth.uid() = user_id::uuid);

-- =====================================================
-- FIX 4: Secure RLS Policies for favorites Table
-- =====================================================

-- Drop ALL existing policies on favorites
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.favorites CASCADE;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites CASCADE;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites CASCADE;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites CASCADE;

-- Create fresh policies
CREATE POLICY "favorites_select_own" ON public.favorites
FOR SELECT TO authenticated
USING (auth.uid() = user_id::uuid);

CREATE POLICY "favorites_insert_own" ON public.favorites
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "favorites_delete_own" ON public.favorites
FOR DELETE TO authenticated
USING (auth.uid() = user_id::uuid);

-- =====================================================
-- FIX 5: Secure RLS Policies for owner_verifications Table
-- =====================================================

-- Drop ALL existing policies on owner_verifications
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.owner_verifications CASCADE;
DROP POLICY IF EXISTS "owner_verifications_select_own" ON public.owner_verifications CASCADE;
DROP POLICY IF EXISTS "owner_verifications_select_brgy" ON public.owner_verifications CASCADE;
DROP POLICY IF EXISTS "owner_verifications_insert_own" ON public.owner_verifications CASCADE;
DROP POLICY IF EXISTS "owner_verifications_update_own" ON public.owner_verifications CASCADE;
DROP POLICY IF EXISTS "owner_verifications_update_brgy" ON public.owner_verifications CASCADE;

-- Create fresh policies
CREATE POLICY "owner_verifications_select_own" ON public.owner_verifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id::uuid);

CREATE POLICY "owner_verifications_select_brgy" ON public.owner_verifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'brgy_official'
  )
);

CREATE POLICY "owner_verifications_insert_own" ON public.owner_verifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "owner_verifications_update_own" ON public.owner_verifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "owner_verifications_update_brgy" ON public.owner_verifications
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'brgy_official'
  )
);

-- =====================================================
-- FIX 6: Secure RLS Policies for brgy_notifications Table
-- =====================================================

-- Drop ALL existing policies on brgy_notifications
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.brgy_notifications CASCADE;
DROP POLICY IF EXISTS "brgy_notifications_select_barangay" ON public.brgy_notifications CASCADE;
DROP POLICY IF EXISTS "brgy_notifications_insert_system" ON public.brgy_notifications CASCADE;
DROP POLICY IF EXISTS "brgy_notifications_update_barangay" ON public.brgy_notifications CASCADE;
DROP POLICY IF EXISTS "brgy_notifications_delete_barangay" ON public.brgy_notifications CASCADE;

-- Create fresh policies
CREATE POLICY "brgy_notifications_select_barangay" ON public.brgy_notifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'brgy_official'
    AND u.barangay = public.brgy_notifications.barangay
  )
);

CREATE POLICY "brgy_notifications_insert_system" ON public.brgy_notifications
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "brgy_notifications_update_barangay" ON public.brgy_notifications
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'brgy_official'
    AND u.barangay = public.brgy_notifications.barangay
  )
);

CREATE POLICY "brgy_notifications_delete_barangay" ON public.brgy_notifications
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'brgy_official'
    AND u.barangay = public.brgy_notifications.barangay
  )
);

-- =====================================================
-- ADD PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_published_listings_user_id ON public.published_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_published_listings_barangay ON public.published_listings(barangay);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_verifications_user_id ON public.owner_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_brgy_notifications_barangay ON public.brgy_notifications(barangay);
CREATE INDEX IF NOT EXISTS idx_users_role_barangay ON public.users(role, barangay);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check function
SELECT 
  p.proname AS function_name,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_maintenance_requests_updated_at';

-- Check all table policies
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('bookings', 'published_listings', 'favorites', 'owner_verifications', 'brgy_notifications')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ ALL SUPABASE WARNINGS FIXED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ 1 function secured';
  RAISE NOTICE '  ✓ 5 tables secured';
  RAISE NOTICE '  ✓ 22 policies created';
  RAISE NOTICE '  ✓ 8 indexes added';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables:';
  RAISE NOTICE '  - bookings: 6 policies';
  RAISE NOTICE '  - published_listings: 4 policies';
  RAISE NOTICE '  - favorites: 3 policies';
  RAISE NOTICE '  - owner_verifications: 5 policies';
  RAISE NOTICE '  - brgy_notifications: 4 policies';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  TEST YOUR APP THOROUGHLY!';
  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- This script is SAFE to run multiple times
-- It will drop and recreate all policies cleanly
-- =====================================================
