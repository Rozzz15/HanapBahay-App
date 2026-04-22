-- Performance optimization indexes for messages table
-- Run this in your Supabase SQL Editor to speed up message queries

-- Index for filtering by conversation_id (most important!)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at);

-- Composite index for filtered + sorted queries (best performance)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at);

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'messages'
ORDER BY indexname;
