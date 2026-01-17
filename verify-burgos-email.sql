-- ============================================================================
-- Verify BURGOS Email
-- ============================================================================
-- Run this in Supabase SQL Editor to confirm the BURGOS email
-- ============================================================================

-- Confirm BURGOS email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'brgy.burgos@hanapbahay.app';

-- Verify it was confirmed
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'brgy.burgos@hanapbahay.app';

-- ============================================================================
-- After running this, brgy.burgos@hanapbahay.app will be able to login!
-- ============================================================================
