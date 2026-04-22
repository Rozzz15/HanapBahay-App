-- =====================================================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- =====================================================
-- This will tell us if RLS is the problem or not
-- =====================================================

-- Disable RLS on published_listings
ALTER TABLE public.published_listings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bookings
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Check status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED ✓'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('published_listings', 'bookings');

-- Message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '⚠️ RLS DISABLED FOR TESTING';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS is now OFF for:';
    RAISE NOTICE '  - published_listings';
    RAISE NOTICE '  - bookings';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST YOUR APP NOW:';
    RAISE NOTICE '  1. View listing details';
    RAISE NOTICE '  2. Create/delete bookings';
    RAISE NOTICE '  3. Check if errors gone';
    RAISE NOTICE '';
    RAISE NOTICE 'If it works now → Problem is RLS';
    RAISE NOTICE 'If still fails → Problem is app code';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ RE-ENABLE RLS AFTER TESTING!';
    RAISE NOTICE '============================================';
END $$;
