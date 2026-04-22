-- Debug query to check messages table performance
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check total messages count
SELECT COUNT(*) as total_messages FROM messages;

-- 2. Check messages per conversation
SELECT 
    conversation_id,
    COUNT(*) as message_count
FROM messages
GROUP BY conversation_id
ORDER BY message_count DESC
LIMIT 10;

-- 3. Test the actual query with EXPLAIN ANALYZE
-- Replace 'your_conversation_id' with actual conversation ID
EXPLAIN ANALYZE
SELECT id, sender_id, text, type, image_uri, created_at
FROM messages
WHERE conversation_id = 'convo_1768726189807_el70kt'
ORDER BY created_at ASC;

-- 4. Check if indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'messages'
ORDER BY idx_scan DESC;

-- 5. Check table size
SELECT 
    pg_size_pretty(pg_total_relation_size('messages')) as total_size,
    pg_size_pretty(pg_relation_size('messages')) as table_size,
    pg_size_pretty(pg_indexes_size('messages')) as indexes_size;
