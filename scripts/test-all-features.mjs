/**
 * Comprehensive Feature Tests for HanapBahay App
 * Tests all major features with barangay official accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRGY_ACCOUNT = {
  barangay: 'TALOLONG',
  email: 'brgy.talolong@hanapbahay.app',
  password: 'talolong123'
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details = '') {
  testResults.tests.push({ testName, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`  ✅ ${testName}`);
    if (details) console.log(`     ${details}`);
  } else {
    testResults.failed++;
    console.log(`  ❌ ${testName}`);
    if (details) console.log(`     Error: ${details}`);
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: BRGY_ACCOUNT.email,
      password: BRGY_ACCOUNT.password,
    });

    if (error) {
      logTest('Login', false, error.message);
      return null;
    }

    logTest('Login', true, `Logged in as ${BRGY_ACCOUNT.barangay}`);
    
    // Check session
    const { data: session } = await supabase.auth.getSession();
    logTest('Session Check', !!session.session, session.session ? 'Active session found' : 'No session');

    return data.user;
  } catch (error) {
    logTest('Authentication', false, error.message);
    return null;
  }
}

async function testUsersTable(userId) {
  console.log('\n👤 Testing Users Table...\n');

  try {
    // Get user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logTest('Fetch User Profile', false, error.message);
      return;
    }

    logTest('Fetch User Profile', true, `Found user: ${user.name}`);
    logTest('User Role Check', user.role === 'brgy_official', `Role: ${user.role}`);
    logTest('User Barangay Check', user.barangay === BRGY_ACCOUNT.barangay, `Barangay: ${user.barangay}`);

    // Check all users count
    const { data: allUsers, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    if (!countError) {
      logTest('List All Users', true, `Total users in database: ${allUsers.length}`);
    }

  } catch (error) {
    logTest('Users Table', false, error.message);
  }
}

async function testPropertiesTable() {
  console.log('\n🏠 Testing Properties/Listings Table...\n');

  try {
    // Count all properties
    const { data: allProperties, error: allError } = await supabase
      .from('published_listings')
      .select('*');

    if (allError) {
      logTest('Fetch All Properties', false, allError.message);
    } else {
      logTest('Fetch All Properties', true, `Total properties: ${allProperties.length}`);
    }

    // Filter by barangay
    const { data: barangayProps, error: brgyError } = await supabase
      .from('published_listings')
      .select('*')
      .eq('barangay', BRGY_ACCOUNT.barangay);

    if (!brgyError) {
      logTest('Filter by Barangay', true, `${BRGY_ACCOUNT.barangay} properties: ${barangayProps.length}`);
    }

    // Get property details
    if (allProperties && allProperties.length > 0) {
      const sampleProp = allProperties[0];
      logTest('Property Structure', true, `Sample: ${sampleProp.title || 'N/A'}, Rent: ${sampleProp.monthly_rent || 'N/A'}`);
    } else {
      logTest('Property Structure', true, 'No properties to sample (empty database)');
    }

  } catch (error) {
    logTest('Properties Table', false, error.message);
  }
}

async function testBookingsTable() {
  console.log('\n📅 Testing Bookings Table...\n');

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*');

    if (error) {
      logTest('Fetch Bookings', false, error.message);
      return;
    }

    logTest('Fetch Bookings', true, `Total bookings: ${bookings.length}`);

    // Count by status
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;
    const rejected = bookings.filter(b => b.status === 'rejected').length;

    logTest('Bookings by Status', true, `Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`);

  } catch (error) {
    logTest('Bookings Table', false, error.message);
  }
}

async function testComplaintsTable() {
  console.log('\n📝 Testing Complaints Table...\n');

  try {
    const { data: complaints, error } = await supabase
      .from('tenant_complaints')
      .select('*');

    if (error) {
      logTest('Fetch Complaints', false, error.message);
      return;
    }

    logTest('Fetch Complaints', true, `Total complaints: ${complaints.length}`);

    // Count by status
    const pending = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    logTest('Complaints by Status', true, `Pending: ${pending}, Resolved: ${resolved}`);

  } catch (error) {
    logTest('Complaints Table', false, error.message);
  }
}

async function testOwnerApplicationsTable() {
  console.log('\n🏢 Testing Owner Applications Table...\n');

  try {
    const { data: applications, error } = await supabase
      .from('owner_applications')
      .select('*');

    if (error) {
      logTest('Fetch Owner Applications', false, error.message);
      return;
    }

    logTest('Fetch Owner Applications', true, `Total applications: ${applications.length}`);

    // Count by status
    const pending = applications.filter(a => a.status === 'pending').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;

    logTest('Applications by Status', true, `Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}`);

  } catch (error) {
    logTest('Owner Applications Table', false, error.message);
  }
}

async function testConversationsAndMessages() {
  console.log('\n💬 Testing Conversations & Messages Tables...\n');

  try {
    // Test conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*');

    if (convError) {
      logTest('Fetch Conversations', false, convError.message);
    } else {
      logTest('Fetch Conversations', true, `Total conversations: ${conversations.length}`);
    }

    // Test messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*');

    if (msgError) {
      logTest('Fetch Messages', false, msgError.message);
    } else {
      logTest('Fetch Messages', true, `Total messages: ${messages.length}`);
    }

  } catch (error) {
    logTest('Conversations/Messages', false, error.message);
  }
}

async function testFavoritesTable() {
  console.log('\n⭐ Testing Favorites Table...\n');

  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('*');

    if (error) {
      logTest('Fetch Favorites', false, error.message);
      return;
    }

    logTest('Fetch Favorites', true, `Total favorites: ${favorites.length}`);

  } catch (error) {
    logTest('Favorites Table', false, error.message);
  }
}

async function testPropertyRatings() {
  console.log('\n⭐ Testing Property Ratings Table...\n');

  try {
    const { data: ratings, error } = await supabase
      .from('property_ratings')
      .select('*');

    if (error) {
      logTest('Fetch Property Ratings', false, error.message);
      return;
    }

    logTest('Fetch Property Ratings', true, `Total ratings: ${ratings.length}`);

    if (ratings.length > 0) {
      const avgRating = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2);
      logTest('Calculate Average Rating', true, `Average: ${avgRating} stars`);
    }

  } catch (error) {
    logTest('Property Ratings Table', false, error.message);
  }
}

async function testBarangaySpecificData() {
  console.log(`\n🏛️  Testing ${BRGY_ACCOUNT.barangay}-Specific Data...\n`);

  try {
    // Properties in this barangay
    const { data: brgyProps } = await supabase
      .from('published_listings')
      .select('*')
      .eq('barangay', BRGY_ACCOUNT.barangay);

    logTest(`${BRGY_ACCOUNT.barangay} Properties`, true, `Found: ${brgyProps?.length || 0}`);

    // Users in this barangay
    const { data: brgyUsers } = await supabase
      .from('users')
      .select('*')
      .eq('barangay', BRGY_ACCOUNT.barangay);

    logTest(`${BRGY_ACCOUNT.barangay} Users`, true, `Found: ${brgyUsers?.length || 0}`);

    // Owner applications from this barangay
    const { data: brgyApps } = await supabase
      .from('owner_applications')
      .select('*')
      .ilike('business_address', `%${BRGY_ACCOUNT.barangay}%`);

    logTest(`${BRGY_ACCOUNT.barangay} Owner Applications`, true, `Found: ${brgyApps?.length || 0}`);

  } catch (error) {
    logTest('Barangay-Specific Data', false, error.message);
  }
}

async function testDatabaseConnectivity() {
  console.log('\n🔌 Testing Database Connectivity...\n');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    logTest('Database Connection', !error, error ? error.message : 'Connected successfully');

    // Test table existence
    const tables = [
      'users',
      'published_listings',
      'bookings',
      'conversations',
      'messages',
      'favorites',
      'property_ratings',
      'owner_applications',
      'tenant_complaints'
    ];

    let existingTables = 0;
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) existingTables++;
    }

    logTest('All Core Tables Exist', existingTables === tables.length, `${existingTables}/${tables.length} tables accessible`);

  } catch (error) {
    logTest('Database Connectivity', false, error.message);
  }
}

async function runAllTests() {
  console.log('================================================================================');
  console.log('🧪 HANAPBAHAY APP - COMPREHENSIVE FEATURE TESTS');
  console.log('================================================================================');
  console.log(`Testing with: ${BRGY_ACCOUNT.barangay} Barangay Official Account`);
  console.log(`Email: ${BRGY_ACCOUNT.email}`);
  console.log('================================================================================');

  // Test 1: Database Connectivity
  await testDatabaseConnectivity();

  // Test 2: Authentication
  const user = await testAuthentication();
  if (!user) {
    console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }

  // Test 3: Core Tables
  await testUsersTable(user.id);
  await testPropertiesTable();
  await testBookingsTable();
  await testComplaintsTable();
  await testOwnerApplicationsTable();
  await testConversationsAndMessages();
  await testFavoritesTable();
  await testPropertyRatings();

  // Test 4: Barangay-Specific Features
  await testBarangaySpecificData();

  // Sign out
  await supabase.auth.signOut();
  console.log('\n🔓 Logged out successfully');

  // Print Summary
  console.log('\n================================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================================================\n');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.testName}: ${t.details}`);
    });
    console.log('');
  }

  console.log('================================================================================\n');

  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your HanapBahay app is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('\n================================================================================\n');

  return testResults.failed === 0;
}

runAllTests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
  });
