-- =====================================================
-- CANCEL DUPLICATE BOOKINGS (OPTION A)
-- =====================================================
-- Problem: Same tenant has 6 approved bookings for same property
-- Solution: Keep only the first booking, cancel the rest
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Show what will be cancelled
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'BOOKINGS THAT WILL BE CANCELLED';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    id,
    property_id,
    tenant_id,
    status,
    created_at,
    'WILL BE CANCELLED' as action
FROM public.bookings
WHERE property_id = 'listing_1768594883151_u9hc0o'
AND tenant_id = '5685f785-3c05-49e4-b30e-38ef3ec9f01b'
AND status = 'approved'
AND id NOT IN (
    SELECT id 
    FROM public.bookings 
    WHERE property_id = 'listing_1768594883151_u9hc0o'
    AND tenant_id = '5685f785-3c05-49e4-b30e-38ef3ec9f01b'
    AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT 1
);

-- =====================================================
-- STEP 2: Keep only the oldest booking
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'BOOKING THAT WILL BE KEPT';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    id,
    property_id,
    tenant_id,
    status,
    created_at,
    'WILL BE KEPT' as action
FROM public.bookings 
WHERE property_id = 'listing_1768594883151_u9hc0o'
AND tenant_id = '5685f785-3c05-49e4-b30e-38ef3ec9f01b'
AND status = 'approved'
ORDER BY created_at ASC
LIMIT 1;

-- =====================================================
-- STEP 3: Cancel the duplicate bookings
-- =====================================================

UPDATE public.bookings
SET 
    status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE property_id = 'listing_1768594883151_u9hc0o'
AND tenant_id = '5685f785-3c05-49e4-b30e-38ef3ec9f01b'
AND status = 'approved'
AND id NOT IN (
    SELECT id 
    FROM public.bookings 
    WHERE property_id = 'listing_1768594883151_u9hc0o'
    AND tenant_id = '5685f785-3c05-49e4-b30e-38ef3ec9f01b'
    AND status = 'approved'
    ORDER BY created_at ASC
    LIMIT 1
);

-- The trigger will automatically update occupied_slots!

COMMIT;

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'AFTER CANCELLATION';
    RAISE NOTICE '============================================';
END $$;

-- Show all bookings for this property now
SELECT 
    id,
    tenant_id,
    status,
    created_at
FROM public.bookings
WHERE property_id = 'listing_1768594883151_u9hc0o'
ORDER BY created_at DESC;

-- Show the updated listing capacity
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    (capacity - COALESCE(occupied_slots, 0)) as available,
    availability_status
FROM public.published_listings
WHERE id = 'listing_1768594883151_u9hc0o';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
    v_capacity INTEGER;
    v_occupied INTEGER;
    v_available INTEGER;
BEGIN
    SELECT capacity, occupied_slots 
    INTO v_capacity, v_occupied
    FROM public.published_listings
    WHERE id = 'listing_1768594883151_u9hc0o';
    
    v_available := v_capacity - COALESCE(v_occupied, 0);
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ DUPLICATE BOOKINGS CANCELLED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Result:';
    RAISE NOTICE '  Capacity: %', v_capacity;
    RAISE NOTICE '  Occupied: %', v_occupied;
    RAISE NOTICE '  Available: %', v_available;
    RAISE NOTICE '';
    RAISE NOTICE 'What happened:';
    RAISE NOTICE '  - Kept the first booking (oldest)';
    RAISE NOTICE '  - Cancelled 5 duplicate bookings';
    RAISE NOTICE '  - Trigger automatically updated occupied_slots';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your app - capacity should be correct now!';
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
-- 6. Check the output to verify
-- 7. Refresh your app - should show correct capacity!
-- =====================================================
