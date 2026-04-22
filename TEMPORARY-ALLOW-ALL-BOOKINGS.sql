-- =====================================================
-- TEMPORARY: Allow All Operations on Bookings
-- =====================================================
-- WARNING: This is INSECURE - only for testing!
-- This will help us determine if the issue is RLS or something else
-- =====================================================

BEGIN;

-- Drop all restrictive policies
DROP POLICY IF EXISTS "bookings_select_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_select_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_insert_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_update_owner" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_tenant" ON public.bookings CASCADE;
DROP POLICY IF EXISTS "bookings_delete_owner" ON public.bookings CASCADE;

-- Create TEMPORARY permissive policies (FOR TESTING ONLY!)
CREATE POLICY "bookings_all_operations_temp" ON public.bookings
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;

-- Verify
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings';

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: TEMPORARY INSECURE POLICIES ACTIVE!';
    RAISE NOTICE '';
    RAISE NOTICE 'All authenticated users can now:';
    RAISE NOTICE '  - View ALL bookings';
    RAISE NOTICE '  - Create ANY booking';
    RAISE NOTICE '  - Update ANY booking';
    RAISE NOTICE '  - Delete ANY booking';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST YOUR APP NOW:';
    RAISE NOTICE '  1. Try creating a booking';
    RAISE NOTICE '  2. Try deleting a booking';
    RAISE NOTICE '  3. Check if it works';
    RAISE NOTICE '';
    RAISE NOTICE 'If it works, the problem is RLS policies';
    RAISE NOTICE 'If it still fails, the problem is in your app code';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  REMEMBER TO RESTORE SECURE POLICIES AFTER TESTING!';
END $$;
