-- =====================================================
-- FINAL WORKING FIX - Based on Your Actual Data
-- =====================================================
-- I can see you have 6 approved bookings for one listing
-- but occupied_slots is not showing correctly
-- This will fix it once and for all
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Ensure occupied_slots column exists
-- =====================================================

DO $$ 
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'occupied_slots'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN occupied_slots INTEGER DEFAULT 0;
        RAISE NOTICE '✓ Added occupied_slots column';
    ELSE
        RAISE NOTICE '✓ occupied_slots column already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 2: FORCE UPDATE ALL LISTINGS RIGHT NOW
-- =====================================================

-- Update listing_1768594883151_u9hc0o specifically (the one with 6 approved bookings)
UPDATE public.published_listings
SET 
    occupied_slots = (
        SELECT COUNT(*) 
        FROM public.bookings 
        WHERE property_id = 'listing_1768594883151_u9hc0o'
        AND status = 'approved'
    ),
    availability_status = CASE
        WHEN (SELECT COUNT(*) FROM public.bookings WHERE property_id = 'listing_1768594883151_u9hc0o' AND status = 'approved') >= capacity 
        THEN 'occupied'
        WHEN (SELECT COUNT(*) FROM public.bookings WHERE property_id = 'listing_1768594883151_u9hc0o' AND status = 'approved') > 0 
        THEN 'partially_occupied'
        ELSE 'available'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'listing_1768594883151_u9hc0o';

-- Update ALL other listings too
UPDATE public.published_listings
SET 
    occupied_slots = (
        SELECT COUNT(*) 
        FROM public.bookings 
        WHERE property_id = public.published_listings.id
        AND status IN ('approved', 'active')
    ),
    availability_status = CASE
        WHEN (
            SELECT COUNT(*) 
            FROM public.bookings 
            WHERE property_id = public.published_listings.id 
            AND status IN ('approved', 'active')
        ) >= capacity THEN 'occupied'
        WHEN (
            SELECT COUNT(*) 
            FROM public.bookings 
            WHERE property_id = public.published_listings.id 
            AND status IN ('approved', 'active')
        ) > 0 THEN 'partially_occupied'
        ELSE 'available'
    END,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 3: Create the update function
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_property_id TEXT;
    v_active_count INTEGER;
    v_capacity INTEGER;
BEGIN
    v_property_id := COALESCE(NEW.property_id, OLD.property_id);
    
    IF v_property_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Count approved/active bookings
    SELECT COUNT(*) INTO v_active_count
    FROM public.bookings
    WHERE property_id = v_property_id
    AND status IN ('approved', 'active');
    
    -- Get capacity
    SELECT capacity INTO v_capacity
    FROM public.published_listings
    WHERE id = v_property_id;
    
    -- Update the listing
    UPDATE public.published_listings
    SET 
        occupied_slots = v_active_count,
        availability_status = CASE
            WHEN v_active_count >= COALESCE(v_capacity, 0) THEN 'occupied'
            WHEN v_active_count > 0 THEN 'partially_occupied'
            ELSE 'available'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_property_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- STEP 4: Create the trigger
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_listing_capacity ON public.bookings;

CREATE TRIGGER trigger_update_listing_capacity
    AFTER INSERT OR UPDATE OR DELETE 
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_capacity();

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show the updated listing
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    availability_status,
    (capacity - COALESCE(occupied_slots, 0)) as available_slots
FROM public.published_listings
WHERE id = 'listing_1768594883151_u9hc0o';

-- Verify against actual bookings
SELECT 
    'listing_1768594883151_u9hc0o' as listing_id,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_bookings,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings
FROM public.bookings
WHERE property_id = 'listing_1768594883151_u9hc0o';

-- Show all listings status
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    (capacity - COALESCE(occupied_slots, 0)) as available,
    availability_status
FROM public.published_listings
ORDER BY title;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
    v_occupied INTEGER;
    v_capacity INTEGER;
BEGIN
    SELECT occupied_slots, capacity INTO v_occupied, v_capacity
    FROM public.published_listings
    WHERE id = 'listing_1768594883151_u9hc0o';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ CAPACITY FIXED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Your listing listing_1768594883151_u9hc0o:';
    RAISE NOTICE '  Capacity: %', v_capacity;
    RAISE NOTICE '  Occupied: %', v_occupied;
    RAISE NOTICE '  Available: %', v_capacity - COALESCE(v_occupied, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '  ✓ Added/verified occupied_slots column';
    RAISE NOTICE '  ✓ Recalculated ALL listings';
    RAISE NOTICE '  ✓ Created update function';
    RAISE NOTICE '  ✓ Created trigger for future updates';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your app - capacity should show correctly!';
    RAISE NOTICE '============================================';
END $$;
