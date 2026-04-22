-- =====================================================
-- FIX: Real-time Capacity Updates & Hide Fully Occupied
-- =====================================================
-- Issues to fix:
-- 1. Capacity not updating in real-time on guest/tenant dashboard
-- 2. Fully occupied listings still showing in search results
-- 3. Need to hide listings when capacity = occupied_slots
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Ensure occupied_slots column exists
-- =====================================================

ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS occupied_slots INTEGER DEFAULT 0;

-- =====================================================
-- STEP 2: Create improved capacity update function
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
SECURITY DEFINER
AS $$
DECLARE
    active_bookings INTEGER;
    listing_capacity INTEGER;
    listing_exists BOOLEAN;
BEGIN
    -- Check if the property exists
    SELECT EXISTS(
        SELECT 1 FROM public.published_listings 
        WHERE id = COALESCE(NEW.property_id, OLD.property_id)
    ) INTO listing_exists;
    
    IF NOT listing_exists THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Count ONLY approved/active bookings for this property
    SELECT COUNT(*) INTO active_bookings
    FROM public.bookings
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    AND status IN ('approved', 'active');
    
    -- Get the property capacity
    SELECT capacity INTO listing_capacity
    FROM public.published_listings
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    -- Update the listing with new data
    UPDATE public.published_listings
    SET 
        occupied_slots = active_bookings,
        availability_status = CASE
            WHEN active_bookings >= COALESCE(listing_capacity, 0) THEN 'occupied'
            WHEN active_bookings > 0 THEN 'partially_occupied'
            ELSE 'available'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    RAISE NOTICE 'Updated listing % - Capacity: %, Occupied: %, Status: %', 
        COALESCE(NEW.property_id, OLD.property_id),
        listing_capacity,
        active_bookings,
        CASE
            WHEN active_bookings >= COALESCE(listing_capacity, 0) THEN 'occupied'
            WHEN active_bookings > 0 THEN 'partially_occupied'
            ELSE 'available'
        END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_listing_capacity() IS 'Automatically updates listing capacity in real-time when bookings change';

-- =====================================================
-- STEP 3: Drop and recreate trigger
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_listing_capacity ON public.bookings;

CREATE TRIGGER trigger_update_listing_capacity
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_listing_capacity();

-- =====================================================
-- STEP 4: Update RLS policy to hide fully occupied listings
-- =====================================================

-- Drop existing SELECT policy for published_listings
DROP POLICY IF EXISTS "published_listings_select_all" ON public.published_listings CASCADE;

-- Create new policy that hides fully occupied listings for tenants/guests
-- BUT shows all listings to owners (they need to see their own properties)
CREATE POLICY "published_listings_select_available_or_owner" ON public.published_listings
FOR SELECT TO authenticated
USING (
    -- Show if listing is not fully occupied
    (COALESCE(occupied_slots, 0) < COALESCE(capacity, 1))
    OR
    -- OR if current user is the owner (they can see their own occupied properties)
    (auth.uid() = user_id::uuid)
);

-- =====================================================
-- STEP 5: Recalculate ALL listings NOW
-- =====================================================

DO $$
DECLARE
    listing_record RECORD;
    active_count INTEGER;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting capacity recalculation for all listings...';
    
    FOR listing_record IN 
        SELECT id, capacity, title 
        FROM public.published_listings
        ORDER BY id
    LOOP
        -- Count active bookings for this property
        SELECT COUNT(*) INTO active_count
        FROM public.bookings
        WHERE property_id = listing_record.id
        AND status IN ('approved', 'active');
        
        -- Update the listing
        UPDATE public.published_listings
        SET 
            occupied_slots = active_count,
            availability_status = CASE
                WHEN active_count >= COALESCE(listing_record.capacity, 0) THEN 'occupied'
                WHEN active_count > 0 THEN 'partially_occupied'
                ELSE 'available'
            END,
            updated_at = NOW()
        WHERE id = listing_record.id;
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Updated: % - Capacity: %, Occupied: %', 
            listing_record.title, 
            listing_record.capacity, 
            active_count;
    END LOOP;
    
    RAISE NOTICE 'Recalculation complete! Updated % listings.', updated_count;
END $$;

-- =====================================================
-- STEP 6: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_availability ON public.published_listings(availability_status, occupied_slots, capacity);
CREATE INDEX IF NOT EXISTS idx_bookings_property_status ON public.bookings(property_id, status);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check listings with their current status
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    availability_status,
    (capacity - COALESCE(occupied_slots, 0)) as available_slots,
    CASE 
        WHEN COALESCE(occupied_slots, 0) >= COALESCE(capacity, 1) THEN 'HIDDEN from guests'
        ELSE 'VISIBLE to guests'
    END as visibility_status
FROM public.published_listings
ORDER BY title
LIMIT 20;

-- Check bookings per property
SELECT 
    pl.title,
    pl.capacity,
    pl.occupied_slots,
    COUNT(b.id) as actual_active_bookings,
    pl.availability_status,
    CASE 
        WHEN pl.occupied_slots >= pl.capacity THEN 'HIDDEN'
        ELSE 'VISIBLE'
    END as guest_visibility
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id 
    AND b.status IN ('approved', 'active')
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots, pl.availability_status
ORDER BY pl.title
LIMIT 20;

-- Check published_listings policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%occupied_slots%' THEN 'Hides occupied listings ✓'
        ELSE 'Policy type: ' || cmd
    END as description
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'published_listings'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ CAPACITY REAL-TIME UPDATE & HIDE OCCUPIED FIXED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '  1. ✓ Real-time capacity updates on bookings';
  RAISE NOTICE '  2. ✓ Fully occupied listings HIDDEN from guests/tenants';
  RAISE NOTICE '  3. ✓ Owners can still see their own occupied properties';
  RAISE NOTICE '  4. ✓ Trigger updates capacity automatically';
  RAISE NOTICE '  5. ✓ All existing data recalculated';
  RAISE NOTICE '';
  RAISE NOTICE 'How it works:';
  RAISE NOTICE '  - When booking approved: capacity decreases';
  RAISE NOTICE '  - When all slots filled: listing hidden from guests';
  RAISE NOTICE '  - When booking cancelled: capacity increases, listing reappears';
  RAISE NOTICE '  - Owners always see their listings (for management)';
  RAISE NOTICE '';
  RAISE NOTICE 'Statuses:';
  RAISE NOTICE '  - available: 0 bookings (visible)';
  RAISE NOTICE '  - partially_occupied: Some bookings (visible)';
  RAISE NOTICE '  - occupied: Full capacity (HIDDEN from guests)';
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
-- 6. Listings will now:
--    - Update capacity in real-time
--    - Hide when fully occupied
--    - Show only available/partially occupied to guests
--    - Always show to property owners
-- =====================================================
