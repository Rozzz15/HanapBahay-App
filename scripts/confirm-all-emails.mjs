/**
 * SQL to confirm all barangay official emails
 * Since these are dummy emails, we need to manually confirm them
 */

console.log('================================================================================');
console.log('📧 CONFIRM BARANGAY OFFICIAL EMAILS');
console.log('================================================================================\n');
console.log('The login failed because the email is not confirmed.\n');
console.log('Run this SQL in Supabase SQL Editor to confirm all emails:\n');
console.log('Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu');
console.log('Location: SQL Editor → New Query → Paste → Run\n');
console.log('================================================================================\n');

const sql = `
-- Confirm all barangay official emails
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
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
  email_confirmed_at
FROM auth.users
WHERE email LIKE 'brgy.%@hanapbahay.app'
ORDER BY email;
`;

console.log(sql);
console.log('================================================================================\n');
console.log('After running this SQL:');
console.log('  1. All barangay emails will be confirmed');
console.log('  2. Login will work without email verification');
console.log('  3. Run the test again: node scripts/test-login.mjs\n');
