-- =====================================================
-- DEBUG AND FIX BOOKINGS RLS - FINAL VERSION
-- =====================================================

-- Step 1: Check column types in bookings table
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'bookings'
AND column_name IN ('tenant_id', 'owner_id', 'property_id', 'id')
ORDER BY column_name;

-- Step 2: Show current policies
SELECT 
    policyname,
    cmd,
    SUBSTRING(qual::text, 1, 100) as using_clause,
    SUBSTRING(with_check::text, 1, 100) as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

-- Step 3: DROP ALL POLICIES and recreate with explicit casting
BEGIN;

DROP POLICY IF EXISTS "bookings_select_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_select_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_insert_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_owner" ON public.bookings CASCADE;

-- SELECT policies - simple and direct
CREATE POLICY "bookings_select_tenant" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid()::text = tenant_id::text);

CREATE POLICY "bookings_select_owner" ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid()::text = owner_id::text);

-- INSERT policy
CREATE POLICY "bookings_insert_tenant" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = tenant_id::text);

-- UPDATE policies
CREATE POLICY "bookings_update_tenant" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid()::text = tenant_id::text)
WITH CHECK (auth.uid()::text = tenant_id::text);

CREATE POLICY "bookings_update_owner" ON public.bookings
FOR UPDATE TO authenticated
USING (auth.uid()::text = owner_id::text)
WITH CHECK (auth.uid()::text = owner_id::text);

-- DELETE policies
CREATE POLICY "bookings_delete_tenant" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid()::text = tenant_id::text);

CREATE POLICY "bookings_delete_owner" ON public.bookings
FOR DELETE TO authenticated
USING (auth.uid()::text = owner_id::text);

COMMIT;

-- Verify
SELECT 
    policyname,
    cmd,
    'ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ BOOKINGS RLS WITH TYPE-SAFE CASTING';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies now handle both UUID and TEXT types';
    RAISE NOTICE 'Try booking in your app now!';
    RAISE NOTICE '============================================';
END $$;
