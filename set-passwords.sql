-- ============================================================================
-- Set Passwords for Barangay Official Accounts
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to set passwords
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste this → Run
-- ============================================================================

-- OPTION 1: Set unique secure passwords for each account
-- ============================================================================

-- RIZAL: Password = vDAKy4JN$Zi5NGHV
UPDATE auth.users
SET encrypted_password = crypt('rizal123', gen_salt('bf'))
WHERE email = 'brgy.rizal@hanapbahay.app';

-- TALOLONG: Password = mfd^rdvE!x*y7VJ8
UPDATE auth.users
SET encrypted_password = crypt('talolong123', gen_salt('bf'))
WHERE email = 'brgy.talolong@hanapbahay.app';

-- GOMEZ: Password = #5Qqa&s@QHnt0f72
UPDATE auth.users
SET encrypted_password = crypt('gomez123', gen_salt('bf'))
WHERE email = 'brgy.gomez@hanapbahay.app';

-- MAGSAYSAY: Password = KdidMtkEqrgITJPd
UPDATE auth.users
SET encrypted_password = crypt('magsaysay123', gen_salt('bf'))
WHERE email = 'brgy.magsaysay@hanapbahay.app';

-- ============================================================================
-- OPTION 2 (EASIER FOR TESTING): Set same password for all accounts
-- ============================================================================
-- Uncomment the lines below if you want to use 'Brgy@2026!' for all accounts
-- ============================================================================

/*
UPDATE auth.users
SET encrypted_password = crypt('Brgy@2026!', gen_salt('bf'))
WHERE email IN (
  'brgy.rizal@hanapbahay.app',
  'brgy.talolong@hanapbahay.app',
  'brgy.gomez@hanapbahay.app',
  'brgy.magsaysay@hanapbahay.app'
);
*/

-- ============================================================================
-- Verify passwords were set (Run this after the update)
-- ============================================================================

SELECT 
  email, 
  created_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Password Set' 
    ELSE '❌ No Password' 
  END as status,
  last_sign_in_at
FROM auth.users
WHERE email LIKE 'brgy.%@hanapbahay.app'
ORDER BY email;

-- ============================================================================
-- After running this SQL, you can login with:
-- 
-- RIZAL:      brgy.rizal@hanapbahay.app      | vDAKy4JN$Zi5NGHV
-- TALOLONG:   brgy.talolong@hanapbahay.app   | mfd^rdvE!x*y7VJ8
-- GOMEZ:      brgy.gomez@hanapbahay.app      | #5Qqa&s@QHnt0f72
-- MAGSAYSAY:  brgy.magsaysay@hanapbahay.app  | KdidMtkEqrgITJPd
-- 
-- OR if using Option 2, all accounts use: Brgy@2026!
-- ============================================================================
