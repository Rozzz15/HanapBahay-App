-- =====================================================
-- URGENT FIX: Bookings RLS Policies Blocking Operations
-- =====================================================
-- Problem: Can't upsert/delete bookings
-- Solution: Fix RLS policies with proper type casting
-- =====================================================

BEGIN;

-- =====================================================
-- Check current policies
-- =====================================================

SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

-- =====================================================
-- Drop all existing policies
-- =====================================================

DROP POLICY IF EXISTS "bookings_select_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_select_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_insert_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_tenant" ON public.bookings CASCADE;

-- =====================================================
-- Create working policies with correct type casting
-- =====================================================

-- SELECT: Tenants see their bookings, Owners see bookings for their properties
CREATE POLICY "bookings_select_tenant" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_select_owner" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid() = owner_id::uuid);

-- INSERT: Tenants can create bookings for themselves
CREATE POLICY "bookings_insert_tenant" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = tenant_id::uuid);

-- UPDATE: Both tenants and owners can update
CREATE POLICY "bookings_update_tenant" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id::uuid)
WITH CHECK (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_update_owner" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id::uuid)
WITH CHECK (auth.uid() = owner_id::uuid);

-- DELETE: Both tenants and owners can delete bookings
CREATE POLICY "bookings_delete_tenant" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid() = tenant_id::uuid);

CREATE POLICY "bookings_delete_owner" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid() = owner_id::uuid);

COMMIT;

-- =====================================================
-- Verify
-- =====================================================

SELECT 
    policyname,
    cmd,
    'ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ BOOKINGS RLS POLICIES FIXED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Now working:';
    RAISE NOTICE '  ✓ Tenants can create bookings';
    RAISE NOTICE '  ✓ Tenants can update their bookings';
    RAISE NOTICE '  ✓ Tenants can delete their bookings';
    RAISE NOTICE '  ✓ Owners can update bookings (approve/reject)';
    RAISE NOTICE '  ✓ Owners can delete bookings';
    RAISE NOTICE '  ✓ Both see their respective bookings';
    RAISE NOTICE '';
    RAISE NOTICE 'Try booking in your app now!';
    RAISE NOTICE '============================================';
END $$;
