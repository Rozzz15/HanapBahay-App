-- =====================================================
-- FIX: Sync Listing Capacity with Bookings
-- =====================================================
-- Problem: Listings show all capacity available even when tenants have booked
-- Solution: Create trigger to update listing capacity when bookings change
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add column to track occupied slots (if not exists)
-- =====================================================

-- Add occupied_slots column to track current bookings
ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS occupied_slots INTEGER DEFAULT 0;

-- =====================================================
-- STEP 2: Create function to update listing capacity
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    active_bookings INTEGER;
    listing_capacity INTEGER;
BEGIN
    -- Count active/approved bookings for this listing
    SELECT COUNT(*) INTO active_bookings
    FROM public.bookings
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    AND status IN ('approved', 'active', 'occupied');
    
    -- Get the listing capacity
    SELECT capacity INTO listing_capacity
    FROM public.published_listings
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    -- Update the listing
    UPDATE public.published_listings
    SET 
        occupied_slots = active_bookings,
        availability_status = CASE
            WHEN active_bookings >= listing_capacity THEN 'occupied'
            WHEN active_bookings > 0 THEN 'partially_occupied'
            ELSE 'available'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_listing_capacity() IS 'Automatically updates listing capacity when bookings change';

-- =====================================================
-- STEP 3: Create trigger on bookings table
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_listing_capacity ON public.bookings;

-- Create trigger that fires on INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_listing_capacity
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_listing_capacity();

-- =====================================================
-- STEP 4: Recalculate all listing capacities NOW
-- =====================================================

DO $$
DECLARE
    listing_record RECORD;
    active_count INTEGER;
BEGIN
    FOR listing_record IN SELECT DISTINCT id, capacity FROM public.published_listings
    LOOP
        -- Count active bookings for this listing
        SELECT COUNT(*) INTO active_count
        FROM public.bookings
        WHERE property_id = listing_record.id
        AND status IN ('approved', 'active', 'occupied');
        
        -- Update the listing
        UPDATE public.published_listings
        SET 
            occupied_slots = active_count,
            availability_status = CASE
                WHEN active_count >= listing_record.capacity THEN 'occupied'
                WHEN active_count > 0 THEN 'partially_occupied'
                ELSE 'available'
            END,
            updated_at = NOW()
        WHERE id = listing_record.id;
    END LOOP;
    
    RAISE NOTICE 'Recalculated capacity for all listings';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check the new column was added
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'published_listings'
  AND column_name = 'occupied_slots';

-- Check listings with their capacity status
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    availability_status,
    (capacity - COALESCE(occupied_slots, 0)) as available_slots
FROM public.published_listings
ORDER BY title
LIMIT 10;

-- Check bookings count per listing
SELECT 
    pl.id,
    pl.title,
    pl.capacity,
    pl.occupied_slots,
    COUNT(b.id) as actual_booking_count,
    pl.availability_status
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id 
    AND b.status IN ('approved', 'active', 'occupied')
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots, pl.availability_status
ORDER BY pl.title
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ LISTING CAPACITY SYNC FIXED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Added occupied_slots column';
  RAISE NOTICE '  ✓ Created update_listing_capacity() function';
  RAISE NOTICE '  ✓ Added trigger on bookings table';
  RAISE NOTICE '  ✓ Recalculated all existing listings';
  RAISE NOTICE '';
  RAISE NOTICE 'How it works:';
  RAISE NOTICE '  - When booking is created/approved: capacity decreases';
  RAISE NOTICE '  - When booking is cancelled/deleted: capacity increases';
  RAISE NOTICE '  - Status auto-updates: available/partially_occupied/occupied';
  RAISE NOTICE '';
  RAISE NOTICE 'Statuses:';
  RAISE NOTICE '  - available: No active bookings';
  RAISE NOTICE '  - partially_occupied: Some slots filled';
  RAISE NOTICE '  - occupied: All slots filled';
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
-- 6. Listings will now auto-update when bookings change!
-- =====================================================

-- =====================================================
-- NOTES
-- =====================================================
-- Booking statuses that count as "occupied":
--   - approved: Booking is approved by owner
--   - active: Tenant has moved in
--   - occupied: Currently occupying
--
-- Booking statuses that DON'T count:
--   - pending: Waiting for approval
--   - rejected: Owner rejected
--   - cancelled: Tenant cancelled
--   - completed: Lease ended
-- =====================================================
