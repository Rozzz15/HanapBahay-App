-- =====================================================
-- CHECK WHAT HAS BEEN APPLIED TO YOUR DATABASE
-- =====================================================
-- This will show exactly what's in your database right now
-- =====================================================

-- =====================================================
-- 1. CHECK: Does occupied_slots column exist?
-- =====================================================
SELECT 
    'occupied_slots column' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'published_listings' 
            AND column_name = 'occupied_slots'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- =====================================================
-- 2. CHECK: What's the current data?
-- =====================================================
SELECT 
    'Current listing data' as check_name;

SELECT 
    id,
    title,
    capacity,
    COALESCE(occupied_slots, -999) as occupied_slots,
    availability_status
FROM public.published_listings
LIMIT 5;

-- =====================================================
-- 3. CHECK: Count active bookings per property
-- =====================================================
SELECT 
    'Actual bookings count' as check_name;

SELECT 
    pl.title,
    pl.capacity,
    COALESCE(pl.occupied_slots, -999) as db_occupied_slots,
    COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active')) as actual_active_bookings,
    CASE 
        WHEN COALESCE(pl.occupied_slots, -999) = COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active'))
        THEN '✓ MATCH'
        ELSE '✗ WRONG - Need to recalculate'
    END as accuracy
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots
LIMIT 10;

-- =====================================================
-- 4. CHECK: Does trigger exist?
-- =====================================================
SELECT 
    'Trigger check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_update_listing_capacity'
        ) THEN '✓ TRIGGER EXISTS'
        ELSE '✗ TRIGGER MISSING'
    END as status;

-- =====================================================
-- 5. CHECK: What RLS policies exist on published_listings?
-- =====================================================
SELECT 
    'RLS Policies on published_listings' as check_name;

SELECT 
    policyname,
    cmd,
    SUBSTRING(qual::text, 1, 80) as using_clause_preview
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'published_listings'
ORDER BY policyname;

-- =====================================================
-- 6. CHECK: What RLS policies exist on bookings?
-- =====================================================
SELECT 
    'RLS Policies on bookings' as check_name;

SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings'
ORDER BY policyname;

-- =====================================================
-- 7. CHECK: Can you see listings? (simulating user query)
-- =====================================================
SELECT 
    'Total listings visible' as check_name,
    COUNT(*) as count
FROM public.published_listings;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE STATE CHECK COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the results above to see:';
    RAISE NOTICE '  1. If occupied_slots column exists';
    RAISE NOTICE '  2. Current capacity data';
    RAISE NOTICE '  3. If data matches actual bookings';
    RAISE NOTICE '  4. If trigger exists';
    RAISE NOTICE '  5. What RLS policies are active';
    RAISE NOTICE '  6. How many listings are visible';
    RAISE NOTICE '';
    RAISE NOTICE 'Based on results, you will know what needs to be fixed.';
    RAISE NOTICE '============================================';
END $$;
