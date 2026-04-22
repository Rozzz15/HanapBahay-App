-- =====================================================
-- DEEP DEBUG: Find WHY RLS is blocking
-- =====================================================

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✓ RLS ENABLED' ELSE '✗ RLS DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'published_listings';

-- Check ALL policies (including hidden ones)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text as using_expr,
    with_check::text as with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'published_listings';

-- Check if there are any RESTRICTIVE policies (they override permissive)
SELECT 
    policyname,
    permissive,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✓ Normal policy'
        ELSE '⚠️ RESTRICTIVE (overrides all)'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'published_listings';

-- Try to understand WHO the current user is
SELECT 
    current_user as database_user,
    session_user,
    'Check if using service_role or anon key' as note;

-- Test if policies actually allow operations
DO $$
BEGIN
    -- Test if we can see the table
    RAISE NOTICE 'Testing access...';
    
    PERFORM 1 FROM published_listings LIMIT 1;
    RAISE NOTICE '✓ Can SELECT from published_listings';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ Cannot SELECT: %', SQLERRM;
END $$;

-- Show the actual error from pg_policies if any
SELECT 
    'Final check - if all policies show permissive=PERMISSIVE and WITH CHECK=(true), but still blocking, the issue is elsewhere' as diagnosis;
