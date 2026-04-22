-- Test the actual query speed after RLS policy change
-- Replace YOUR_CONVERSATION_ID with your actual conversation ID

-- Test 1: Check execution time
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, sender_id, text, type, image_uri, created_at
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY created_at DESC
LIMIT 100;

-- Test 2: Verify policy is applied
SELECT 
    p.polname as policy_name, 
    pg_get_expr(p.polqual, c.oid) as policy_rule
FROM pg_policy p 
JOIN pg_class c ON p.polrelid = c.oid 
WHERE c.relname = 'messages'
AND p.polname = 'Users can read their conversation messages';
