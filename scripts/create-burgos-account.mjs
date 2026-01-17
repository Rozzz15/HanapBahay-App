/**
 * Script to create BURGOS Barangay Official account
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

async function createBurgosAccount() {
  console.log('🏛️  Creating BURGOS Barangay Official Account\n');

  const official = {
    barangay: 'BURGOS',
    email: 'brgy.burgos@hanapbahay.app',
    password: generateSecurePassword(),
    name: 'Barangay Burgos Official',
    phone: '+639171234505',
  };

  try {
    // Check if already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', official.email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking account:', checkError.message);
      process.exit(1);
    }

    if (existingUser) {
      console.log('✅ BURGOS official already exists:', official.email);
      console.log('   No action needed.\n');
      process.exit(0);
    }

    console.log('📝 Creating BURGOS account...');

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
      console.error('❌ Error creating auth:', authError.message);
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ No user data returned');
      process.exit(1);
    }

    console.log('✅ Auth account created');

    // Wait for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user record
    const now = new Date().toISOString();
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: official.email,
        name: official.name,
        phone: official.phone,
        address: 'Burgos Street, Lopez, Quezon',
        role: 'brgy_official',
        roles: ['brgy_official'],
        barangay: official.barangay,
        created_at: now,
        updated_at: now,
      }]);

    if (userError) {
      console.error('❌ Error creating user record:', userError.message);
      process.exit(1);
    }

    console.log('✅ BURGOS official created successfully!\n');
    console.log('================================================================================');
    console.log('📋 BURGOS ACCOUNT CREDENTIALS - SAVE THESE SECURELY:');
    console.log('================================================================================\n');
    console.log('BURGOS:');
    console.log(`  Email:    ${official.email}`);
    console.log(`  Password: ${official.password}`);
    console.log(`  Phone:    ${official.phone}\n`);
    console.log('================================================================================\n');
    console.log('⚠️  IMPORTANT:');
    console.log('   - Save this password immediately');
    console.log('   - It will NOT be displayed again');
    console.log('   - Share securely with Barangay Burgos officials\n');

  } catch (error) {
    console.error('❌ Failed to create BURGOS account:', error.message);
    process.exit(1);
  }
}

createBurgosAccount()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
