/**
 * Test login for Barangay accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin(email, password) {
  console.log('🔐 Testing Login...\n');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}\n`);
  console.log('Attempting login...\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log('❌ LOGIN FAILED\n');
      console.log('Error:', error.message);
      console.log('Code:', error.code || 'N/A');
      console.log('\nPossible reasons:');
      console.log('  - Password is incorrect');
      console.log('  - Email is not confirmed');
      console.log('  - Account does not exist');
      console.log('  - Account is locked\n');
      return false;
    }

    if (data.user) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('================================================================================');
      console.log('User Details:');
      console.log('================================================================================');
      console.log('User ID:     ', data.user.id);
      console.log('Email:       ', data.user.email);
      console.log('Created:     ', new Date(data.user.created_at).toLocaleString());
      console.log('Last Sign In:', data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : 'First time!');
      console.log('Email Confirmed:', data.user.email_confirmed_at ? '✅ Yes' : '❌ No');
      console.log('\nUser Metadata:');
      console.log(JSON.stringify(data.user.user_metadata, null, 2));
      console.log('\n================================================================================\n');
      
      // Now check the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.log('⚠️  User authenticated but profile not found in users table');
        console.log('Error:', userError.message);
      } else if (userData) {
        console.log('✅ User Profile Found:\n');
        console.log('Name:     ', userData.name);
        console.log('Role:     ', userData.role);
        console.log('Barangay: ', userData.barangay);
        console.log('Phone:    ', userData.phone);
        console.log('Address:  ', userData.address);
        console.log('\n================================================================================\n');
      }

      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Logged out successfully\n');
      return true;
    }

  } catch (error) {
    console.log('❌ LOGIN ERROR\n');
    console.log('Error:', error.message);
    return false;
  }
}

// Test the TALOLONG account
testLogin('brgy.talolong@hanapbahay.app', 'talolong123')
  .then((success) => {
    if (success) {
      console.log('🎉 TEST PASSED - Login credentials are working!');
      console.log('\nYou can now use these credentials in your app:');
      console.log('  Email:    brgy.talolong@hanapbahay.app');
      console.log('  Password: talolong123\n');
    } else {
      console.log('❌ TEST FAILED - Please check the credentials\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  });
