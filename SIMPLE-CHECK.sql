-- =====================================================
-- SIMPLE DATABASE CHECK - Run each query separately
-- =====================================================

-- QUERY 1: Check if occupied_slots column exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'published_listings' 
AND column_name IN ('capacity', 'occupied_slots', 'availability_status');

-- QUERY 2: Show actual listing data
SELECT 
    id,
    title,
    capacity,
    occupied_slots,
    availability_status
FROM public.published_listings;

-- QUERY 3: Count bookings per property
SELECT 
    pl.title,
    pl.capacity,
    pl.occupied_slots as "DB says occupied",
    COUNT(b.id) as "Actual bookings (any status)",
    COUNT(CASE WHEN b.status IN ('approved', 'active') THEN 1 END) as "Active bookings only"
FROM public.published_listings pl
LEFT JOIN public.bookings b ON b.property_id = pl.id
GROUP BY pl.id, pl.title, pl.capacity, pl.occupied_slots;

-- QUERY 4: Check if trigger exists
SELECT 
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trigger_update_listing_capacity';

-- QUERY 5: Show all bookings with their status
SELECT 
    id,
    property_id,
    tenant_id,
    status,
    created_at
FROM public.bookings
ORDER BY created_at DESC
LIMIT 10;
