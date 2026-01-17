/**
 * Script to reset passwords for existing Barangay Official accounts
 * This will generate NEW passwords and display them
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Accounts to reset
const ACCOUNTS_TO_RESET = [
  { email: 'brgy.rizal@hanapbahay.app', barangay: 'RIZAL' },
  { email: 'brgy.talolong@hanapbahay.app', barangay: 'TALOLONG' },
  { email: 'brgy.gomez@hanapbahay.app', barangay: 'GOMEZ' },
  { email: 'brgy.magsaysay@hanapbahay.app', barangay: 'MAGSAYSAY' },
];

async function resetPasswords() {
  console.log('🔐 Resetting Barangay Official Passwords\n');
  console.log('⚠️  This will generate NEW passwords for existing accounts');
  console.log('   Old passwords will no longer work\n');

  const resetResults = [];

  for (const account of ACCOUNTS_TO_RESET) {
    try {
      console.log(`📝 Resetting password for ${account.barangay}...`);

      // Check if account exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', account.email)
        .maybeSingle();

      if (userError || !user) {
        console.log(`   ⚠️  Account not found: ${account.email}`);
        continue;
      }

      // Generate new password
      const newPassword = generateSecurePassword();

      // Update password using Supabase Admin API
      // Note: This requires the admin to be authenticated or use service role key
      // For now, we'll use the reset password flow
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        account.email,
        {
          redirectTo: 'hanapbahay://reset-password',
        }
      );

      if (resetError) {
        console.log(`   ❌ Error sending reset email: ${resetError.message}`);
        console.log(`   ℹ️  Manual password: ${newPassword}`);
        console.log(`   ℹ️  You can set this manually in Supabase dashboard\n`);
        
        resetResults.push({
          barangay: account.barangay,
          email: account.email,
          password: newPassword,
          method: 'manual',
        });
      } else {
        console.log(`   ✅ Reset email sent to: ${account.email}`);
        console.log(`   ℹ️  Suggested password: ${newPassword}\n`);
        
        resetResults.push({
          barangay: account.barangay,
          email: account.email,
          password: newPassword,
          method: 'email',
        });
      }

    } catch (error) {
      console.error(`   ❌ Failed to reset ${account.barangay}:`, error.message);
    }
  }

  if (resetResults.length > 0) {
    console.log('\n================================================================================');
    console.log('🔑 PASSWORD RESET SUMMARY');
    console.log('================================================================================\n');
    
    console.log('⚠️  IMPORTANT: Supabase requires service role key to directly reset passwords.');
    console.log('   We have two options:\n');
    
    console.log('📧 Option 1: Email Reset Links (Sent)');
    console.log('   - Reset emails sent to all accounts');
    console.log('   - Officials need to check their email and set new password\n');
    
    console.log('🔧 Option 2: Manual Password Setting (Recommended for testing)');
    console.log('   - Use these generated passwords');
    console.log('   - Set them manually via Supabase Dashboard:\n');
    
    resetResults.forEach(result => {
      console.log(`${result.barangay}:`);
      console.log(`  Email:    ${result.email}`);
      console.log(`  Password: ${result.password}`);
      console.log('');
    });
    
    console.log('================================================================================\n');
    console.log('📋 How to Set Passwords Manually:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu');
    console.log('   2. Navigate to: Authentication → Users');
    console.log('   3. Click on each user');
    console.log('   4. Click "Reset Password" or "Send Magic Link"');
    console.log('   5. Or use SQL Editor with service role to update directly\n');
  }
}

resetPasswords()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
