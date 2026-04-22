-- =====================================================
-- FIX: update_updated_at_column() Function Search Path
-- =====================================================
-- Issue: Function uses mutable search_path (no explicit search_path set)
-- Risk: Security vulnerability and unpredictable behavior
-- Solution: Add SET search_path to ensure deterministic name resolution
-- =====================================================

-- Drop and recreate the function with proper search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    -- Use pg_catalog.NOW() to ensure we're calling the built-in function
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add comment explaining the security improvement
COMMENT ON FUNCTION update_updated_at_column() IS 'Updates updated_at timestamp on row update (with secure search_path)';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the function was created with proper search_path:
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_updated_at_column';

-- Expected result: search_path_config should show: {"search_path=pg_catalog, public"}

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard
-- 3. Navigate to: SQL Editor (left sidebar)
-- 4. Click "New Query"
-- 5. Paste this script
-- 6. Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
-- 7. Wait for success message
-- 8. Run the verification query to confirm
-- 9. The warning should disappear within a few minutes
-- =====================================================
