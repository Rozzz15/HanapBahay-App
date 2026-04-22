-- =====================================================
-- OPTIMIZE CONVERSATIONS - ADD INDEXES
-- =====================================================

-- Index for loading messages by conversation (fast!)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Index for finding conversations by participants
CREATE INDEX IF NOT EXISTS idx_conversations_owner 
ON public.conversations(owner_id);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant 
ON public.conversations(tenant_id);

-- Index for message sender lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON public.messages(sender_id);

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages')
ORDER BY tablename, indexname;

DO $$
BEGIN
    RAISE NOTICE '✓ Conversation indexes added!';
    RAISE NOTICE 'This will make message loading faster.';
END $$;
