# 🚨 CRITICAL: 12-Second Database Query Issue

## Problem
Supabase query taking **12+ seconds** to return 100 messages. This is a **database-level issue**, not code.

## Your Supabase Details
- URL: `dkrctrkqhunttrnkqzsu.supabase.co`
- Region: Unknown (need to check in Supabase dashboard)

## Immediate Actions Required

### 1. Check RLS Policies (Most Likely Cause)

Run this in Supabase SQL Editor:
```sql
-- Check RLS policies on messages table
SELECT 
    policyname,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'messages';
```

**Look for:**
- Policies with complex JOINs or subqueries
- Policies checking other tables (conversations, users, etc.)
- Policies without proper indexes

### 2. Test Without RLS (Temporarily!)

```sql
-- DISABLE RLS temporarily to test
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Test the app now - is it fast?

-- RE-ENABLE immediately after testing
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

If fast without RLS → **RLS policies are the problem**

### 3. Check Query Plan

```sql
EXPLAIN ANALYZE
SELECT id, sender_id, text, type, image_uri, created_at
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID_HERE'
ORDER BY created_at DESC
LIMIT 100;
```

Look for:
- "Seq Scan" (bad - means no index used)
- Execution time > 100ms (slow)
- "Index Scan" (good - means index is used)

### 4. Verify Indexes Are Being Used

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as rows_read,
    idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'messages'
ORDER BY idx_scan DESC;
```

If `idx_messages_conversation_id` shows `times_used = 0`, the index isn't being used!

## Common RLS Policy Problems

### Bad Policy Example (SLOW):
```sql
-- ❌ This checks EVERY message against EVERY conversation
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
    auth.uid() IN (
        SELECT unnest(participant_ids) 
        FROM conversations 
        WHERE id = messages.conversation_id
    )
);
```

### Good Policy Example (FAST):
```sql
-- ✅ This uses the conversation_id index efficiently
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM conversations 
        WHERE conversations.id = messages.conversation_id
        AND (conversations.owner_id = auth.uid() OR conversations.tenant_id = auth.uid())
    )
);
```

## Supabase Free Tier Limits

Check if you're hitting limits:
1. Go to Supabase Dashboard → Settings → Usage
2. Check:
   - Database size
   - Bandwidth usage
   - Active connections
   - Requests per second

Free tier limits:
- 500 MB database
- 2 GB bandwidth/month
- 50 concurrent connections

## Network Test

Test Supabase connection speed:
```sql
-- Simple query to test latency
SELECT NOW();
```

- < 100ms: Good
- 100-500ms: Acceptable
- > 500ms: Network issue

## Temporary Workaround

If nothing else works, bypass RLS for messages:

```sql
-- Create a database function that bypasses RLS
CREATE OR REPLACE FUNCTION get_conversation_messages(conv_id TEXT)
RETURNS TABLE (
    id TEXT,
    sender_id TEXT,
    text TEXT,
    type TEXT,
    image_uri TEXT,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.sender_id, m.text, m.type, m.image_uri, m.created_at
    FROM messages m
    WHERE m.conversation_id = conv_id
    ORDER BY m.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated;
```

Then in your app, call this function instead of direct query.

## Next Steps

1. ✅ Run `check-messages-rls.sql` in Supabase
2. ✅ Share the RLS policies you see
3. ✅ Test with RLS disabled temporarily
4. ✅ Check Supabase dashboard for limits/throttling
5. ✅ Share EXPLAIN ANALYZE output

**The issue is 100% at the database level - we need to fix the RLS policies or indexes!**
