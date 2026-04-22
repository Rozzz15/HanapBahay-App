-- =====================================================
-- COMPLETE VERIFICATION AND FIX - CAPACITY SYSTEM
-- =====================================================
-- This script will:
-- 1. Check what's currently in the database
-- 2. Fix ALL capacity issues definitively
-- 3. Verify the fix worked
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 1: CHECKING CURRENT STATE';
    RAISE NOTICE '============================================';
END $$;

-- Check if occupied_slots column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'published_listings' 
            AND column_name = 'occupied_slots'
        ) THEN '✓ occupied_slots column EXISTS'
        ELSE '✗ occupied_slots column MISSING - will add it'
    END as column_status;

-- Check current trigger
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_update_listing_capacity'
        ) THEN '✓ Trigger EXISTS'
        ELSE '✗ Trigger MISSING - will create it'
    END as trigger_status;

-- Check current data
SELECT 
    COUNT(*) as total_listings,
    COUNT(CASE WHEN occupied_slots IS NOT NULL THEN 1 END) as with_occupied_slots,
    COUNT(CASE WHEN occupied_slots IS NULL THEN 1 END) as without_occupied_slots
FROM public.published_listings;

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 2: APPLYING COMPLETE FIX';
    RAISE NOTICE '============================================';
END $$;

BEGIN;

-- =====================================================
-- ADD occupied_slots COLUMN (if missing)
-- =====================================================

DO $$ 
BEGIN
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
-- CREATE/REPLACE CAPACITY UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
SECURITY DEFINER
AS $$
DECLARE
    v_property_id TEXT;
    v_active_bookings INTEGER;
    v_capacity INTEGER;
BEGIN
    -- Get the property_id from NEW or OLD
    v_property_id := COALESCE(NEW.property_id, OLD.property_id);
    
    -- Skip if no property_id
    IF v_property_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Count active bookings (approved or active status only)
    SELECT COUNT(*) INTO v_active_bookings
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
        occupied_slots = v_active_bookings,
        availability_status = CASE
            WHEN v_active_bookings >= COALESCE(v_capacity, 0) THEN 'occupied'
            WHEN v_active_bookings > 0 THEN 'partially_occupied'
            ELSE 'available'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_property_id;
    
    RAISE NOTICE 'Updated property %: capacity=%, occupied=%, status=%', 
        v_property_id, v_capacity, v_active_bookings,
        CASE
            WHEN v_active_bookings >= COALESCE(v_capacity, 0) THEN 'occupied'
            WHEN v_active_bookings > 0 THEN 'partially_occupied'
            ELSE 'available'
        END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_listing_capacity() IS 'Updates listing capacity when bookings change';

-- =====================================================
-- CREATE TRIGGER (drop and recreate to ensure it works)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_listing_capacity ON public.bookings;

CREATE TRIGGER trigger_update_listing_capacity
    AFTER INSERT OR UPDATE OF status OR DELETE 
    ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_capacity();

DO $$
BEGIN
    RAISE NOTICE '✓ Trigger created/recreated';
END $$;

-- =====================================================
-- UPDATE RLS POLICY TO HIDE FULLY OCCUPIED
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "published_listings_select_all" ON public.published_listings CASCADE;
DROP POLICY IF EXISTS "published_listings_select_available_or_owner" ON public.published_listings CASCADE;

-- Create new policy that hides occupied listings from guests
-- but shows them to owners
CREATE POLICY "published_listings_select_with_capacity" ON public.published_listings
FOR SELECT TO authenticated
USING (
    -- Show if not fully occupied
    (COALESCE(occupied_slots, 0) < COALESCE(capacity, 1))
    OR 
    -- OR if user is the owner
    (auth.uid() = user_id::uuid)
);

DO $$
BEGIN
    RAISE NOTICE '✓ RLS policy updated to hide occupied listings';
END $$;

-- =====================================================
-- RECALCULATE ALL EXISTING LISTINGS RIGHT NOW
-- =====================================================

DO $$ 
DECLARE
    v_listing RECORD;
    v_count INTEGER := 0;
    v_active INTEGER;
BEGIN
    RAISE NOTICE 'Recalculating all listings...';
    
    FOR v_listing IN 
        SELECT id, title, capacity 
        FROM public.published_listings
    LOOP
        -- Count active bookings
        SELECT COUNT(*) INTO v_active
        FROM public.bookings
        WHERE property_id = v_listing.id
        AND status IN ('approved', 'active');
        
        -- Update
        UPDATE public.published_listings
        SET 
            occupied_slots = v_active,
            availability_status = CASE
                WHEN v_active >= COALESCE(v_listing.capacity, 0) THEN 'occupied'
                WHEN v_active > 0 THEN 'partially_occupied'
                ELSE 'available'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_listing.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE '✓ Recalculated % listings', v_count;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_capacity_status 
    ON public.published_listings(occupied_slots, capacity, availability_status);
    
CREATE INDEX IF NOT EXISTS idx_bookings_property_status 
    ON public.bookings(property_id, status);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 3: VERIFICATION';
    RAISE NOTICE '============================================';
END $$;

-- Show all listings with their status
SELECT 
    title,
    capacity,
    occupied_slots,
    (capacity - COALESCE(occupied_slots, 0)) as available,
    availability_status,
    CASE 
        WHEN COALESCE(occupied_slots, 0) >= capacity THEN 'HIDDEN from guests'
        ELSE 'VISIBLE to guests'
    END as guest_visibility
FROM public.published_listings
ORDER BY title;

-- Show bookings count per property
SELECT 
    pl.title,
    pl.capacity,
    COUNT(CASE WHEN b.status IN ('approved', 'active') THEN 1 END) as active_bookings,
    pl.occupied_slots,
    CASE 
        WHEN COUNT(CASE WHEN b.status IN ('approved', 'active') THEN 1 END) = pl.occupied_slots 
        THEN '✓ MATCH'
        ELSE '✗ MISMATCH'
    END as data_accuracy
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots
ORDER BY pl.title;

-- Check trigger exists
SELECT 
    tgname as trigger_name,
    '✓ ACTIVE' as status
FROM pg_trigger 
WHERE tgname = 'trigger_update_listing_capacity';

-- Check RLS policy
SELECT 
    policyname,
    cmd,
    '✓ ACTIVE' as status
FROM pg_policies 
WHERE tablename = 'published_listings' 
AND policyname = 'published_listings_select_with_capacity';

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✓ COMPLETE! ALL FIXES APPLIED';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  ✓ occupied_slots column added/verified';
    RAISE NOTICE '  ✓ Trigger created and active';
    RAISE NOTICE '  ✓ RLS policy hides fully occupied';
    RAISE NOTICE '  ✓ All existing data recalculated';
    RAISE NOTICE '  ✓ Indexes added for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'What happens now:';
    RAISE NOTICE '  - When booking approved: capacity decreases';
    RAISE NOTICE '  - When fully booked: listing hidden from guests';
    RAISE NOTICE '  - When cancelled: listing reappears';
    RAISE NOTICE '  - Owners always see their properties';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Refresh your app to see changes!';
    RAISE NOTICE '============================================';
END $$;
