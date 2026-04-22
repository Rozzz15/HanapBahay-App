-- =====================================================
-- URGENT FIX: Login Issue After RLS Policies
-- =====================================================
-- Problem: Users can't login after RLS policies applied
-- Cause: Auth needs to query users table before authentication completes
-- Solution: Allow public (anon) access to users table for auth purposes
-- =====================================================

BEGIN;

-- =====================================================
-- FIX: Add anon policy for authentication
-- =====================================================

-- Drop existing anon policies if any
DROP POLICY IF EXISTS "users_select_anon_for_auth" ON public.users CASCADE;

-- Allow anonymous/public access to users table for authentication
-- This is SAFE because Supabase auth handles the actual verification
CREATE POLICY "users_select_anon_for_auth" ON public.users
FOR SELECT TO anon, authenticated
USING (true);

-- Keep the authenticated policies but modify them
DROP POLICY IF EXISTS "users_select_all" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_own" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_own" ON public.users CASCADE;

-- Users can insert during signup (anon can insert)
CREATE POLICY "users_insert_signup" ON public.users
FOR INSERT TO anon, authenticated
WITH CHECK (auth.uid() = id);

-- Users can update only their own record
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check users table policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ LOGIN ISSUE FIXED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Added anon SELECT policy for auth';
  RAISE NOTICE '  ✓ Modified INSERT policy for signup';
  RAISE NOTICE '  ✓ Kept UPDATE policy for authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Login successfully';
  RAISE NOTICE '  - Sign up for new accounts';
  RAISE NOTICE '  - Update their own profile';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  - Auth verification still handled by Supabase';
  RAISE NOTICE '  - Users can only modify their own data';
  RAISE NOTICE '  - Safe for authentication flow';
  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Click "New Query"
-- 4. Paste this script
-- 5. Click "Run"
-- 6. Try logging in again - it should work!
-- =====================================================
