-- Check RLS policies on messages table
-- Run EACH query separately in Supabase SQL Editor

-- Query 1: Check if RLS is enabled
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'messages';

-- Query 2: View all policies on messages table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text as policy_using,
    with_check::text as policy_with_check
FROM pg_policies
WHERE tablename = 'messages';

-- Query 3: Test query performance with your actual conversation_id
-- REPLACE 'convo_1768726189807_el70kt' with your actual conversation ID
EXPLAIN ANALYZE
SELECT id, sender_id, text, type, image_uri, created_at
FROM messages
WHERE conversation_id = 'convo_1768726189807_el70kt'
ORDER BY created_at DESC
LIMIT 100;

-- Query 4: Check table size and row count
SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE relname = 'messages';
