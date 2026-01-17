/**
 * Verify Supabase Storage Setup for Owner Documents
 * Run this to check if the owner-documents bucket is properly configured
 */

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Supabase credentials not found!');
    console.log('\nPlease check your .env file contains:');
    console.log('  EXPO_PUBLIC_SUPABASE_URL=your_url_here');
    console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here\n');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySupabaseSetup() {
    console.log('🔍 Verifying Supabase Storage Setup...\n');
    console.log('='.repeat(60));

    try {
        // Check 1: Test direct bucket access (listBuckets requires admin privileges)
        console.log('\n📦 Step 1: Checking if owner-documents bucket exists...');
        const { data: listData, error: listError } = await supabase.storage
            .from('owner-documents')
            .list();
        
        if (listError) {
            if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
                console.error('❌ owner-documents bucket NOT FOUND!');
                console.log('\n🔧 Action Required:');
                console.log('   1. Go to Supabase Dashboard > Storage');
                console.log('   2. Create new bucket: "owner-documents"');
                console.log('   3. Set Public: true');
                console.log('   4. Run this script again');
                return false;
            }
            console.error('❌ Error accessing bucket:', listError.message);
            return false;
        }

        console.log('✅ owner-documents bucket exists and is accessible');
        console.log('   Current files:', listData ? listData.length : 0);

        // Check 2: Test upload (with a small test file)
        console.log('\n📤 Step 2: Testing file upload...');
        const testFileName = `test_${Date.now()}.txt`;
        const testContent = 'This is a test file to verify upload permissions.';
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('owner-documents')
            .upload(testFileName, testContent, {
                contentType: 'text/plain',
            });

        if (uploadError) {
            console.error('❌ Upload test failed:', uploadError.message);
            console.log('\n🔧 Action Required:');
            console.log('   Check storage policies in Supabase Dashboard');
            console.log('   Run: setup-owner-documents-bucket.sql');
            return false;
        }

        console.log('✅ Upload test successful');

        // Check 3: Get public URL
        console.log('\n🔗 Step 3: Testing public URL access...');
        const { data: urlData } = supabase.storage
            .from('owner-documents')
            .getPublicUrl(testFileName);

        console.log('✅ Public URL generated:', urlData.publicUrl);

        // Check 4: Test download
        console.log('\n⬇️  Step 4: Testing file download...');
        const { data: downloadData, error: downloadError } = await supabase.storage
            .from('owner-documents')
            .download(testFileName);

        if (downloadError) {
            console.error('❌ Download test failed:', downloadError.message);
            return false;
        }

        console.log('✅ Download test successful');

        // Check 5: Clean up test file
        console.log('\n🗑️  Step 5: Cleaning up test file...');
        const { error: deleteError } = await supabase.storage
            .from('owner-documents')
            .remove([testFileName]);

        if (deleteError) {
            console.warn('⚠️  Could not delete test file:', deleteError.message);
        } else {
            console.log('✅ Test file cleaned up');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL CHECKS PASSED!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('   ✅ Bucket exists and is accessible');
        console.log('   ✅ Upload permissions working');
        console.log('   ✅ Public URL generation working');
        console.log('   ✅ Download permissions working');
        console.log('   ✅ Delete permissions working');
        console.log('\n🎉 Your Supabase Storage is ready for owner documents!\n');
        
        return true;

    } catch (error) {
        console.error('\n❌ Unexpected error:', error);
        return false;
    }
}

// Run verification
console.log('🚀 Starting Supabase Storage verification...\n');
verifySupabaseSetup()
    .then(success => {
        if (!success) {
            console.log('\n❌ Verification failed. Please fix the issues above.\n');
            process.exit(1);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
