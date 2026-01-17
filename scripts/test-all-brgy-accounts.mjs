/**
 * Test login for ALL Barangay accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// All barangay accounts to test
const ACCOUNTS = [
  {
    barangay: 'RIZAL',
    email: 'brgy.rizal@hanapbahay.app',
    password: 'rizal123'
  },
  {
    barangay: 'TALOLONG',
    email: 'brgy.talolong@hanapbahay.app',
    password: 'talolong123'
  },
  {
    barangay: 'GOMEZ',
    email: 'brgy.gomez@hanapbahay.app',
    password: 'gomez123'
  },
  {
    barangay: 'MAGSAYSAY',
    email: 'brgy.magsaysay@hanapbahay.app',
    password: 'magsaysay123'
  }
];

async function testLogin(account) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error) {
      return {
        success: false,
        barangay: account.barangay,
        email: account.email,
        error: error.message,
        code: error.code
      };
    }

    if (data.user) {
      // Check user profile
      const { data: userData } = await supabase
        .from('users')
        .select('name, role, barangay, phone')
        .eq('id', data.user.id)
        .single();

      // Sign out
      await supabase.auth.signOut();

      return {
        success: true,
        barangay: account.barangay,
        email: account.email,
        userId: data.user.id,
        emailConfirmed: data.user.email_confirmed_at ? true : false,
        profile: userData
      };
    }

  } catch (error) {
    return {
      success: false,
      barangay: account.barangay,
      email: account.email,
      error: error.message
    };
  }
}

async function testAllAccounts() {
  console.log('================================================================================');
  console.log('🧪 TESTING ALL BARANGAY OFFICIAL ACCOUNTS');
  console.log('================================================================================\n');

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const account of ACCOUNTS) {
    console.log(`Testing ${account.barangay}...`);
    const result = await testLogin(account);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${account.barangay} - Login successful`);
      passCount++;
    } else {
      console.log(`❌ ${account.barangay} - Login failed: ${result.error}`);
      failCount++;
    }
    console.log('');
  }

  console.log('================================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================================================\n');
  console.log(`Total Accounts: ${ACCOUNTS.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}\n`);

  console.log('================================================================================');
  console.log('📋 DETAILED RESULTS');
  console.log('================================================================================\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.barangay}`);
    console.log(`   Email:    ${result.email}`);
    
    if (result.success) {
      console.log(`   Status:   ✅ LOGIN SUCCESSFUL`);
      console.log(`   User ID:  ${result.userId}`);
      console.log(`   Email Confirmed: ${result.emailConfirmed ? '✅ Yes' : '❌ No'}`);
      if (result.profile) {
        console.log(`   Name:     ${result.profile.name}`);
        console.log(`   Role:     ${result.profile.role}`);
        console.log(`   Barangay: ${result.profile.barangay}`);
        console.log(`   Phone:    ${result.profile.phone}`);
      }
    } else {
      console.log(`   Status:   ❌ LOGIN FAILED`);
      console.log(`   Error:    ${result.error}`);
      if (result.code) {
        console.log(`   Code:     ${result.code}`);
      }
    }
    console.log('');
  });

  console.log('================================================================================\n');

  if (passCount === ACCOUNTS.length) {
    console.log('🎉 ALL TESTS PASSED! All barangay accounts are working!\n');
    console.log('You can now use these credentials to login:\n');
    ACCOUNTS.forEach(account => {
      console.log(`${account.barangay.padEnd(10)} | ${account.email.padEnd(35)} | ${account.password}`);
    });
    console.log('');
  } else {
    console.log('⚠️  SOME TESTS FAILED!\n');
    console.log('Accounts that need attention:\n');
    results.filter(r => !r.success).forEach(result => {
      console.log(`❌ ${result.barangay} (${result.email})`);
      console.log(`   Issue: ${result.error}\n`);
    });
  }

  console.log('================================================================================\n');
  
  return passCount === ACCOUNTS.length;
}

testAllAccounts()
  .then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  });
