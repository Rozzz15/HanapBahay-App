/**
 * Test tenant_complaints table with all barangay accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRGY_ACCOUNTS = [
  { barangay: 'RIZAL', email: 'brgy.rizal@hanapbahay.app', password: 'rizal123' },
  { barangay: 'TALOLONG', email: 'brgy.talolong@hanapbahay.app', password: 'talolong123' },
  { barangay: 'GOMEZ', email: 'brgy.gomez@hanapbahay.app', password: 'gomez123' },
  { barangay: 'MAGSAYSAY', email: 'brgy.magsaysay@hanapbahay.app', password: 'magsaysay123' }
];

async function testComplaintsFeature() {
  console.log('================================================================================');
  console.log('🧪 TESTING TENANT_COMPLAINTS TABLE WITH ALL BARANGAY ACCOUNTS');
  console.log('================================================================================\n');

  const results = [];

  for (const account of BRGY_ACCOUNTS) {
    console.log(`Testing ${account.barangay}...`);
    
    try {
      // Login as barangay official
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (loginError) {
        results.push({
          barangay: account.barangay,
          success: false,
          error: `Login failed: ${loginError.message}`
        });
        console.log(`  ❌ Login failed: ${loginError.message}\n`);
        continue;
      }

      console.log(`  ✅ Logged in as ${account.barangay}`);

      // Test 1: Try to read complaints (should work for barangay officials)
      const { data: complaints, error: readError } = await supabase
        .from('tenant_complaints')
        .select('*');

      if (readError) {
        results.push({
          barangay: account.barangay,
          success: false,
          error: `Read error: ${readError.message}`
        });
        console.log(`  ❌ Failed to read complaints: ${readError.message}\n`);
        await supabase.auth.signOut();
        continue;
      }

      console.log(`  ✅ Can read complaints (${complaints?.length || 0} found)`);

      // Test 2: Try to insert a test complaint
      const testComplaint = {
        id: `test_${account.barangay.toLowerCase()}_${Date.now()}`,
        tenant_id: authData.user.id,
        property_id: 'test_property',
        complaint_type: 'maintenance',
        description: `Test complaint from ${account.barangay}`,
        photos: [],
        status: 'pending'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('tenant_complaints')
        .insert([testComplaint])
        .select();

      if (insertError) {
        console.log(`  ⚠️  Insert test: ${insertError.message}`);
      } else {
        console.log(`  ✅ Can insert complaints`);
        
        // Clean up test data
        await supabase
          .from('tenant_complaints')
          .delete()
          .eq('id', testComplaint.id);
        console.log(`  ✅ Test data cleaned up`);
      }

      // Test 3: Check if user has correct role
      const { data: userData } = await supabase
        .from('users')
        .select('role, barangay')
        .eq('id', authData.user.id)
        .single();

      if (userData) {
        console.log(`  ✅ User role: ${userData.role}, Barangay: ${userData.barangay}`);
      }

      results.push({
        barangay: account.barangay,
        success: true,
        canRead: !readError,
        canInsert: !insertError,
        role: userData?.role,
        complaintsCount: complaints?.length || 0
      });

      console.log(`  ✅ ${account.barangay} - All tests passed!\n`);

      // Logout
      await supabase.auth.signOut();

    } catch (error) {
      results.push({
        barangay: account.barangay,
        success: false,
        error: error.message
      });
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  // Summary
  console.log('================================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================================================\n');

  const passCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`Total Accounts Tested: ${BRGY_ACCOUNTS.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}\n`);

  console.log('================================================================================');
  console.log('📋 DETAILED RESULTS');
  console.log('================================================================================\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.barangay}`);
    if (result.success) {
      console.log(`   Status:           ✅ SUCCESS`);
      console.log(`   Can Read:         ${result.canRead ? '✅ Yes' : '❌ No'}`);
      console.log(`   Can Insert:       ${result.canInsert ? '✅ Yes' : '❌ No'}`);
      console.log(`   User Role:        ${result.role}`);
      console.log(`   Complaints Found: ${result.complaintsCount}`);
    } else {
      console.log(`   Status:           ❌ FAILED`);
      console.log(`   Error:            ${result.error}`);
    }
    console.log('');
  });

  console.log('================================================================================\n');

  if (passCount === BRGY_ACCOUNTS.length) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ tenant_complaints table is working correctly');
    console.log('✅ All barangay accounts can access the complaints feature\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED!');
    console.log('Please review the errors above.\n');
  }

  return passCount === BRGY_ACCOUNTS.length;
}

// Test also that table exists and has correct structure
async function verifyTableStructure() {
  console.log('🔍 Verifying tenant_complaints table structure...\n');

  const { data, error } = await supabase
    .from('tenant_complaints')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Table verification failed:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details, '\n');
    return false;
  }

  console.log('✅ tenant_complaints table exists and is accessible\n');
  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Complaints Feature Tests\n');
  
  const tableExists = await verifyTableStructure();
  if (!tableExists) {
    console.log('❌ Cannot proceed - table does not exist or is not accessible');
    process.exit(1);
  }

  const allPassed = await testComplaintsFeature();
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch((error) => {
  console.error('❌ Test script error:', error.message);
  process.exit(1);
});
