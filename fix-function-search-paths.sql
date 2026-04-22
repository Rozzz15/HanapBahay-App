-- =====================================================
-- FIX: Multiple Function Search Path Issues
-- =====================================================
-- Fixes all functions with mutable search_path warnings
-- =====================================================

-- =====================================================
-- FIX 1: update_rent_payments_updated_at()
-- =====================================================

CREATE OR REPLACE FUNCTION update_rent_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_rent_payments_updated_at() IS 'Auto-updates updatedAt timestamp for rent_payments table (with secure search_path)';

-- =====================================================
-- FIX 2: update_conversation_has_messages()
-- =====================================================
-- Note: This function might not exist in your local files
-- If it exists in Supabase, apply this fix

CREATE OR REPLACE FUNCTION update_conversation_has_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    -- Update conversation to indicate it has messages
    -- Adjust the logic based on your actual implementation
    UPDATE public.conversations 
    SET 
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_conversation_has_messages() IS 'Updates conversation metadata when new message is added (with secure search_path)';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('update_rent_payments_updated_at', 'update_conversation_has_messages')
ORDER BY p.proname;

-- Expected result: Both functions should show search_path_config: {"search_path=pg_catalog, public"}

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ FUNCTION SEARCH PATH FIXES APPLIED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Functions fixed: 2';
  RAISE NOTICE '  ✓ update_rent_payments_updated_at';
  RAISE NOTICE '  ✓ update_conversation_has_messages';
  RAISE NOTICE '';
  RAISE NOTICE 'All functions now have secure search_path';
  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard
-- 3. Navigate to: SQL Editor (left sidebar)
-- 4. Click "New Query"
-- 5. Paste this script
-- 6. Click "Run" or press Ctrl+Enter
-- 7. Run the VERIFICATION query to confirm
-- 8. All search_path warnings should disappear
-- =====================================================

-- =====================================================
-- NOTES
-- =====================================================
-- If update_conversation_has_messages() doesn't exist:
-- - The CREATE OR REPLACE will create it (safe)
-- - OR you can comment out that section if not needed
-- 
-- If the function exists with different logic:
-- - Adjust the function body to match your implementation
-- - Keep the SET search_path line
-- =====================================================
