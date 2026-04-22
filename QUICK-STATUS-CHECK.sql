-- Quick status check of all tables
SELECT 'published_listings' as table_name, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'published_listings'
UNION ALL
SELECT 'bookings', COUNT(*)
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'bookings';

-- Show all policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('published_listings', 'bookings')
ORDER BY tablename, policyname;
