-- =====================================================
-- FIX: Update Capacity When Booking is Marked as PAID
-- =====================================================
-- Problem: Capacity only updates on 'approved', not on 'paid'
-- Solution: Update trigger to count 'paid' status too
-- =====================================================

BEGIN;

-- =====================================================
-- Check current booking statuses
-- =====================================================

SELECT 
    status,
    COUNT(*) as count
FROM public.bookings
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- Update the trigger function to include 'paid' status
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
    
    -- Count bookings with these statuses as "occupied":
    -- - approved: Owner approved the booking
    -- - paid: Tenant paid for the booking
    -- - active: Tenant is currently staying
    SELECT COUNT(*) INTO v_active_count
    FROM public.bookings
    WHERE property_id = v_property_id
    AND status IN ('approved', 'paid', 'active');
    
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
    
    RAISE NOTICE 'Updated capacity for property %: % of % slots occupied', 
        v_property_id, v_active_count, v_capacity;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- Ensure trigger exists
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_listing_capacity ON public.bookings;

CREATE TRIGGER trigger_update_listing_capacity
    AFTER INSERT OR UPDATE OR DELETE 
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_capacity();

-- =====================================================
-- Recalculate ALL listings with new logic (including 'paid')
-- =====================================================

UPDATE public.published_listings
SET 
    occupied_slots = (
        SELECT COUNT(*) 
        FROM public.bookings 
        WHERE property_id = public.published_listings.id
        AND status IN ('approved', 'paid', 'active')
    ),
    availability_status = CASE
        WHEN (
            SELECT COUNT(*) 
            FROM public.bookings 
            WHERE property_id = public.published_listings.id 
            AND status IN ('approved', 'paid', 'active')
        ) >= capacity THEN 'occupied'
        WHEN (
            SELECT COUNT(*) 
            FROM public.bookings 
            WHERE property_id = public.published_listings.id 
            AND status IN ('approved', 'paid', 'active')
        ) > 0 THEN 'partially_occupied'
        ELSE 'available'
    END,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================

-- Show all listings with their status
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    (capacity - COALESCE(occupied_slots, 0)) as available,
    availability_status
FROM public.published_listings
ORDER BY title;

-- Show bookings per property with all statuses
SELECT 
    pl.title,
    pl.capacity,
    pl.occupied_slots as "DB occupied",
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN b.status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN b.status = 'paid' THEN 1 END) as paid,
    COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN b.status IN ('approved', 'paid', 'active') THEN 1 END) as "Should be occupied"
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots
ORDER BY pl.title;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ CAPACITY NOW UPDATES ON PAID STATUS!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Now counts as occupied:';
    RAISE NOTICE '  - approved: Owner approved booking';
    RAISE NOTICE '  - paid: Tenant marked as paid';
    RAISE NOTICE '  - active: Tenant currently staying';
    RAISE NOTICE '';
    RAISE NOTICE 'Not counted as occupied:';
    RAISE NOTICE '  - pending: Waiting for approval';
    RAISE NOTICE '  - rejected: Owner rejected';
    RAISE NOTICE '  - cancelled: Booking cancelled';
    RAISE NOTICE '  - completed: Stay finished';
    RAISE NOTICE '';
    RAISE NOTICE 'Trigger will fire on:';
    RAISE NOTICE '  - New booking created';
    RAISE NOTICE '  - Status changed (pending→approved→paid→active)';
    RAISE NOTICE '  - Booking deleted';
    RAISE NOTICE '';
    RAISE NOTICE 'All tenants/guests will see updated capacity!';
    RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- Test the trigger
-- =====================================================

DO $$
DECLARE
    test_listing_id TEXT;
BEGIN
    -- Find a listing to test
    SELECT id INTO test_listing_id 
    FROM public.published_listings 
    LIMIT 1;
    
    IF test_listing_id IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Testing trigger on listing: %', test_listing_id;
        RAISE NOTICE 'Try updating a booking status in your app...';
        RAISE NOTICE 'The capacity should update automatically!';
    END IF;
END $$;
