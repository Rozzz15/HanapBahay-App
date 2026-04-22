-- =====================================================
-- CHECK ACTUAL COLUMN TYPES AND FIX RLS
-- =====================================================

-- STEP 1: Check what types tenant_id and owner_id actually are
SELECT 
    column_name,
    data_type,
    udt_name,
    'Bookings table column info' as note
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'bookings'
AND column_name IN ('tenant_id', 'owner_id')
ORDER BY column_name;

-- STEP 2: Check a sample booking to see actual values
SELECT 
    id,
    tenant_id,
    owner_id,
    pg_typeof(tenant_id) as tenant_id_type,
    pg_typeof(owner_id) as owner_id_type,
    'Sample booking types' as note
FROM public.bookings
LIMIT 1;

-- STEP 3: Check current user ID
SELECT 
    auth.uid() as current_user_id,
    pg_typeof(auth.uid()) as user_id_type,
    'Current auth user' as note;

-- STEP 4: Test if current policies work
DO $$
DECLARE
    can_see_bookings BOOLEAN;
BEGIN
    -- Try to see if user can see any bookings
    SELECT EXISTS(SELECT 1 FROM public.bookings LIMIT 1) INTO can_see_bookings;
    
    RAISE NOTICE 'Can see bookings: %', can_see_bookings;
END $$;

-- Based on the results above, we'll know the exact issue
-- Run this and show me ALL the output tables!
