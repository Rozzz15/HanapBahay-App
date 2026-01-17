/**
 * Migration Script
 * Run this script to migrate data from AsyncStorage to Supabase cloud storage
 * 
 * Usage:
 *   node scripts/migrate-to-cloud.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 HanapBahay Cloud Storage Migration\n');
  console.log('This script will help you migrate from AsyncStorage to Supabase cloud storage.\n');

  // Check if .env exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Error: .env file not found');
    console.log('\n📝 Please create a .env file with your Supabase credentials:');
    console.log('   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
    process.exit(1);
  }

  console.log('✅ .env file found\n');

  // Step 1: Database Migration
  console.log('📋 Step 1: Database Migration');
  console.log('─────────────────────────────');
  console.log('You need to run the SQL migration in your Supabase project.');
  console.log('File: supabase/migrations/001_cloud_storage_schema.sql\n');
  console.log('Options:');
  console.log('  1. Copy the SQL file contents and run in Supabase Dashboard → SQL Editor');
  console.log('  2. Use Supabase CLI: supabase db push\n');
  
  const dbMigrated = await question('Have you run the database migration? (yes/no): ');
  
  if (dbMigrated.toLowerCase() !== 'yes') {
    console.log('\n⚠️  Please run the database migration first, then re-run this script.');
    rl.close();
    return;
  }

  console.log('\n✅ Database migration confirmed\n');

  // Step 2: Choose Migration Approach
  console.log('📋 Step 2: Choose Migration Approach');
  console.log('─────────────────────────────────────');
  console.log('1. Gradual Migration (Recommended for Production)');
  console.log('   - Users migrate automatically on next login');
  console.log('   - Both old and new systems run simultaneously');
  console.log('   - Safer for production apps\n');
  console.log('2. Immediate Migration (Recommended for Development)');
  console.log('   - Replace all storage utilities immediately');
  console.log('   - All users switch to cloud storage at once');
  console.log('   - Faster but requires testing\n');

  const approach = await question('Choose approach (1 or 2): ');

  if (approach === '1') {
    console.log('\n📝 Gradual Migration Selected');
    console.log('─────────────────────────────\n');
    console.log('To implement gradual migration:');
    console.log('1. Open context/AuthContext.tsx');
    console.log('2. Add this import at the top:');
    console.log('   import { migrateToCloudStorage } from \'../utils/storage-migration\';');
    console.log('3. After successful login, add:');
    console.log('   const migrationResult = await migrateToCloudStorage();');
    console.log('   if (migrationResult.success) {');
    console.log('     console.log(\'✅ Data migrated to cloud\');');
    console.log('   }\n');
    console.log('✅ Users will migrate automatically on next login');
  } else if (approach === '2') {
    console.log('\n📝 Immediate Migration Selected');
    console.log('──────────────────────────────\n');
    console.log('Choose implementation method:');
    console.log('1. Replace imports manually (safer)');
    console.log('2. Rename files automatically (faster)\n');

    const method = await question('Choose method (1 or 2): ');

    if (method === '1') {
      console.log('\n📝 Manual Import Replacement');
      console.log('─────────────────────────────\n');
      console.log('Update these imports across your app:');
      console.log('\nOLD:');
      console.log('  import { ... } from \'./utils/auth-user\';');
      console.log('  import { ... } from \'./utils/property-media-cache\';');
      console.log('\nNEW:');
      console.log('  import { ... } from \'./utils/auth-user-cloud\';');
      console.log('  import { ... } from \'./utils/property-media-cache-cloud\';');
      console.log('\nAffected files:');
      console.log('  - context/AuthContext.tsx');
      console.log('  - app/login.tsx');
      console.log('  - app/sign-up.tsx');
      console.log('  - hooks/useProfileData.ts');
      console.log('  - And other files that import these utilities\n');
    } else if (method === '2') {
      console.log('\n⚠️  Automatic file replacement');
      console.log('────────────────────────────\n');
      console.log('This will:');
      console.log('1. Backup old files (rename to *-local-backup.ts)');
      console.log('2. Replace with cloud versions\n');

      const confirm = await question('Are you sure? This will modify your files. (yes/no): ');

      if (confirm.toLowerCase() === 'yes') {
        const utilsPath = path.join(__dirname, '..', 'utils');

        try {
          // Backup and replace auth-user.ts
          const authUserPath = path.join(utilsPath, 'auth-user.ts');
          const authUserBackupPath = path.join(utilsPath, 'auth-user-local-backup.ts');
          const authUserCloudPath = path.join(utilsPath, 'auth-user-cloud.ts');

          if (fs.existsSync(authUserPath)) {
            fs.renameSync(authUserPath, authUserBackupPath);
            console.log('✅ Backed up auth-user.ts → auth-user-local-backup.ts');
          }

          fs.copyFileSync(authUserCloudPath, authUserPath);
          console.log('✅ Replaced auth-user.ts with cloud version');

          // Backup and replace property-media-cache.ts
          const cachePath = path.join(utilsPath, 'property-media-cache.ts');
          const cacheBackupPath = path.join(utilsPath, 'property-media-cache-local-backup.ts');
          const cacheCloudPath = path.join(utilsPath, 'property-media-cache-cloud.ts');

          if (fs.existsSync(cachePath)) {
            fs.renameSync(cachePath, cacheBackupPath);
            console.log('✅ Backed up property-media-cache.ts → property-media-cache-local-backup.ts');
          }

          fs.copyFileSync(cacheCloudPath, cachePath);
          console.log('✅ Replaced property-media-cache.ts with cloud version');

          console.log('\n✅ Files replaced successfully!');
          console.log('\n⚠️  Important: Test your app thoroughly before deploying');
        } catch (error) {
          console.error('\n❌ Error replacing files:', error.message);
          console.log('\n💡 You can manually replace the files instead');
        }
      } else {
        console.log('\n❌ File replacement cancelled');
      }
    }
  }

  // Step 3: Testing
  console.log('\n\n📋 Step 3: Testing');
  console.log('──────────────────');
  console.log('Before deploying to production, test these features:');
  console.log('  ✓ User login and logout');
  console.log('  ✓ Property media loading');
  console.log('  ✓ User preferences saving');
  console.log('  ✓ File uploads (if applicable)');
  console.log('\nRun the app and monitor for errors:\n');
  console.log('  npm start\n');

  // Step 4: Cleanup
  console.log('📋 Step 4: Cleanup (Optional)');
  console.log('──────────────────────────────');
  console.log('After confirming everything works, you can:');
  console.log('1. Clean up AsyncStorage (in-app):');
  console.log('   import { cleanupLocalStorage } from \'./utils/storage-migration\';');
  console.log('   await cleanupLocalStorage({ keepAuthTokens: true });');
  console.log('2. Remove backup files (*-local-backup.ts)');
  console.log('3. Remove cloud utility files (*-cloud.ts) if you replaced the originals\n');

  console.log('\n✅ Migration setup complete!\n');
  console.log('📖 See CLOUD_STORAGE_MIGRATION_GUIDE.md for detailed documentation\n');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Migration script error:', error);
  process.exit(1);
});
