/**
 * Script to list existing Barangay Official accounts
 * Shows emails but NOT passwords (passwords cannot be retrieved from Supabase)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dkrctrkqhunttrnkqzsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listBrgyAccounts() {
  console.log('🏛️  Listing Barangay Official Accounts\n');

  const { data: officials, error } = await supabase
    .from('users')
    .select('id, email, name, phone, barangay, role, created_at')
    .eq('role', 'brgy_official')
    .order('barangay');

  if (error) {
    console.error('❌ Error fetching accounts:', error.message);
    return;
  }

  if (!officials || officials.length === 0) {
    console.log('❌ No barangay official accounts found.');
    return;
  }

  console.log('================================================================================');
  console.log(`Found ${officials.length} Barangay Official Accounts:`);
  console.log('================================================================================\n');

  officials.forEach((official, index) => {
    console.log(`${index + 1}. ${official.barangay}:`);
    console.log(`   Email:      ${official.email}`);
    console.log(`   Name:       ${official.name}`);
    console.log(`   Phone:      ${official.phone}`);
    console.log(`   Created:    ${new Date(official.created_at).toLocaleString()}`);
    console.log(`   User ID:    ${official.id}`);
    console.log('');
  });

  console.log('================================================================================\n');
  console.log('⚠️  IMPORTANT: Passwords cannot be retrieved from the database.');
  console.log('   They were displayed only once during account creation.');
  console.log('   If passwords are lost, you need to reset them.\n');
}

listBrgyAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
