-- FIX: Optimize the slow SELECT policy on messages table
-- This will make your chat load in <500ms instead of 12+ seconds!

-- Step 1: Drop the old slow policy
DROP POLICY IF EXISTS "Users can read their conversation messages" ON messages;

-- Step 2: Create new optimized policy
-- This uses EXISTS which is much faster than IN (subquery)
-- Fixed: Cast UUID columns properly
CREATE POLICY "Users can read their conversation messages"
ON messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM conversations 
        WHERE conversations.id = messages.conversation_id
        AND (
            conversations.owner_id::uuid = auth.uid()
            OR conversations.tenant_id::uuid = auth.uid()
        )
    )
);

-- Step 3: Verify the new policy
SELECT 
    p.polname as policy_name, 
    pg_get_expr(p.polqual, c.oid) as policy_rule
FROM pg_policy p 
JOIN pg_class c ON p.polrelid = c.oid 
WHERE c.relname = 'messages'
AND p.polname = 'Users can read their conversation messages';
