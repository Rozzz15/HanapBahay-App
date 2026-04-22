-- =====================================================
-- FORCE RECALCULATE ALL LISTING CAPACITY NOW
-- =====================================================
-- Problem: occupied_slots not showing correct values
-- Solution: Manually recalculate all listings right now
-- =====================================================

-- =====================================================
-- STEP 1: Check current state
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'BEFORE RECALCULATION';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    pl.id,
    pl.title,
    pl.capacity,
    pl.occupied_slots as current_occupied_slots,
    COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active')) as actual_active_bookings,
    CASE 
        WHEN pl.occupied_slots = COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active')) 
        THEN '✓ MATCH'
        ELSE '✗ MISMATCH - NEEDS UPDATE'
    END as status
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots
ORDER BY pl.title;

-- =====================================================
-- STEP 2: Force recalculate ALL listings
-- =====================================================

DO $$ 
DECLARE
    listing_record RECORD;
    active_bookings INTEGER;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RECALCULATING ALL LISTINGS...';
    RAISE NOTICE '============================================';
    
    FOR listing_record IN 
        SELECT id, title, capacity 
        FROM public.published_listings
        ORDER BY title
    LOOP
        -- Count active bookings for this property
        SELECT COUNT(*) INTO active_bookings
        FROM public.bookings
        WHERE property_id = listing_record.id
        AND status IN ('approved', 'active');
        
        -- Update the listing
        UPDATE public.published_listings
        SET 
            occupied_slots = active_bookings,
            availability_status = CASE
                WHEN active_bookings >= COALESCE(listing_record.capacity, 0) THEN 'occupied'
                WHEN active_bookings > 0 THEN 'partially_occupied'
                ELSE 'available'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = listing_record.id;
        
        updated_count := updated_count + 1;
        
        IF active_bookings > 0 THEN
            RAISE NOTICE 'Updated: % - Capacity: %, Occupied: %', 
                listing_record.title, 
                listing_record.capacity, 
                active_bookings;
        END IF;
    END LOOP;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ RECALCULATION COMPLETE!';
    RAISE NOTICE 'Updated % listings', updated_count;
    RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- STEP 3: Verify the results
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'AFTER RECALCULATION';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    pl.id,
    pl.title,
    pl.capacity,
    pl.occupied_slots as updated_occupied_slots,
    COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active')) as actual_active_bookings,
    pl.availability_status,
    (pl.capacity - COALESCE(pl.occupied_slots, 0)) as available_slots,
    CASE 
        WHEN pl.occupied_slots = COUNT(b.id) FILTER (WHERE b.status IN ('approved', 'active')) 
        THEN '✓ CORRECT'
        ELSE '✗ STILL WRONG'
    END as accuracy
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots, pl.availability_status
ORDER BY pl.title;

-- =====================================================
-- STEP 4: Check if trigger exists and is active
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CHECKING TRIGGER STATUS';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE tgenabled
        WHEN 'O' THEN '✓ ACTIVE'
        WHEN 'D' THEN '✗ DISABLED'
        ELSE '? UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'trigger_update_listing_capacity';

-- If trigger doesn't exist, show this
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_listing_capacity')
        THEN '✓ Trigger exists and should work'
        ELSE '✗ Trigger MISSING - need to create it!'
    END as trigger_check;

-- =====================================================
-- STEP 5: Test the trigger by updating a booking
-- =====================================================

DO $$
DECLARE
    test_booking_id TEXT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'TESTING TRIGGER...';
    RAISE NOTICE '============================================';
    
    -- Find a booking to test with
    SELECT id INTO test_booking_id
    FROM public.bookings
    WHERE status IN ('approved', 'active')
    LIMIT 1;
    
    IF test_booking_id IS NOT NULL THEN
        -- Touch the booking to trigger the update
        UPDATE public.bookings
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = test_booking_id;
        
        RAISE NOTICE '✓ Trigger test completed';
        RAISE NOTICE 'If occupied_slots updated, trigger is working!';
    ELSE
        RAISE NOTICE 'No active bookings found to test trigger';
    END IF;
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
    total_listings INTEGER;
    listings_with_bookings INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_listings FROM public.published_listings;
    SELECT COUNT(*) INTO listings_with_bookings 
    FROM public.published_listings 
    WHERE occupied_slots > 0;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ DONE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Results:';
    RAISE NOTICE '  Total listings: %', total_listings;
    RAISE NOTICE '  Listings with bookings: %', listings_with_bookings;
    RAISE NOTICE '';
    RAISE NOTICE 'What to do:';
    RAISE NOTICE '  1. Check the tables above for accuracy';
    RAISE NOTICE '  2. Refresh your app';
    RAISE NOTICE '  3. occupied_slots should now show correctly';
    RAISE NOTICE '  4. If trigger missing, run VERIFY-AND-FIX-CAPACITY-COMPLETE.sql';
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
-- 6. Check the output tables
-- 7. Refresh your app - capacity should be correct!
-- =====================================================
