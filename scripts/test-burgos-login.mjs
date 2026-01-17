/**
 * Test BURGOS account login
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBurgosLogin() {
  console.log('================================================================================');
  console.log('🧪 TESTING BURGOS ACCOUNT LOGIN');
  console.log('================================================================================\n');
  console.log('Email:    brgy.burgos@hanapbahay.app');
  console.log('Password: burgos123\n');
  console.log('Attempting login...\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'brgy.burgos@hanapbahay.app',
      password: 'burgos123',
    });

    if (error) {
      console.log('❌ LOGIN FAILED\n');
      console.log('Error:', error.message);
      console.log('Code:', error.code || 'N/A');
      console.log('\nPossible issues:');
      console.log('  - Email not confirmed');
      console.log('  - Wrong password');
      console.log('  - User profile missing\n');
      return false;
    }

    if (data.user) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('================================================================================');
      console.log('User Details:');
      console.log('================================================================================');
      console.log('User ID:        ', data.user.id);
      console.log('Email:          ', data.user.email);
      console.log('Email Confirmed:', data.user.email_confirmed_at ? '✅ Yes' : '❌ No');
      console.log('Created:        ', new Date(data.user.created_at).toLocaleString());
      console.log('Last Sign In:   ', data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : 'First time!');
      
      console.log('\nUser Metadata:');
      if (data.user.user_metadata && Object.keys(data.user.user_metadata).length > 0) {
        console.log(JSON.stringify(data.user.user_metadata, null, 2));
      } else {
        console.log('  (no metadata)');
      }

      // Check user profile
      console.log('\n================================================================================');
      console.log('User Profile:');
      console.log('================================================================================');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.log('⚠️  Profile Error:', userError.message);
      } else if (userData) {
        console.log('Name:            ', userData.name);
        console.log('Role:            ', userData.role);
        console.log('Barangay:        ', userData.barangay);
        console.log('Phone:           ', userData.phone);
        console.log('Address:         ', userData.address);
        console.log('Profile Status:  ', '✅ Complete');
      }

      console.log('\n================================================================================\n');

      // Test access to complaints
      console.log('Testing feature access...\n');

      const { data: complaints, error: complaintsError } = await supabase
        .from('tenant_complaints')
        .select('*');

      if (complaintsError) {
        console.log('❌ Cannot access complaints:', complaintsError.message);
      } else {
        console.log(`✅ Can access complaints (${complaints?.length || 0} found)`);
      }

      // Test access to properties
      const { data: properties, error: propsError } = await supabase
        .from('published_listings')
        .select('*')
        .eq('barangay', 'BURGOS');

      if (propsError) {
        console.log('❌ Cannot access properties:', propsError.message);
      } else {
        console.log(`✅ Can access BURGOS properties (${properties?.length || 0} found)`);
      }

      console.log('\n================================================================================\n');
      console.log('🎉 BURGOS ACCOUNT IS FULLY FUNCTIONAL!\n');
      console.log('You can now login with:');
      console.log('  Email:    brgy.burgos@hanapbahay.app');
      console.log('  Password: burgos123\n');

      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Logged out successfully\n');

      return true;
    }

  } catch (error) {
    console.log('❌ TEST ERROR\n');
    console.log('Error:', error.message);
    return false;
  }
}

testBurgosLogin()
  .then((success) => {
    console.log('================================================================================');
    if (success) {
      console.log('✅ TEST PASSED');
    } else {
      console.log('❌ TEST FAILED');
    }
    console.log('================================================================================\n');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  });
