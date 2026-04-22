-- =====================================================
-- FIX: cleanup_expired_cache() Function Search Path
-- =====================================================
-- Issue: Function uses SECURITY DEFINER without fixed search_path
-- Risk: Security vulnerability and unpredictable behavior
-- Solution: Add SET search_path and fully qualify table names
-- =====================================================

-- Drop and recreate the function with proper search_path
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Use fully qualified table name for extra safety
  DELETE FROM public.property_media_cache
  WHERE expires_at < NOW();
  
  -- Optional: Log cleanup activity
  RAISE NOTICE 'Cleaned up expired cache entries at %', NOW();
END;
$$;

-- Update function comment
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Cleans up expired cache entries automatically (with secure search_path)';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the function was created with proper search_path:
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'cleanup_expired_cache';

-- Expected result: search_path_config should show: {search_path=public,pg_catalog}

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
-- 8. The warning should disappear within a few minutes
-- =====================================================
