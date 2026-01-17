/**
 * Script to create Barangay Official accounts in Supabase
 * 
 * ⚠️ IMPORTANT: Update the email addresses and phone numbers below with real barangay official contacts
 * 
 * Run this script ONCE during initial setup to create barangay accounts
 * 
 * Usage: npx tsx scripts/create-brgy-officials-fixed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Supabase credentials not found!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client for Node.js environment
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Generate a strong random password
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * ⚠️ UPDATE THESE EMAIL ADDRESSES AND PHONE NUMBERS BEFORE RUNNING
 * 
 * Replace with actual barangay official email addresses and contact numbers
 */
const BARANGAY_OFFICIALS = [
  {
    barangay: 'RIZAL',
    email: 'rizal.official@lopez.gov.ph', // ⚠️ UPDATE THIS EMAIL
    password: generateSecurePassword(),
    name: 'Barangay Rizal Official',
    phone: '+639171234501', // ⚠️ UPDATE THIS PHONE NUMBER
  },
  {
    barangay: 'TALOLONG',
    email: 'talolong.official@lopez.gov.ph', // ⚠️ UPDATE THIS EMAIL
    password: generateSecurePassword(),
    name: 'Barangay Talolong Official',
    phone: '+639171234502', // ⚠️ UPDATE THIS PHONE NUMBER
  },
  {
    barangay: 'GOMEZ',
    email: 'gomez.official@lopez.gov.ph', // ⚠️ UPDATE THIS EMAIL
    password: generateSecurePassword(),
    name: 'Barangay Gomez Official',
    phone: '+639171234503', // ⚠️ UPDATE THIS PHONE NUMBER
  },
  {
    barangay: 'MAGSAYSAY',
    email: 'magsaysay.official@lopez.gov.ph', // ⚠️ UPDATE THIS EMAIL
    password: generateSecurePassword(),
    name: 'Barangay Magsaysay Official',
    phone: '+639171234504', // ⚠️ UPDATE THIS PHONE NUMBER
  },
  {
    barangay: 'BURGOS',
    email: 'burgos.official@lopez.gov.ph', // ⚠️ UPDATE THIS EMAIL
    password: generateSecurePassword(),
    name: 'Barangay Burgos Official',
    phone: '+639171234505', // ⚠️ UPDATE THIS PHONE NUMBER
  },
];

async function createBarangayOfficials() {
  console.log('🏛️ Creating Barangay Official Accounts\n');
  console.log('⚠️  IMPORTANT REMINDERS:');
  console.log('   - Make sure you have updated the email addresses in the script');
  console.log('   - Secure passwords will be generated automatically');
  console.log('   - Passwords will be displayed ONCE - save them securely');
  console.log('   - Share credentials with officials through secure channels\n');
  
  // Check if using default placeholder emails
  const hasPlaceholderEmails = BARANGAY_OFFICIALS.some(o => 
    o.email.includes('@lopez.gov.ph') || o.email.includes('@hanapbahay.com')
  );
  
  if (hasPlaceholderEmails) {
    console.log('⚠️  WARNING: You are using placeholder email addresses!');
    console.log('   Please update the email addresses in the script before running in production.\n');
  }

  for (const official of BARANGAY_OFFICIALS) {
    try {
      console.log(`📝 Creating account for ${official.barangay}...`);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', official.email)
        .single();

      if (existingUser) {
        console.log(`✅ ${official.barangay} official already exists: ${official.email}`);
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
      console.log(`   Password: ${official.password}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Failed to create ${official.barangay} official:`, error);
    }
  }

  console.log('\n🎉 Barangay Officials Setup Complete!\n');
  console.log('📋 LOGIN CREDENTIALS - SAVE THESE SECURELY:');
  console.log('================================================================================');
  BARANGAY_OFFICIALS.forEach(official => {
    console.log(`\n${official.barangay}:`);
    console.log(`  Email:    ${official.email}`);
    console.log(`  Password: ${official.password}`);
    console.log(`  Phone:    ${official.phone}`);
  });
  console.log('\n================================================================================\n');
  
  console.log('⚠️  CRITICAL SECURITY STEPS:');
  console.log('   1. ✅ Save these passwords in a password manager (LastPass, 1Password, etc.)');
  console.log('   2. ✅ Share credentials with officials via secure encrypted channels');
  console.log('   3. ✅ Instruct officials to change their password on first login');
  console.log('   4. ⚠️  These passwords will NOT be displayed again');
  console.log('   5. ⚠️  Do NOT commit this output to version control\n');
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
