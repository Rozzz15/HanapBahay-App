-- ============================================
-- Check ALL required tables for HanapBahay
-- ============================================

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users',
        'owner_applications',
        'owner_profiles',
        'owner_verifications',
        'published_listings',
        'bookings',
        'rent_payments',
        'maintenance_requests',
        'payment_accounts',
        'conversations',
        'messages',
        'user_profile_photos',
        'listing_inquiries',
        'complaints',
        'analytics',
        'brgy_notifications',
        'property_amenities',
        'reviews',
        'tenants'
    ];
    tbl_name TEXT;
    exists_check BOOLEAN;
    missing_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking ALL Required Tables';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl_name
        ) INTO exists_check;
        
        IF exists_check THEN
            RAISE NOTICE '✅ % exists', tbl_name;
        ELSE
            RAISE NOTICE '❌ % MISSING', tbl_name;
            missing_count := missing_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary: % missing tables', missing_count;
    RAISE NOTICE '========================================';
END $$;
