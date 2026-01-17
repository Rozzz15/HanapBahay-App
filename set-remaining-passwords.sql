-- ============================================================================
-- Set Passwords for Remaining Barangay Accounts
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste → Run
-- ============================================================================

-- RIZAL: Password = rizal123
UPDATE auth.users
SET encrypted_password = crypt('rizal123', gen_salt('bf'))
WHERE email = 'brgy.rizal@hanapbahay.app';

-- GOMEZ: Password = gomez123
UPDATE auth.users
SET encrypted_password = crypt('gomez123', gen_salt('bf'))
WHERE email = 'brgy.gomez@hanapbahay.app';

-- MAGSAYSAY: Password = magsaysay123
UPDATE auth.users
SET encrypted_password = crypt('magsaysay123', gen_salt('bf'))
WHERE email = 'brgy.magsaysay@hanapbahay.app';

-- ============================================================================
-- Verify all passwords are set
-- ============================================================================

SELECT 
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Password Set'
    ELSE '❌ No Password'
  END as password_status,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as email_status
FROM auth.users
WHERE email LIKE 'brgy.%@hanapbahay.app'
ORDER BY email;

-- ============================================================================
-- After running this SQL, you can login with:
-- 
-- RIZAL:      brgy.rizal@hanapbahay.app      | rizal123
-- TALOLONG:   brgy.talolong@hanapbahay.app   | talolong123
-- GOMEZ:      brgy.gomez@hanapbahay.app      | gomez123
-- MAGSAYSAY:  brgy.magsaysay@hanapbahay.app  | magsaysay123
-- ============================================================================
