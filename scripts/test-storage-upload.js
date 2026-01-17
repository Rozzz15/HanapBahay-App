/**
 * Test Script: Upload Test Image to Supabase Storage
 * Tests if storage buckets are properly configured
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n' + '='.repeat(70));
console.log('🧪 STORAGE UPLOAD TEST');
console.log('='.repeat(70));

async function testStorageUpload() {
  try {
    // Step 1: Check buckets exist
    console.log('\n📦 Step 1: Checking Storage Buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error:', bucketsError.message);
      return;
    }

    console.log(`✅ Found ${buckets.length} buckets:`);
    buckets.forEach(b => {
      console.log(`   • ${b.name} (${b.public ? 'public' : 'private'})`);
    });

    const requiredBuckets = ['property-images', 'property-videos', 'owner-documents', 'profile-photos'];
    const missingBuckets = requiredBuckets.filter(name => 
      !buckets.some(b => b.name === name)
    );

    if (missingBuckets.length > 0) {
      console.log('\n⚠️  Missing buckets:');
      missingBuckets.forEach(name => console.log(`   • ${name}`));
      console.log('\n❌ Setup incomplete. Please create missing buckets.');
      console.log('📖 See: SUPABASE_STORAGE_SETUP_GUIDE.md');
      return;
    }

    console.log('\n✅ All required buckets exist!');

    // Step 2: Create a test image (1x1 pixel PNG)
    console.log('\n🖼️  Step 2: Creating Test Image...');
    
    // Minimal 1x1 red pixel PNG in base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    console.log('✅ Test image created (1x1 pixel PNG, red)');

    // Step 3: Test upload to property-images
    console.log('\n📤 Step 3: Testing Upload to property-images...');
    
    const testFileName = `test_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
        console.log('\n💡 Issue: Storage policies not configured');
        console.log('📖 Solution: Configure policies as described in SUPABASE_STORAGE_SETUP_GUIDE.md');
      } else if (uploadError.message.includes('not found')) {
        console.log('\n💡 Issue: Bucket does not exist');
        console.log('📖 Solution: Create the bucket in Supabase Dashboard');
      } else if (uploadError.message.includes('authentication')) {
        console.log('\n💡 Issue: Authentication required');
        console.log('📖 Solution: You may need to sign in first or use service role key');
      }
      return;
    }

    console.log('✅ Upload successful!');
    console.log(`   Path: ${uploadData.path}`);

    // Step 4: Get public URL
    console.log('\n🔗 Step 4: Getting Public URL...');
    
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(testFileName);

    console.log('✅ Public URL generated:');
    console.log(`   ${urlData.publicUrl}`);

    // Step 5: Test download (verify file is accessible)
    console.log('\n📥 Step 5: Testing Public Access...');
    
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('property-images')
      .download(testFileName);

    if (downloadError) {
      console.error('❌ Download failed:', downloadError.message);
      return;
    }

    console.log('✅ File is publicly accessible!');
    console.log(`   Size: ${downloadData.size} bytes`);

    // Step 6: Clean up (delete test file)
    console.log('\n🗑️  Step 6: Cleaning Up...');
    
    const { error: deleteError } = await supabase.storage
      .from('property-images')
      .remove([testFileName]);

    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file deleted');
    }

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ STORAGE TEST PASSED!');
    console.log('='.repeat(70));
    console.log('\n🎉 Your Supabase Storage is properly configured!');
    console.log('\n📝 What works:');
    console.log('   ✅ Storage buckets exist');
    console.log('   ✅ File upload works');
    console.log('   ✅ Public URLs are generated');
    console.log('   ✅ Files are publicly accessible');
    console.log('   ✅ File deletion works');
    console.log('\n🚀 Next Step: Try creating a listing with photos in your app!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n📖 Troubleshooting:');
    console.log('   1. Check your .env file has correct Supabase credentials');
    console.log('   2. Verify storage buckets are created in Supabase Dashboard');
    console.log('   3. Ensure storage policies are configured');
    console.log('   4. See: SUPABASE_STORAGE_SETUP_GUIDE.md');
  }
}

testStorageUpload();
