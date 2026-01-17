/**
 * Script to set simple temporary passwords for Barangay accounts
 * Uses a workaround: Delete and recreate accounts with known passwords
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple temporary passwords - CHANGE THESE ON FIRST LOGIN!
const TEMP_PASSWORD = 'Brgy@2026!';

const ACCOUNTS = [
  { 
    barangay: 'RIZAL',
    email: 'brgy.rizal@hanapbahay.app',
    name: 'Barangay Rizal Official',
    phone: '+639171234501'
  },
  { 
    barangay: 'TALOLONG',
    email: 'brgy.talolong@hanapbahay.app',
    name: 'Barangay Talolong Official',
    phone: '+639171234502'
  },
  { 
    barangay: 'GOMEZ',
    email: 'brgy.gomez@hanapbahay.app',
    name: 'Barangay Gomez Official',
    phone: '+639171234503'
  },
  { 
    barangay: 'MAGSAYSAY',
    email: 'brgy.magsaysay@hanapbahay.app',
    name: 'Barangay Magsaysay Official',
    phone: '+639171234504'
  }
];

async function displayCurrentPasswords() {
  console.log('================================================================================');
  console.log('🔑 TEMPORARY BARANGAY OFFICIAL PASSWORDS');
  console.log('================================================================================\n');
  console.log('⚠️  Due to Supabase rate limits, passwords cannot be automatically set.');
  console.log('   Here are the generated passwords for manual setup:\n');
  
  console.log('📋 OPTION 1: Use these generated secure passwords:\n');
  console.log('RIZAL:');
  console.log('  Email:    brgy.rizal@hanapbahay.app');
  console.log('  Password: vDAKy4JN$Zi5NGHV\n');
  
  console.log('TALOLONG:');
  console.log('  Email:    brgy.talolong@hanapbahay.app');
  console.log('  Password: mfd^rdvE!x*y7VJ8\n');
  
  console.log('GOMEZ:');
  console.log('  Email:    brgy.gomez@hanapbahay.app');
  console.log('  Password: #5Qqa&s@QHnt0f72\n');
  
  console.log('MAGSAYSAY:');
  console.log('  Email:    brgy.magsaysay@hanapbahay.app');
  console.log('  Password: KdidMtkEqrgITJPd\n');
  
  console.log('================================================================================');
  console.log('📋 OPTION 2: Set a simple temporary password for all (easier for testing):\n');
  console.log(`All accounts: ${TEMP_PASSWORD}\n`);
  
  console.log('================================================================================');
  console.log('🔧 HOW TO SET PASSWORDS MANUALLY:\n');
  console.log('Method 1: Via Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu');
  console.log('  2. Click: Authentication → Users');
  console.log('  3. Find each user by email');
  console.log('  4. Click the three dots (⋮) → "Reset Password"');
  console.log('  5. Enter one of the passwords above');
  console.log('  6. Click "Update user"\n');
  
  console.log('Method 2: Via SQL Editor (Advanced)');
  console.log('  1. Go to: SQL Editor in Supabase dashboard');
  console.log('  2. Run this SQL for each user:');
  console.log("  ```sql");
  console.log("  -- For RIZAL");
  console.log("  UPDATE auth.users");
  console.log("  SET encrypted_password = crypt('vDAKy4JN$Zi5NGHV', gen_salt('bf'))");
  console.log("  WHERE email = 'brgy.rizal@hanapbahay.app';");
  console.log("  ```\n");
  
  console.log('Method 3: Wait 24 hours and run account creation again');
  console.log('  The rate limit will reset and you can recreate with known passwords\n');
  
  console.log('================================================================================\n');
  console.log('💡 RECOMMENDED APPROACH FOR NOW:\n');
  console.log('Since you need to login immediately, use the Supabase Dashboard (Method 1)');
  console.log('to manually set these passwords. It takes about 2 minutes.\n');
  
  console.log('🚀 QUICK TEST:');
  console.log('After setting passwords, test login in your app with:');
  console.log('  Email: brgy.rizal@hanapbahay.app');
  console.log('  Password: vDAKy4JN$Zi5NGHV\n');
}

displayCurrentPasswords()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
