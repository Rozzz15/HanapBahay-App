/**
 * Script to create Barangay Official accounts in Supabase
 * 
 * ⚠️ IMPORTANT: Update the email addresses and phone numbers below with real barangay official contacts
 * 
 * Run this script ONCE during initial setup to create barangay accounts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate a strong random password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * DEFAULT BARANGAY OFFICIAL ACCOUNTS FOR PRODUCTION
 * 
 * These are permanent default accounts that can be used in the app
 */
const BARANGAY_OFFICIALS = [
  {
    barangay: 'RIZAL',
    email: 'brgy.rizal@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Rizal Official',
    phone: '+639171234501',
  },
  {
    barangay: 'TALOLONG',
    email: 'brgy.talolong@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Talolong Official',
    phone: '+639171234502',
  },
  {
    barangay: 'GOMEZ',
    email: 'brgy.gomez@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Gomez Official',
    phone: '+639171234503',
  },
  {
    barangay: 'MAGSAYSAY',
    email: 'brgy.magsaysay@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Magsaysay Official',
    phone: '+639171234504',
  },
  {
    barangay: 'BURGOS',
    email: 'brgy.burgos@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Burgos Official',
    phone: '+639171234505',
  },
  {
    barangay: 'LOPEZ',
    email: 'brgy.lopez@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Lopez Official',
    phone: '+639171234506',
  },
];

async function createBarangayOfficials() {
  console.log('🏛️  Creating DEFAULT Barangay Official Accounts\n');
  console.log('📌 These accounts are for production use');
  console.log('📌 Passwords will be generated and displayed ONCE\n');

  const createdAccounts = [];

  for (const official of BARANGAY_OFFICIALS) {
    try {
      console.log(`📝 Creating account for ${official.barangay}...`);
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', official.email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking ${official.barangay}:`, checkError.message);
        continue;
      }

      if (existingUser) {
        console.log(`✅ ${official.barangay} official already exists: ${official.email}\n`);
        continue;
      }

      // Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: official.email,
        password: official.password,
        options: {
          data: {
            name: official.name,
            role: 'brgy_official',
            phone: official.phone,
          },
        },
      });

      if (authError) {
        console.error(`❌ Error creating auth for ${official.barangay}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${official.barangay}`);
        continue;
      }

      console.log(`✅ Auth account created for ${official.barangay}`);

      // Wait a bit for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user record in database
      const now = new Date().toISOString();
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: official.email,
          name: official.name,
          phone: official.phone,
          address: `${official.barangay} Street, Lopez, Quezon`,
          role: 'brgy_official',
          roles: ['brgy_official'],
          barangay: official.barangay,
          created_at: now,
          updated_at: now,
        }]);

      if (userError) {
        console.error(`❌ Error creating user record for ${official.barangay}:`, userError.message);
        continue;
      }

      console.log(`✅ ${official.barangay} official created successfully!`);
      console.log(`   Email: ${official.email}`);
      console.log(`   Password: ${official.password}\n`);

      createdAccounts.push(official);

    } catch (error) {
      console.error(`❌ Failed to create ${official.barangay} official:`, error.message);
    }
  }

  if (createdAccounts.length > 0) {
    console.log('\n================================================================================');
    console.log('🎉 DEFAULT BARANGAY ACCOUNTS CREATED!');
    console.log('================================================================================\n');
    console.log('📋 LOGIN CREDENTIALS - SAVE THESE SECURELY:\n');
    
    createdAccounts.forEach(official => {
      console.log(`${official.barangay}:`);
      console.log(`  Email:    ${official.email}`);
      console.log(`  Password: ${official.password}`);
      console.log(`  Phone:    ${official.phone}\n`);
    });
    
    console.log('================================================================================\n');
    console.log('⚠️  CRITICAL SECURITY STEPS:');
    console.log('   1. ✅ Copy these credentials to a secure password manager');
    console.log('   2. ✅ Share with barangay officials through secure channels');
    console.log('   3. ✅ Officials should change password on first login');
    console.log('   4. ⚠️  These passwords will NOT be displayed again\n');
  } else {
    console.log('\n✅ All barangay official accounts already exist!\n');
  }
}

// Run the script
createBarangayOfficials()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
