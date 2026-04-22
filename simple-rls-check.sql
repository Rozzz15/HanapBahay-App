-- Simple RLS Policy Check for Messages Table
-- Copy and run EACH query separately in Supabase SQL Editor

-- =====================================================
-- Query 1: Check RLS policies on messages
-- =====================================================
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'messages';


-- =====================================================
-- Query 2: Show full policy details
-- =====================================================
SELECT 
    policyname as "Policy Name",
    pg_get_expr(qual, 'messages'::regclass) as "USING Expression"
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'messages';


-- =====================================================
-- Query 3: Count total messages
-- =====================================================
SELECT COUNT(*) as total_messages FROM messages;


-- =====================================================
-- Query 4: Test if indexes are being used
-- =====================================================
SELECT 
    indexname as "Index Name",
    idx_scan as "Times Used",
    idx_tup_read as "Rows Read"
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
AND tablename = 'messages'
ORDER BY idx_scan DESC;


-- =====================================================
-- Query 5: Quick performance test (REPLACE conversation_id!)
-- =====================================================
-- IMPORTANT: Replace 'YOUR_CONVERSATION_ID' with actual ID
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, sender_id, text, type, image_uri, created_at
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY created_at DESC
LIMIT 100;
