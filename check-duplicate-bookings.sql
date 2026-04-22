-- Check for duplicate bookings (same tenant, same property, multiple approved)
SELECT 
    property_id,
    tenant_id,
    COUNT(*) as booking_count,
    STRING_AGG(id, ', ') as booking_ids,
    STRING_AGG(status, ', ') as statuses
FROM public.bookings
WHERE property_id = 'listing_1768594883151_u9hc0o'
AND status = 'approved'
GROUP BY property_id, tenant_id
HAVING COUNT(*) > 1;

-- Show all bookings for this property
SELECT 
    id,
    tenant_id,
    status,
    created_at
FROM public.bookings
WHERE property_id = 'listing_1768594883151_u9hc0o'
ORDER BY created_at DESC;
