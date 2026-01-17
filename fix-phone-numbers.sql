-- Fix incomplete phone numbers in bookings table
-- This script updates bookings where tenant_phone is just '+63' to empty string
-- so it displays as "Not provided" in the UI

-- Step 1: Check current incomplete phone numbers
SELECT 
    id,
    tenant_name,
    tenant_phone,
    status,
    created_at
FROM public.bookings
WHERE tenant_phone = '+63' OR tenant_phone LIKE '+63%' AND LENGTH(tenant_phone) < 12
ORDER BY created_at DESC;

-- Step 2: Update incomplete phone numbers to empty string
UPDATE public.bookings
SET 
    tenant_phone = '',
    updated_at = NOW()
WHERE tenant_phone = '+63' OR (tenant_phone LIKE '+63%' AND LENGTH(tenant_phone) < 12);

-- Step 3: Verify the update
SELECT 
    COUNT(*) as total_fixed,
    'Bookings with phone numbers fixed' as description
FROM public.bookings
WHERE tenant_phone = '';

-- Step 4: Show all bookings with their current phone status
SELECT 
    id,
    tenant_name,
    CASE 
        WHEN tenant_phone = '' THEN 'Not provided'
        WHEN tenant_phone = '+63' THEN 'Incomplete (should not happen)'
        WHEN LENGTH(tenant_phone) < 12 THEN 'Incomplete'
        ELSE tenant_phone
    END as phone_status,
    status,
    created_at
FROM public.bookings
ORDER BY created_at DESC
LIMIT 10;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Phone number fix completed!';
    RAISE NOTICE '📋 Incomplete phone numbers have been cleared';
    RAISE NOTICE '💡 They will now show as "Not provided" in the UI';
END $$;
