-- ============================================================================
-- Confirm Barangay Official Emails
-- ============================================================================
-- Run this in Supabase SQL Editor to confirm all barangay emails
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste this → Run
-- ============================================================================

-- Confirm all barangay official emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
  'brgy.rizal@hanapbahay.app',
  'brgy.talolong@hanapbahay.app',
  'brgy.gomez@hanapbahay.app',
  'brgy.magsaysay@hanapbahay.app'
);

-- Verify emails are confirmed
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email LIKE 'brgy.%@hanapbahay.app'
ORDER BY email;

-- ============================================================================
-- After running this SQL, all barangay accounts can login!
-- ============================================================================
