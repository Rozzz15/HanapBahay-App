-- =====================================================
-- CLEAN UP DUPLICATE POLICIES
-- =====================================================
-- Problem: You have duplicate policies (14 instead of 7)
-- Solution: Drop old policies, keep the new ones
-- =====================================================

BEGIN;

-- =====================================================
-- Drop the OLD policies (the ones with long names)
-- =====================================================

DROP POLICY IF EXISTS "Owners can delete property bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Owners can read property bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Owners can update property bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Tenants can delete own bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Tenants can read own bookings" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "Tenants can update own bookings" ON public.bookings CASCADE;

COMMIT;

-- =====================================================
-- Verify - should show only 7 policies now
-- =====================================================

SELECT 
    policyname,
    cmd,
    'ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

-- Count policies
SELECT 
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) = 7 THEN '✓ CORRECT - 7 policies'
        ELSE '✗ WRONG - Should be 7'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings';

-- =====================================================
-- Success Message
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bookings';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ DUPLICATE POLICIES CLEANED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Result:';
    RAISE NOTICE '  Total policies: %', policy_count;
    RAISE NOTICE '  Expected: 7';
    RAISE NOTICE '';
    IF policy_count = 7 THEN
        RAISE NOTICE '✓ PERFECT! Correct number of policies';
    ELSE
        RAISE NOTICE '⚠ Warning: Expected 7, got %', policy_count;
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'Active policies:';
    RAISE NOTICE '  - bookings_select_tenant (SELECT)';
    RAISE NOTICE '  - bookings_select_owner (SELECT)';
    RAISE NOTICE '  - bookings_insert_tenant (INSERT)';
    RAISE NOTICE '  - bookings_update_tenant (UPDATE)';
    RAISE NOTICE '  - bookings_update_owner (UPDATE)';
    RAISE NOTICE '  - bookings_delete_tenant (DELETE)';
    RAISE NOTICE '  - bookings_delete_owner (DELETE)';
    RAISE NOTICE '============================================';
END $$;
