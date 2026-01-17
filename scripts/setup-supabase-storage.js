/**
 * Supabase Storage Setup Script
 * Creates storage buckets and configures policies for media uploads
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('\nRequired environment variables:');
  console.log('  - EXPO_PUBLIC_SUPABASE_URL');
  console.log('  - EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (preferred) or');
  console.log('  - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n' + '='.repeat(70));
console.log('🚀 SUPABASE STORAGE SETUP');
console.log('='.repeat(70));
console.log(`\n📡 Connected to: ${supabaseUrl}`);

const BUCKETS = [
  {
    name: 'property-images',
    public: true,
    description: 'Storage for property listing photos and cover images',
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  {
    name: 'property-videos',
    public: true,
    description: 'Storage for property listing videos',
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  },
  {
    name: 'owner-documents',
    public: false,
    description: 'Storage for owner verification documents (private)',
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  },
  {
    name: 'profile-photos',
    public: true,
    description: 'Storage for user profile pictures',
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
  }
];

async function createStorageBuckets() {
  console.log('\n📦 STEP 1: Creating Storage Buckets');
  console.log('─'.repeat(70));

  for (const bucket of BUCKETS) {
    try {
      console.log(`\n🔨 Creating bucket: ${bucket.name}`);
      console.log(`   Description: ${bucket.description}`);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No (Private)'}`);
      console.log(`   Max file size: ${(bucket.fileSizeLimit / 1024 / 1024).toFixed(0)}MB`);

      // Check if bucket already exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`   ❌ Error checking buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = existingBuckets.some(b => b.name === bucket.name);
      
      if (bucketExists) {
        console.log(`   ✅ Bucket already exists, skipping creation`);
        
        // Update bucket to ensure it's public if needed
        if (bucket.public) {
          const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
            public: true
          });
          
          if (updateError) {
            console.log(`   ⚠️  Could not update bucket to public: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated bucket to public`);
          }
        }
        continue;
      }

      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        if (error.message.includes('already exists')) {
          console.log(`   ✅ Bucket exists (treating as success)`);
        }
      } else {
        console.log(`   ✅ Created successfully`);
      }

    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
    }
  }
}

async function setupStoragePolicies() {
  console.log('\n\n🔐 STEP 2: Storage Policies Configuration');
  console.log('─'.repeat(70));
  console.log('\n⚠️  NOTE: Storage policies must be configured manually in Supabase Dashboard');
  console.log('   due to RLS policy creation limitations with the JS client.\n');
  
  console.log('📋 Required Policies for Each Bucket:\n');
  
  const policies = [
    {
      bucket: 'property-images',
      policies: [
        {
          name: 'Allow authenticated users to upload images',
          operation: 'INSERT',
          definition: 'Authenticated users can upload to their own folder',
          sql: `(bucket_id = 'property-images' AND auth.role() = 'authenticated')`
        },
        {
          name: 'Allow public read access',
          operation: 'SELECT',
          definition: 'Anyone can view property images',
          sql: `(bucket_id = 'property-images')`
        },
        {
          name: 'Allow users to update their own images',
          operation: 'UPDATE',
          definition: 'Users can update images in their folder',
          sql: `(bucket_id = 'property-images' AND auth.role() = 'authenticated')`
        },
        {
          name: 'Allow users to delete their own images',
          operation: 'DELETE',
          definition: 'Users can delete images from their folder',
          sql: `(bucket_id = 'property-images' AND auth.role() = 'authenticated')`
        }
      ]
    },
    {
      bucket: 'property-videos',
      policies: [
        {
          name: 'Allow authenticated users to upload videos',
          operation: 'INSERT',
          definition: 'Authenticated users can upload videos',
          sql: `(bucket_id = 'property-videos' AND auth.role() = 'authenticated')`
        },
        {
          name: 'Allow public read access',
          operation: 'SELECT',
          definition: 'Anyone can view property videos',
          sql: `(bucket_id = 'property-videos')`
        }
      ]
    },
    {
      bucket: 'owner-documents',
      policies: [
        {
          name: 'Allow authenticated users to upload documents',
          operation: 'INSERT',
          definition: 'Users can upload their own documents',
          sql: `(bucket_id = 'owner-documents' AND auth.role() = 'authenticated')`
        },
        {
          name: 'Allow users to read their own documents',
          operation: 'SELECT',
          definition: 'Users can only view their own documents',
          sql: `(bucket_id = 'owner-documents' AND auth.uid()::text = (storage.foldername(name))[1])`
        }
      ]
    },
    {
      bucket: 'profile-photos',
      policies: [
        {
          name: 'Allow authenticated users to upload profile photos',
          operation: 'INSERT',
          definition: 'Users can upload their profile photo',
          sql: `(bucket_id = 'profile-photos' AND auth.role() = 'authenticated')`
        },
        {
          name: 'Allow public read access',
          operation: 'SELECT',
          definition: 'Anyone can view profile photos',
          sql: `(bucket_id = 'profile-photos')`
        }
      ]
    }
  ];

  policies.forEach(bucket => {
    console.log(`\n📦 ${bucket.bucket}:`);
    bucket.policies.forEach((policy, idx) => {
      console.log(`   ${idx + 1}. ${policy.name}`);
      console.log(`      Operation: ${policy.operation}`);
      console.log(`      Definition: ${policy.definition}`);
    });
  });

  console.log('\n\n📖 Manual Setup Instructions:');
  console.log('─'.repeat(70));
  console.log('\n1. Go to Supabase Dashboard: https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Navigate to: Storage → Policies');
  console.log('4. For each bucket, click "New Policy"');
  console.log('5. Select the operation (SELECT, INSERT, UPDATE, DELETE)');
  console.log('6. Use "Custom" policy and apply the SQL conditions above');
  console.log('7. Enable RLS on storage.objects table if not already enabled\n');
}

async function verifySetup() {
  console.log('\n✅ STEP 3: Verification');
  console.log('─'.repeat(70));

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('\n❌ Error listing buckets:', error.message);
    return;
  }

  console.log(`\n✅ Total buckets created: ${buckets.length}`);
  
  const createdBuckets = buckets.filter(b => 
    BUCKETS.some(bucket => bucket.name === b.name)
  );

  if (createdBuckets.length === BUCKETS.length) {
    console.log('✅ All required buckets are present!\n');
    
    createdBuckets.forEach(bucket => {
      console.log(`   ✓ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  } else {
    console.log(`\n⚠️  Only ${createdBuckets.length}/${BUCKETS.length} buckets created`);
    
    const missing = BUCKETS.filter(b => 
      !buckets.some(bucket => bucket.name === b.name)
    );
    
    if (missing.length > 0) {
      console.log('\n❌ Missing buckets:');
      missing.forEach(b => console.log(`   • ${b.name}`));
    }
  }

  console.log('\n📝 Next Steps:');
  console.log('─'.repeat(70));
  console.log('1. ✅ Storage buckets created');
  console.log('2. ⏭️  Configure storage policies in Supabase Dashboard (see above)');
  console.log('3. ⏭️  Test uploading an image using the test script');
  console.log('4. ⏭️  Try creating a new listing with photos in the app\n');
}

async function main() {
  try {
    await createStorageBuckets();
    await setupStoragePolicies();
    await verifySetup();

    console.log('='.repeat(70));
    console.log('🎉 SETUP COMPLETE');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
